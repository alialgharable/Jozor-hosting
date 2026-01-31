let scene, camera, renderer, controls;
let hoodieModel = null;
let isInitialized = false;



let pendingDecalImage = null;
let decalSize = 0.55;

// MULTI-DECAL STORAGE
const decals = [];
let activeDecalId = null;
let decalsRoot = null;

// DRAG STATE
let isDraggingDecal = false;
let lastPointer = { x: 0, y: 0 };
let dragPreviewMesh = null;

// MODEL BOX
let hoodieBox = null;

// RESIZE RAF
let decalResizeRAF = null;
let resizeTimeout = null;

// ACTIVE ZONE
let activeDecalZone = "chest";

// RAYCASTING
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();


// ===============================
// DRAG PLANE STATE (NO-DRIFT DRAG)
// ===============================
let dragPlane = new THREE.Plane();
let dragStartWorld = new THREE.Vector3();
let dragStartOffset = { x: 0, y: 0 };
let dragOffsetScale = 1;

// same scale logic used in getDecalPositionForDecal()
function getOffsetScaleForZone(zoneName) {
    const box = updateHoodieBox();
    if (!box) return 1;
    const size = box.getSize(new THREE.Vector3());
    return Math.min(size.x, size.y) * 0.85;
}

function getPointerNDC(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

function intersectZonePlane(e, decal) {
    const basis = getZoneBasis(decal.zone);
    if (!basis) return null;

    // plane passes through current decal position, facing zone normal
    const planePoint = getDecalPositionForDecal(decal);
    dragPlane.setFromNormalAndCoplanarPoint(basis.n, planePoint);

    getPointerNDC(e);
    raycaster.setFromCamera(pointerNDC, camera);

    const hit = new THREE.Vector3();
    const ok = raycaster.ray.intersectPlane(dragPlane, hit);
    if (!ok) return null;

    return { hit, basis };
}

function clampDecalOffset(decal) {
    // keep decal inside zone bounds (simple clamp)
    const { maxW, maxH } = getZoneMaxSize(decal.zone);

    const w = decal.baseSize;
    const h = decal.baseSize / decal.aspectRatio;

    // allow center movement so edges stay inside maxW/maxH
    const allowX = Math.max(0, (maxW - w) * 0.5);
    const allowY = Math.max(0, (maxH - h) * 0.5);

    // convert allowed world distance -> offset units
    const oxMax = allowX / dragOffsetScale;
    const oyMax = allowY / dragOffsetScale;

    decal.offset.x = THREE.MathUtils.clamp(decal.offset.x, -oxMax, oxMax);
    decal.offset.y = THREE.MathUtils.clamp(decal.offset.y, -oyMax, oyMax);
}


// DRAG TOGGLE
let dragEnabled = true;

function setDefaultDecalSize(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return;
    decalSize = n; // this is the default size for NEXT decals
}


const DECAL_ZONES = {
    chest: {
        normal: new THREE.Vector3(0, 0, 1),
        offset: new THREE.Vector3(0, 0.52, 0.18),
        rotationY: 0,
        maxSize: 1.2
    },
    back: {
        normal: new THREE.Vector3(0, 0, -1),
        offset: new THREE.Vector3(0, 0.50, -0.22),
        rotationY: Math.PI,
        maxSize: 1.0
    },
    leftSleeve: {
        normal: new THREE.Vector3(-1, 0, 0),
        offset: new THREE.Vector3(-0.38, 0.55, -0.05),
        rotationY: Math.PI / 2,
        maxSize: 0.4
    },
    rightSleeve: {
        normal: new THREE.Vector3(1, 0, 0),
        offset: new THREE.Vector3(0.38, 0.55, -0.15),
        rotationY: -Math.PI / 2,
        maxSize: 0.4
    }
};

function setDecalRotation(deg) {
    const decal = getDecalById(activeDecalId);
    if (!decal) return;

    decal.rotation = THREE.MathUtils.degToRad(deg);

    if (decalResizeRAF) return;
    decalResizeRAF = requestAnimationFrame(() => {
        decalResizeRAF = null;
        buildDecal(decal);
        emitDecalSelected(decal);
    });
}


function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function getDecalById(id) {
    return decals.find(d => d.id === id) || null;
}

function getLastDecalIdForZone(zone) {
    for (let i = decals.length - 1; i >= 0; i--) {
        if (decals[i].zone === zone) return decals[i].id;
    }
    return null;
}

function getActiveDecal() {
    return decals.find(d => d.id === activeDecalId) || null;
}

function getActiveTextDecal() {
    const d = getActiveDecal();
    return d && d.type === "text" ? d : null;
}

function updateActiveTextDecalTexture(options = {}) {
    const decal = getActiveTextDecal();
    if (!decal) return;

    // 🔒 Preserve rotation explicitly
    const savedRotation = decal.rotation || 0;

    const {
        fontFamily = decal.textOptions?.fontFamily || "Arial",
        fontSize = decal.textOptions?.fontSize || 72,
        color = decal.textOptions?.color || "#000000",
        text = decal.text
    } = options;

    const { texture, aspectRatio } = makeTextDecalTexture(text, {
        fontFamily,
        fontSize,
        color
    });

    decal.textOptions = { fontFamily, fontSize, color };

    // replace texture safely
    if (decal.texture) decal.texture.dispose();
    decal.texture = texture;
    decal.aspectRatio = aspectRatio;
    decal.material.map = texture;
    decal.material.needsUpdate = true;

    // 🔒 RESTORE rotation
    decal.rotation = savedRotation;

    buildDecal(decal);
    emitDecalSelected(decal);
}




function setActiveDecal(id) {
    activeDecalId = id;
}

function deleteDecalById(id) {
    const index = decals.findIndex(d => d.id === id);
    if (index === -1) return;

    const decal = decals[index];

    // remove mesh group
    if (decal.group && decalsRoot) {
        decalsRoot.remove(decal.group);
        decal.group.traverse(c => {
            if (c.isMesh) {
                c.geometry?.dispose();
            }
        });
        decal.group = null;
    }

    // free GPU memory
    decal.texture?.dispose();
    decal.material?.dispose();

    // remove from decals list
    decals.splice(index, 1);

    // fix active decal
    if (activeDecalId === id) {
        activeDecalId = decals.length ? decals[decals.length - 1].id : null;
    }

    // notify UI
    if (activeDecalId) {
        emitDecalSelected(getActiveDecal());
    } else {
        window.dispatchEvent(new CustomEvent("decal:cleared"));
    }
}


function emitDecalSelected(decal) {
    if (!decal) return;

    const zoneMax = DECAL_ZONES?.[decal.zone]?.maxSize ?? 1.0;

    window.dispatchEvent(new CustomEvent("decal:selected", {
        detail: {
            id: decal.id,
            zone: decal.zone,
            size: decal.baseSize,
            min: 0.3,
            max: zoneMax
        }
    }));
}


function findDecalByMesh(obj) {
    let cur = obj;
    while (cur) {
        if (cur.userData && cur.userData.decalId) return cur.userData.decalId;
        cur = cur.parent;
    }
    return null;
}

function setDecalZone(zone) {
    if (!DECAL_ZONES[zone]) return;
    activeDecalZone = zone;

    // make slider affect last decal on this zone
    const lastId = getLastDecalIdForZone(zone);
    if (lastId) activeDecalId = lastId;
}

function setDragEnabled(enabled) {
    dragEnabled = !!enabled;

    // if user turns drag off while dragging, clean up safely
    if (!dragEnabled && isDraggingDecal) {
        onDecalPointerUp();
    }
}

const loaderEl = document.getElementById("loader");
const loaderText = document.getElementById("loader-text");

function showLoader(text = "Loading…") {
    if (!loaderEl) return;
    if (loaderText) loaderText.textContent = text;
    loaderEl.classList.remove("hidden");
}

function hideLoader(delay = 150) {
    if (!loaderEl) return;
    setTimeout(() => loaderEl.classList.add("hidden"), delay);
}

function isLowEndDevice() {
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /android|iphone|ipad|ipod/.test(ua);
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    return isMobile || memory <= 4 || cores <= 4;
}

const LOW_END = isLowEndDevice();

function createDragPreview(texture) {
    // always clean old preview (prevents duplication)
    if (dragPreviewMesh) {
        scene.remove(dragPreviewMesh);
        dragPreviewMesh.geometry.dispose();
        dragPreviewMesh.material.dispose();
        dragPreviewMesh = null;
    }
    if (!texture || !hoodieModel) return;

    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
    });

    dragPreviewMesh = new THREE.Mesh(geometry, material);
    dragPreviewMesh.renderOrder = 999;
    scene.add(dragPreviewMesh);
}

