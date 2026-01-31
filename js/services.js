// services.js — 3D ONLY (FULL + FIXED)

document.addEventListener("DOMContentLoaded", function () {
    initCustomizationTool();
    initTextTab();
    initTabs(); // ✅
    initProgressSteps();
    initTooltips();
    updateCartCount();

    // ✅ FORCE 3D MODE ALWAYS
    if (window.Renderer3D && Renderer3D.init) {
        Renderer3D.init();
    }
});

/* =========================
   GLOBAL DESIGN STATE
========================= */

window.currentDesign = {
    garment: "tshirt",
    design: "none",
    text: "Your Text Here",
    font: "Arial",
    textSize: 24,
    textColor: "#000000",
    garmentColor: "#ffffff",
    designColor: "#ffffff",
    uploadedImage: null,
};

/* =========================
   CUSTOMIZATION TOOL (IMAGES + DRAG + SIZE + PLACEMENT)
========================= */

function initCustomizationTool() {
    const customTextInput = document.getElementById("customText");
    const fontFamilySelect = document.getElementById("fontFamily");
    const colorOptions = document.querySelectorAll(".color-option");
    const uploadArea = document.getElementById("uploadArea");
    const designUpload = document.getElementById("designUpload");
    const addToCartBtn = document.getElementById("addToCart");
    const dragToggleBtn = document.getElementById("dragToggleBtn");
    const sizeSlider = document.getElementById("decalSize"); // ✅ slider id
    const imageRotationSlider = document.getElementById("imageRotation");
    const textRotationSlider = document.getElementById("textRotation");

    paintFill(imageRotationSlider);
    paintFill(textRotationSlider);

    imageRotationSlider?.addEventListener("input", () => {
        Renderer3D.setDecalRotation(parseFloat(imageRotationSlider.value));
    });

    textRotationSlider?.addEventListener("input", () => {
        Renderer3D.setDecalRotation(parseFloat(textRotationSlider.value));
    });

    const deleteDecalBtn = document.getElementById("deleteDecalBtn");
    const deleteTextBtn = document.getElementById("deleteTextBtn");

    if (deleteDecalBtn) {
        deleteDecalBtn.addEventListener("click", () => {
            Renderer3D.deleteDecal();
        });
    }

    if (deleteTextBtn) {
        deleteTextBtn.addEventListener("click", () => {
            Renderer3D.deleteDecal();
        });
    }


    window.addEventListener("decal:selected", () => {
        deleteDecalBtn && (deleteDecalBtn.disabled = false);
        deleteTextBtn && (deleteTextBtn.disabled = false);
    });

    window.addEventListener("decal:cleared", () => {
        deleteDecalBtn && (deleteDecalBtn.disabled = true);
        deleteTextBtn && (deleteTextBtn.disabled = true);
    });



    // ---- slider fancy fill helper ----
    function paintFill(slider) {
        if (!slider) return;
        const min = Number(slider.min || 0);
        const max = Number(slider.max || 100);
        const val = Number(slider.value || 0);
        const pct = max === min ? 0 : ((val - min) / (max - min)) * 100;
        slider.style.setProperty("--fill", pct + "%");
    }

    // ---- Pretty range helper (optional) ----
    function bindPrettyRange(el) {
        if (!el) return;
        const update = () => {
            const min = parseFloat(el.min || "0");
            const max = parseFloat(el.max || "100");
            const val = parseFloat(el.value || "0");
            const pct = max === min ? 0 : ((val - min) / (max - min)) * 100;
            el.style.setProperty("--range-percent", `${pct}%`);
        };
        el.addEventListener("input", update);
        update();
    }
    bindPrettyRange(document.getElementById("decalSizeRange"));

    // =========================
    // DRAG TOGGLE (single setup)
    // =========================
    let dragOn = true;

    if (dragToggleBtn) {
        dragToggleBtn.textContent = "Drag: ON";
        dragToggleBtn.classList.add("active");

        // try enabling drag in renderer right away (in case it defaults off)
        if (window.Renderer3D?.setDragEnabled) {
            Renderer3D.setDragEnabled(true);
        }

        dragToggleBtn.addEventListener("click", () => {
            dragOn = !dragOn;

            dragToggleBtn.textContent = dragOn ? "Drag: ON" : "Drag: OFF";
            dragToggleBtn.classList.toggle("active", dragOn);

            if (window.Renderer3D?.setDragEnabled) {
                Renderer3D.setDragEnabled(dragOn);
            } else {
                console.warn("Renderer3D.setDragEnabled is missing in renderer3d.js");
            }
        });
    }

    // =========================
    // SIZE SLIDER (single setup)
    // =========================
    if (sizeSlider) {
        paintFill(sizeSlider);

        sizeSlider.addEventListener("input", () => {
            paintFill(sizeSlider);

            const v = parseFloat(sizeSlider.value);

            // 1) affect currently selected decal
            if (window.Renderer3D?.setDecalSize) {
                Renderer3D.setDecalSize(v);
            }

            // 2) affect next decals
            if (window.Renderer3D?.setDefaultDecalSize) {
                Renderer3D.setDefaultDecalSize(v);
            }
        });
    }

    // =========================
    // DECAL SELECTED -> SYNC SLIDER (single listener)
    // =========================
    let lastSelected = { id: null, size: null, zone: null };

    window.addEventListener("decal:selected", (e) => {
        const d = e.detail || {};
        if (!d.id) return;

        // don’t spam if same selection and same size
        if (d.id === lastSelected.id && d.size === lastSelected.size && d.zone === lastSelected.zone) return;
        lastSelected = { id: d.id, size: d.size, zone: d.zone };

        // update slider bounds + value
        if (sizeSlider) {
            if (d.min != null) sizeSlider.min = d.min;
            if (d.max != null) sizeSlider.max = d.max;
            if (d.size != null) sizeSlider.value = d.size;
            paintFill(sizeSlider);
        }

        const zone = d.zone || "";
        const nice =
            zone === "leftSleeve" ? "Left Sleeve" :
                zone === "rightSleeve" ? "Right Sleeve" :
                    zone ? zone.charAt(0).toUpperCase() + zone.slice(1) : "Unknown";

        showNotification(`✅ Decal selected (${nice})`, "info");

        const decal = window.Renderer3D?.getActiveDecal?.();
        if (!decal || typeof decal.rotation !== "number") return;

        const deg = THREE.MathUtils.radToDeg(decal.rotation);

        // image decal
        if (decal.type === "image" && imageRotationSlider) {
            imageRotationSlider.value = deg;
            paintFill(imageRotationSlider);
        }

        // text decal
        if (decal.type === "text" && textRotationSlider) {
            textRotationSlider.value = deg;
            paintFill(textRotationSlider);
        }


    });

    // =========================
    // IMAGE PLACEMENT BUTTONS (Chest / Back / Sleeves)
    // =========================
    const placementBtns = document.querySelectorAll(".placement-btn");
    const placementLabel = document.getElementById("placementLabel");

    if (placementBtns.length) {
        placementBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                placementBtns.forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");

                const zone = btn.dataset.zone;

                if (window.Renderer3D?.setZone) {
                    Renderer3D.setZone(zone);
                } else if (window.setDecalZone) {
                    setDecalZone(zone);
                }

                if (placementLabel) {
                    const nice =
                        zone === "leftSleeve"
                            ? "Left Sleeve"
                            : zone === "rightSleeve"
                                ? "Right Sleeve"
                                : zone.charAt(0).toUpperCase() + zone.slice(1);
                    placementLabel.textContent = nice;
                }
            });
        });
    }

    // Text input (store only; 3D handled in initTextTab)
    if (customTextInput) {
        customTextInput.addEventListener("input", (e) => {
            currentDesign.text = e.target.value || "";
        });
    }

    // Font (store only; 3D handled in initTextTab)
    if (fontFamilySelect) {
        fontFamilySelect.addEventListener("change", (e) => {
            currentDesign.font = e.target.value;
        });
    }

    // Colors
    colorOptions.forEach((option) => {
        option.addEventListener("click", () => {
            const color = option.dataset.color;
            const label =
                option.closest(".form-group")?.querySelector("label")?.textContent || "";

            if (label.includes("Garment")) {
                currentDesign.garmentColor = color;
                if (window.Renderer3D?.setColor) Renderer3D.setColor(color);
            } else if (label.includes("Design")) {
                currentDesign.designColor = color;
            } else {
                currentDesign.textColor = color;
            }

            option.parentElement
                .querySelectorAll(".color-option")
                .forEach((o) => o.classList.remove("active"));

            option.classList.add("active");
        });
    });

    // Upload image
    if (uploadArea && designUpload) {
        uploadArea.addEventListener("click", () => designUpload.click());

        designUpload.addEventListener("change", (e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
        });
    }

    function handleFileUpload(file) {
        if (!file.type.startsWith("image/")) {
            showNotification("Please upload an image file", "error");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showNotification("Max file size is 5MB", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            currentDesign.uploadedImage = reader.result;
            currentDesign.design = "custom";

            const startSize = sizeSlider ? parseFloat(sizeSlider.value) : null;

            if (window.Renderer3D?.addDecal) {
                Renderer3D.addDecal(reader.result, { startSize });
            }

            showNotification("Design applied in 3D", "success");

            if (designUpload) designUpload.value = "";
        };
        reader.readAsDataURL(file);
    }

    addToCartBtn?.addEventListener("click", addToCart);
}