function normalizeFabricColor(hex) {
    return hex?.toLowerCase() === "#000000" ? "#111111" : hex;
}

function setHoodieColor(hexColor) {
    if (!hoodieModel) return;

    hoodieModel.traverse((child) => {
        if (child.isMesh && child.material) {
            // clone once (avoid shared material bugs)
            if (!child.material.userData.cloned) {
                child.material = child.material.clone();
                child.material.userData.cloned = true;
            }
            child.material.color.set(normalizeFabricColor(hexColor));
            child.material.needsUpdate = true;
        }
    });
}

function updateHoodieBox() {
    if (!hoodieModel) return null;
    hoodieModel.updateMatrixWorld(true);
    hoodieBox = new THREE.Box3().setFromObject(hoodieModel);
    return hoodieBox;
}

function getHoodieMeshes() {
    const meshes = [];
    if (!hoodieModel) return meshes;

    hoodieModel.traverse((child) => {
        if (child.isMesh && child.geometry) meshes.push(child);
    });
    return meshes;
}

function getZoneBasis(zoneName) {
    const zone = DECAL_ZONES[zoneName];
    if (!zone || !hoodieModel) return null;

    const n = zone.normal.clone().applyQuaternion(hoodieModel.quaternion).normalize();

    const worldUp = Math.abs(n.dot(new THREE.Vector3(0, 1, 0))) > 0.95
        ? new THREE.Vector3(1, 0, 0)
        : new THREE.Vector3(0, 1, 0);

    const right = new THREE.Vector3().crossVectors(worldUp, n).normalize();
    const up = new THREE.Vector3().crossVectors(n, right).normalize();

    return { n, right, up };
}

function getZoneMaxSize(zoneName) {
    const box = updateHoodieBox();
    if (!box) return { maxW: 1, maxH: 1 };

    const size = box.getSize(new THREE.Vector3());

    if (zoneName === "chest" || zoneName === "back") {
        return { maxW: size.x * 0.50, maxH: size.y * 0.30 };
    }
    return { maxW: size.x * 0.22, maxH: size.y * 0.20 };
}

function getDecalPositionForDecal(decal) {
    const zone = DECAL_ZONES[decal.zone];
    if (!zone || !hoodieModel) return new THREE.Vector3();

    const box = updateHoodieBox();
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const base = new THREE.Vector3(
        center.x + zone.offset.x * size.x,
        box.min.y + zone.offset.y * size.y,
        center.z + zone.offset.z * size.z
    );

    const basis = getZoneBasis(decal.zone);
    if (!basis) return base;

    const offsetScale = Math.min(size.x, size.y) * 0.85;

    base.addScaledVector(basis.right, decal.offset.x * offsetScale);
    base.addScaledVector(basis.up, decal.offset.y * offsetScale);

    // push slightly outward
    const push = Math.min(size.z, size.x) * 0.03;
    base.addScaledVector(basis.n, push);

    return base;
}

function getDecalRotationForDecal(decal) {
    const zone = DECAL_ZONES[decal.zone];
    if (!zone || !hoodieModel) return new THREE.Euler();

    const basis = getZoneBasis(decal.zone);
    if (!basis) return new THREE.Euler();

    // Base orientation (model + zone)
    const baseQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, hoodieModel.rotation.y + zone.rotationY, 0)
    );

    let userQuat;

    if (decal.zone === "leftSleeve" || decal.zone === "rightSleeve") {
        // rotate around sleeve's normal
        userQuat = new THREE.Quaternion().setFromAxisAngle(
            basis.n,
            decal.rotation || 0
        );

        // ⚠️ Flip decal 180° on sleeves to correct inversion
        const flipQuat = new THREE.Quaternion().setFromAxisAngle(
            basis.up, // rotate around sleeve's up vector
            Math.PI
        );
        userQuat.multiply(flipQuat);

    } else {
        // chest / back → rotate around normal
        userQuat = new THREE.Quaternion().setFromAxisAngle(
            basis.n,
            decal.rotation || 0
        );
    }

    const finalQuat = userQuat.multiply(baseQuat);
    return new THREE.Euler().setFromQuaternion(finalQuat);
}







function calculateImageAspectRatio(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img.width / img.height);
        img.onerror = () => resolve(1);
        img.src = url;
    });
}


function wrapLines(ctx, text, maxWidth) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = "";

    for (const w of words) {
        const test = line ? line + " " + w : w;
        if (ctx.measureText(test).width <= maxWidth) {
            line = test;
        } else {
            if (line) lines.push(line);
            line = w;
        }
    }
    if (line) lines.push(line);
    return lines;
}