/* =========================
   TEXT TAB (FIXED: placement buttons + no duplicates)
========================= */

function initTextTab() {
    const tab = document.getElementById("textTab");
    if (!tab) return;

    const input = document.getElementById("customText");
    const fontSel = document.getElementById("fontFamily");
    const sizeRange = document.getElementById("textSize");
    const sizeValue = document.getElementById("textSizeValue");
    const applyTextBtn = document.getElementById("applyTextBtn");
    const colorOptions = tab.querySelectorAll(".color-option");
    const textPlacementBtns = tab.querySelectorAll(".text-placement-btn");


    let textState = {
        text: (input?.value || "").trim(),
        fontFamily: fontSel?.value || "Arial",
        fontSize: parseInt(sizeRange?.value || "72", 10),
        color: tab.querySelector(".color-option.active")?.dataset.color || "#000000",
    };

    // ✅ prevent accidental creation / duplicates:
    // only allow live updates AFTER first Apply

    // ✅ text placement zone (defaults chest)
    let textZone = "chest";

    function updateActiveTextDecal() {
        const text = String(input?.value || "").trim();
        if (!text) return;

        window.Renderer3D?.updateActiveTextDecal?.({
            text,
            fontFamily: textState.fontFamily,
            fontSize: textState.fontSize,
            color: textState.color
        });
    }


    applyTextBtn?.addEventListener("click", () => {
        const text = (input?.value || "").trim();
        if (!text) {
            showNotification("Please enter some text", "info");
            return;
        }

        // 🔥 IMPORTANT: tell renderer which zone to use
        if (window.Renderer3D?.setZone) {
            Renderer3D.setZone(textZone);
        }

        window.Renderer3D.addTextDecal(
            text,
            {
                fontFamily: textState.fontFamily,
                fontSize: textState.fontSize,
                color: textState.color
            },
            {
                startSize: parseFloat(document.getElementById("decalSize")?.value || 0.5)
            }
        );

        showNotification("Text added to hoodie", "success");
    });


    // Enter key applies
    input?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            applyTextBtn?.click();
        }
    });

    // FONT change => update only if already applied once
    fontSel?.addEventListener("change", () => {
        textState.fontFamily = fontSel.value;
        updateActiveTextDecal();
    });


    // SIZE change => update only if already applied once
    sizeRange?.addEventListener("input", () => {
        textState.fontSize = parseInt(sizeRange.value, 10);
        if (sizeValue) sizeValue.textContent = `${textState.fontSize}px`;
        updateActiveTextDecal();
    });


    // COLOR change => update only if already applied once
    colorOptions.forEach(opt => {
        opt.addEventListener("click", () => {
            colorOptions.forEach(o => o.classList.remove("active"));
            opt.classList.add("active");

            textState.color = opt.dataset.color || "#000000";
            updateActiveTextDecal();
        });
    });


    // ✅ TEXT PLACEMENT BUTTONS (your HTML)
    // TEXT PLACEMENT BUTTONS (your HTML)
    if (textPlacementBtns.length) {
        textPlacementBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                // UI active
                textPlacementBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");

                // update zone
                textZone = btn.dataset.zone || "chest";

                // 🔥 move/update ACTIVE text decal
                updateActiveTextDecal();
            });
        });
    }


    if (sizeValue) sizeValue.textContent = `${textState.fontSize}px`;

    // ✅ DO NOT auto-apply on load (prevents unwanted decal creation)
}