function makeTextDecalTexture(text, opts = {}) {
    const {
        fontFamily = "Arial",
        fontWeight = "normal",
        fontSize = 96,               // logical px (we'll scale for DPI)
        color = "#111111",
        strokeColor = "#000000",
        strokeWidth = 10,
        background = "transparent",  // or "#ffffff"
        padding = 60,
        maxLineWidth = 900,
        align = "center",            // "left" | "center" | "right"
        lineHeight = 1.15,
        dpiScale = Math.min(window.devicePixelRatio || 1, 2) // crisp but safe
    } = opts;

    // 1) measure using a temp canvas
    const tmp = document.createElement("canvas");
    const tctx = tmp.getContext("2d");
    tctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

    const lines = wrapLines(tctx, text, maxLineWidth);
    const textWidths = lines.map(l => tctx.measureText(l).width);
    const w = Math.max(...textWidths, 1);

    const linePx = fontSize * lineHeight;
    const h = Math.max(lines.length * linePx, fontSize);

    // 2) final canvas (scaled for dpi)
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil((w + padding * 2) * dpiScale);
    canvas.height = Math.ceil((h + padding * 2) * dpiScale);

    const ctx = canvas.getContext("2d");
    ctx.scale(dpiScale, dpiScale);

    // background
    if (background && background !== "transparent") {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width / dpiScale, canvas.height / dpiScale);
    } else {
        ctx.clearRect(0, 0, canvas.width / dpiScale, canvas.height / dpiScale);
    }

    // text style
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textBaseline = "top";
    ctx.fillStyle = color;
    ctx.lineJoin = "round";

    if (strokeWidth > 0) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
    }

    // alignment
    let x;
    if (align === "left") x = padding;
    else if (align === "right") x = padding + w;
    else x = padding + w / 2;

    ctx.textAlign = align;

    // draw lines
    let y = padding;
    for (const line of lines) {
        if (strokeWidth > 0) ctx.strokeText(line, x, y);
        ctx.fillText(line, x, y);
        y += linePx;
    }

    // 3) make THREE texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;

    const aspectRatio = (canvas.width / dpiScale) / (canvas.height / dpiScale);
    return { texture, aspectRatio, canvas };
}

async function addDecalFromTexture(texture, aspectRatio, opts = {}, meta = {}) {
    if (!texture || !hoodieModel) return null;

    showLoader("Applying design…");

    const id = uid();
    const zone = activeDecalZone;

    const material = new THREE.MeshStandardMaterial({
        side: THREE.FrontSide,
        transparent: true,
        alphaTest: 0.35,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -10,
        polygonOffsetUnits: -10,
        roughness: 0.6,
        metalness: 0.0,
        map: texture
    });

    const zoneMax = DECAL_ZONES?.[zone]?.maxSize ?? 1.0;
    const requested = (typeof opts.startSize === "number" && Number.isFinite(opts.startSize))
        ? opts.startSize
        : decalSize;

    const decal = {
        id,
        zone,
        aspectRatio,
        baseSize: THREE.MathUtils.clamp(requested, 0.3, zoneMax),
        offset: { x: 0, y: 0 },
        rotation: 0,              // ✅ NEW (radians)
        texture,
        material,
        group: null,
        type: meta.type || "image",
        text: meta.text || null,
        textOptions: meta.textOptions || null
    };


    decals.push(decal);
    activeDecalId = id;

    buildDecal(decal);
    emitDecalSelected(decal);

    hideLoader();
    return id;
}

async function addTextDecal(text, options = {}, opts = {}) {
    if (!text) return null;
    if (!hoodieModel) {
        // if model not ready, you can queue it like pendingDecalImage if you want
        console.warn("Model not ready yet.");
        return null;
    }

    const { texture, aspectRatio } = makeTextDecalTexture(text, options);

    return addDecalFromTexture(texture, aspectRatio, opts, {
        type: "text",
        text,
        textOptions: options
    });
}



async function addDecal(imageURL, opts = {}) {
    if (!imageURL || !hoodieModel) {
        pendingDecalImage = imageURL;
        return;
    }

    const aspectRatio = await calculateImageAspectRatio(imageURL);

    const texture = await new Promise((resolve, reject) => {
        new THREE.TextureLoader().load(imageURL, resolve, undefined, reject);
    });

    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    return addDecalFromTexture(texture, aspectRatio, opts, { type: "image" });
}



function buildDecal(decal) {
    const hoodieMeshes = getHoodieMeshes();
    if (!hoodieMeshes.length || !decalsRoot) return;

    // remove old
    if (decal.group) {
        decalsRoot.remove(decal.group);
        decal.group.traverse(c => {
            if (c.isMesh) {
                c.geometry?.dispose();
                // material is shared → dispose only if you're deleting decal permanently
            }
        });

        decal.group = null;
    }

    const position = getDecalPositionForDecal(decal);
    const rotation = getDecalRotationForDecal(decal);

    const { maxW, maxH } = getZoneMaxSize(decal.zone);

    let width = decal.baseSize;
    let height = decal.baseSize / decal.aspectRatio;

    width = Math.min(width, maxW);
    height = Math.min(height, maxH);

    const group = new THREE.Group();
    group.name = `Decal-${decal.id}`;

    for (const mesh of hoodieMeshes) {
        const sizeVec = new THREE.Vector3(width, height, 0.5);
        const geo = new THREE.DecalGeometry(mesh, position, rotation, sizeVec);
        const m = new THREE.Mesh(geo, decal.material);
        m.userData.decalId = decal.id; // clickable selection
        group.add(m);
    }

    decal.group = group;
    decalsRoot.add(group);
}

function setDecalSize(value) {
    const decal = getDecalById(activeDecalId);
    if (!decal) return;

    showLoader("Resizing…");
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        hideLoader();
        resizeTimeout = null;
    }, 250);

    const zone = DECAL_ZONES[decal.zone];
    const max = zone?.maxSize ?? 1.0;

    decal.baseSize = THREE.MathUtils.clamp(value, 0.3, max);

    if (decalResizeRAF) return;
    decalResizeRAF = requestAnimationFrame(() => {
        decalResizeRAF = null;
        buildDecal(decal);
    });
}

function rebuildAllDecals() {
    if (!decals.length) return;
    for (const d of decals) buildDecal(d);
}

function rotateModel(angle) {
    if (!hoodieModel) return;
    hoodieModel.rotation.y = THREE.MathUtils.degToRad(angle);
    updateHoodieBox();
    rebuildAllDecals();
}

function getRendererCanvas() {
    return renderer ? renderer.domElement : null;
}


function onResize() {
    if (!renderer || !camera) return;

    const canvas = renderer.domElement;
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function animate() {
    requestAnimationFrame(animate);
    if (!renderer || !scene || !camera) return;
    if (controls) controls.update();
    renderer.render(scene, camera);
}

// ===============================
// DRAG HANDLERS
// ===============================
function onDecalPointerDown(e) {
    if (!camera || !renderer || !decalsRoot) return;

    // first: select decal by raycast on decal meshes
    getPointerNDC(e);
    raycaster.setFromCamera(pointerNDC, camera);

    const hits = raycaster.intersectObject(decalsRoot, true);
    if (!hits.length) return;

    const clickedId = findDecalByMesh(hits[0].object);
    if (!clickedId) return;

    setActiveDecal(clickedId);
    const decal = getActiveDecal();
    if (!decal) return;

    emitDecalSelected(decal);

    // drag disabled? selection only
    if (!dragEnabled) return;

    // start drag with plane intersection
    const planeHit = intersectZonePlane(e, decal);
    if (!planeHit) return;

    isDraggingDecal = true;
    if (controls) controls.enabled = false;

    dragStartWorld.copy(planeHit.hit);
    dragStartOffset = { x: decal.offset.x, y: decal.offset.y };
    dragOffsetScale = getOffsetScaleForZone(decal.zone);

    createDragPreview(decal.texture);

    if (dragPreviewMesh) {
        dragPreviewMesh.position.copy(getDecalPositionForDecal(decal));

        const basis = planeHit.basis;
        const q = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            basis.n
        );
        dragPreviewMesh.quaternion.copy(q);
        dragPreviewMesh.position.addScaledVector(basis.n, 0.002);

        dragPreviewMesh.scale.set(decal.baseSize, decal.baseSize / decal.aspectRatio, 1);
    }

    if (decal.group) decal.group.visible = false;
}


function onDecalPointerMove(e) {
    if (!dragEnabled) return;
    if (!isDraggingDecal || !dragPreviewMesh) return;

    const decal = getActiveDecal();
    if (!decal) return;

    const planeHit = intersectZonePlane(e, decal);
    if (!planeHit) return;

    const { hit, basis } = planeHit;

    // world delta on plane
    const delta = hit.clone().sub(dragStartWorld);

    // convert world delta -> decal.offset units (based on your offsetScale mapping)
    const dxWorld = delta.dot(basis.right);
    const dyWorld = delta.dot(basis.up);

    decal.offset.x = dragStartOffset.x + (dxWorld / dragOffsetScale);
    decal.offset.y = dragStartOffset.y + (dyWorld / dragOffsetScale);

    clampDecalOffset(decal);

    // update preview position/orientation
    dragPreviewMesh.position.copy(getDecalPositionForDecal(decal));
    const q = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        basis.n
    );
    dragPreviewMesh.quaternion.copy(q);
    dragPreviewMesh.position.addScaledVector(basis.n, 0.002);
}