/* =========================
   CART
========================= */

function addToCart() {
    if (!currentDesign || !window.Renderer3D) return;

    // 📸 take snapshot from 3D
    const previewImage = Renderer3D.captureImage?.();

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart.push({
        id: `custom_${Date.now()}`,
        name: "Custom Hoodie",
        price: 49.99,
        preview: previewImage, // 👈 THIS is new
        design: { ...currentDesign },
        quantity: 1,
    });

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    showNotification("Added to cart", "success");
}



function initTabs() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    if (!tabButtons.length || !tabContents.length) return;

    tabButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            tabButtons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            tabContents.forEach((tab) => tab.classList.remove("active"));

            const tabName = btn.dataset.tab; // design | text | colors
            const target = document.getElementById(`${tabName}Tab`);

            if (target) target.classList.add("active");
        });
    });
}

/* =========================
   UI HELPERS
========================= */

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);

    const el = document.querySelector(".cart-count");
    if (el) el.textContent = count;
}

function showNotification(text, type = "info") {
    const n = document.createElement("div");
    n.textContent = text;

    const bg =
        type === "error" ? "#ef4444" : type === "info" ? "#3b82f6" : "#10b981";

    n.style.cssText = `
      position: fixed;
      top: 90px;
      right: 20px;
      padding: 14px 20px;
      border-radius: 10px;
      color: white;
      background: ${bg};
      z-index: 9999;
      animation: fadeOut 2.2s forwards;
  `;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 2200);
}

/* =========================
   PROGRESS (optional UI)
========================= */

function initProgressSteps() {
    document.querySelectorAll(".step").forEach((step) => {
        step.addEventListener("click", () => {
            updateProgressSteps(step.dataset.step);
        });
    });
}

function updateProgressSteps(active) {
    document.querySelectorAll(".step").forEach((step) => {
        step.classList.toggle("active", step.dataset.step === active);
    });
}

/* =========================
   TOOLTIPS
========================= */

function initTooltips() {
    document.querySelectorAll("[data-tooltip]").forEach((el) => {
        el.addEventListener("mouseenter", () => {
            const t = document.createElement("div");
            t.className = "tooltip";
            t.textContent = el.dataset.tooltip;
            el.appendChild(t);
        });

        el.addEventListener("mouseleave", () => {
            el.querySelector(".tooltip")?.remove();
        });
    });
}

/* =========================
   ANIMATIONS
========================= */

if (!document.getElementById("svc-animations")) {
    const style = document.createElement("style");
    style.id = "svc-animations";
    style.textContent = `
      @keyframes fadeOut {
          0% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
      }
  `;
    document.head.appendChild(style);
}