function onDecalPointerUp() {
    if (!isDraggingDecal) return;

    const decal = getActiveDecal();

    isDraggingDecal = false;
    if (controls) controls.enabled = true;

    if (dragPreviewMesh) {
        scene.remove(dragPreviewMesh);
        dragPreviewMesh.geometry.dispose();
        dragPreviewMesh.material.dispose();
        dragPreviewMesh = null;
    }

    if (!decal) return;

    buildDecal(decal);
    emitDecalSelected(decal);

    if (decal.group) decal.group.visible = true;
}


// ===============================
// INIT
// ===============================
function init3D() {
    if (isInitialized) return;
    isInitialized = true;

    const canvas = document.getElementById("threeCanvas");
    if (!canvas) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);

    decalsRoot = new THREE.Group();
    decalsRoot.name = "DecalsRoot";
    scene.add(decalsRoot);

    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 3.2);
    camera.lookAt(0, 1.2, 0);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.powerPreference = LOW_END ? "low-power" : "high-performance";
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, LOW_END ? 1 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.6);
    keyLight.position.set(3, 5, 2);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.25);
    fillLight.position.set(-3, 3, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.35);
    rimLight.position.set(-3, 2, -4);
    scene.add(rimLight);

    const loader = new THREE.GLTFLoader();
    showLoader("Loading model…");

    loader.load(
        "/assets/models/hoodie.glb",
        (gltf) => {
            hoodieModel = gltf.scene;

            const box = new THREE.Box3().setFromObject(hoodieModel);
            const center = box.getCenter(new THREE.Vector3());

            hoodieModel.position.x -= center.x;
            hoodieModel.position.z -= center.z;
            hoodieModel.position.y -= box.min.y;
            hoodieModel.scale.set(1.5, 1.5, 1.5);

            hoodieModel.traverse((child) => {
                if (child.isMesh && child.geometry) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    if (child.material) {
                        child.material.roughness = 0.55;
                        child.material.metalness = 0.0;
                    }

                    child.geometry.computeVertexNormals();
                    child.geometry.normalizeNormals();
                }
            });

            scene.add(hoodieModel);
            hoodieModel.updateMatrixWorld(true);
            hoodieBox = new THREE.Box3().setFromObject(hoodieModel);

            if (pendingDecalImage) {
                addDecal(pendingDecalImage);
                pendingDecalImage = null;
            }

            hideLoader();
        },
        undefined,
        (error) => {
            console.error("Failed to load hoodie model:", error);
            hideLoader();
        }
    );

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.zoomSpeed = LOW_END ? 0.6 : 1.0;
    controls.minDistance = 2.5;
    controls.maxDistance = 4;
    controls.maxPolarAngle = Math.PI / 2;
    controls.target.set(0, 1.2, 0);
    controls.enableDamping = !LOW_END;
    controls.dampingFactor = 0.08;
    controls.update();

    renderer.domElement.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });

    const preview = document.querySelector(".preview-container");
    if (preview) preview.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });

    window.addEventListener("resize", onResize);

    renderer.domElement.addEventListener("pointerdown", onDecalPointerDown);
    renderer.domElement.addEventListener("pointermove", onDecalPointerMove);
    renderer.domElement.addEventListener("pointerup", onDecalPointerUp);
    renderer.domElement.addEventListener("pointerleave", onDecalPointerUp);

    animate();
}



window.Renderer3D = {
    init: init3D,
    setColor: setHoodieColor,
    rotate: rotateModel,
    addDecal,
    addTextDecal,
    setDecalSize,
    setZone: setDecalZone,
    setDragEnabled,
    setDefaultDecalSize,
    getActiveTextDecal,
    updateActiveTextDecal: updateActiveTextDecalTexture,
    setDecalRotation,
    getRendererCanvas,
    deleteDecal(id) {
        deleteDecalById(id ?? activeDecalId);
    },
    captureImage() {
        if (!renderer || !scene || !camera) return null;
        renderer.render(scene, camera);
        return renderer.domElement.toDataURL("image/png");
    }

};







