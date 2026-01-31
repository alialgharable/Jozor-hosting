// home.js - Updated Home Page JavaScript

document.addEventListener('DOMContentLoaded', function () {
    // Initialize cart count
    updateCartCount();

    // Animate stats counter
    animateStatsCounter();

    // Load collections
    loadCollections();

    // Load best sellers
    loadBestSellers();

    // Load testimonials
    loadTestimonials();

    // Initialize hero slider
    initHeroSlider();

    // Language switcher
    const langBtn = document.querySelector('.lang-btn');
    if (langBtn) {
        langBtn.addEventListener('click', function () {
            showNotification('Arabic language support coming soon!');
        });
    }
});

// Function to animate stats counter
function animateStatsCounter() {
    const statNumbers = document.querySelectorAll('.stat-number');

    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-count'));
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            stat.textContent = Math.floor(current);
        }, 30);
    });
}

// Function to load collections
function loadCollections() {
    const collectionsGrid = document.getElementById('collectionsGrid');
    if (!collectionsGrid) return;

    const collections = [
        {
            id: 1,
            name: "Keffiyeh Collection",
            description: "Traditional Palestinian patterns reimagined for modern fashion.",
            image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            items: 24
        },
        {
            id: 2,
            name: "Olive Branch Series",
            description: "Symbols of peace and resilience in every stitch.",
            image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            items: 18
        },
        {
            id: 3,
            name: "Al-Quds Designs",
            description: "Celebrating Jerusalem through beautiful embroidery.",
            image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            items: 15
        }
    ];

    collectionsGrid.innerHTML = collections.map(collection => `
            <div class="collection-card">
                <div class="collection-image" style="background-image: url('${collection.image}')">
                    <div class="collection-overlay">
                        <h3 style="color: white; margin: 0;">${collection.name}</h3>
                    </div>
                </div>
                <div class="collection-info">
                    <h3>${collection.name}</h3>
                    <p>${collection.description}</p>
                    <a href="product.html?collection=${collection.id}" class="btn btn-outline">
                        <i class="fas fa-arrow-right"></i> View ${collection.items} Items
                    </a>
                </div>
            </div>
        `).join('');
}

let currentProductPage = 0;
const productsPerPage = 8;

// Function to load best sellers
async function loadBestSellers() {
    const bestSellersGrid = document.getElementById('bestSellersGrid');
    if (!bestSellersGrid) return;

    try {
        // Fetch products from JSON file
        const response = await fetch('data/products.json');
        const data = await response.json();
        const allProducts = data.products;

        // Load wishlist from localStorage
        const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

        // Store all products globally for pagination
        window.allProducts = allProducts;

        // Initialize pagination
        initProductPagination(allProducts);

        // Load first page
        loadProductPage(0);

    } catch (error) {
        console.error('Error loading best sellers:', error);
        // Fallback to hardcoded products if JSON fails
        loadFallbackBestSellers();
    }
}


function initProductPagination(products) {
    const totalPages = Math.ceil(products.length / productsPerPage);
    const pageNumbersContainer = document.getElementById('productPageNumbers');
    const prevBtn = document.getElementById('prevProducts');
    const nextBtn = document.getElementById('nextProducts');

    if (!pageNumbersContainer || !prevBtn || !nextBtn) return;

    // Clear existing page numbers
    pageNumbersContainer.innerHTML = '';

    // Create page number buttons
    for (let i = 0; i < totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number ${i === 0 ? 'active' : ''}`;
        pageBtn.textContent = i + 1;
        pageBtn.setAttribute('data-page', i);

        pageBtn.addEventListener('click', function () {
            const page = parseInt(this.getAttribute('data-page'));
            loadProductPage(page);
        });

        pageNumbersContainer.appendChild(pageBtn);
    }

    // Add event listeners for prev/next buttons
    prevBtn.addEventListener('click', function () {
        if (currentProductPage > 0) {
            loadProductPage(currentProductPage - 1);
        }
    });

    nextBtn.addEventListener('click', function () {
        if (currentProductPage < totalPages - 1) {
            loadProductPage(currentProductPage + 1);
        }
    });

    // Update button states
    updatePaginationButtons();
}


function loadProductPage(page) {
    const bestSellersGrid = document.getElementById('bestSellersGrid');
    if (!bestSellersGrid || !window.allProducts) return;

    // Update current page
    currentProductPage = page;

    // Calculate start and end indices
    const startIndex = page * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const pageProducts = window.allProducts.slice(startIndex, endIndex);

    // Load wishlist from localStorage
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

    // Clear the grid
    bestSellersGrid.innerHTML = '';

    // Create product cards for the current page
    pageProducts.forEach((product, index) => {
        // Check if product is in wishlist
        product.isWishlisted = wishlist.includes(product.id);

        // Generate stars HTML
        const starsHTML = generateStars(product.rating);

        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.style.animationDelay = `${index * 0.1}s`;

        productCard.innerHTML = `
                <div class="product-image">
                    <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
                    ${product.originalPrice ? '<span class="product-badge">SALE</span>' : ''}
                    <div class="product-actions">
                        <button class="wishlist-btn ${product.isWishlisted ? 'active' : ''}" data-id="${product.id}">
                            <i class="${product.isWishlisted ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                        <button class="quick-view" data-id="${product.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">
                        <span class="current-price">$${product.price.toFixed(2)}</span>
                        ${product.originalPrice ?
                `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>` :
                ''
            }
                    </div>
                    <div class="product-rating">
                        ${starsHTML}
                        <span>(${product.reviewCount})</span>
                    </div>
                    <div class="product-colors">
                        ${product.colors.slice(0, 3).map(color => `
                            <div class="color-dot" style="background-color: ${color.hex}" title="${color.name}"></div>
                        `).join('')}
                        ${product.colors.length > 3 ?
                `<span style="color: var(--text-light); font-size: 0.9rem;">+${product.colors.length - 3}</span>` :
                ''
            }
                    </div>
                    <button class="add-to-cart-btn" data-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            `;

        bestSellersGrid.appendChild(productCard);
    });

    // Add event listeners to product cards
    addProductEventListeners();

    // Update pagination UI
    updatePaginationUI();

    // Update button states
    updatePaginationButtons();
}

// Function to update pagination UI
function updatePaginationUI() {
    const pageNumbers = document.querySelectorAll('.page-number');
    pageNumbers.forEach(btn => {
        const page = parseInt(btn.getAttribute('data-page'));
        btn.classList.toggle('active', page === currentProductPage);
    });
}

function updatePaginationButtons() {
    const prevBtn = document.getElementById('prevProducts');
    const nextBtn = document.getElementById('nextProducts');

    if (!prevBtn || !nextBtn || !window.allProducts) return;

    const totalPages = Math.ceil(window.allProducts.length / productsPerPage);

    prevBtn.disabled = currentProductPage === 0;
    nextBtn.disabled = currentProductPage === totalPages - 1;
}




function loadFallbackBestSellers() {
    const bestSellersGrid = document.getElementById('bestSellersGrid');
    if (!bestSellersGrid) return;

    // Create 16 fallback products
    const fallbackProducts = [
        {
            id: 1,
            name: "Palestinian Keffiyeh T-Shirt",
            price: 34.99,
            originalPrice: 44.99,
            rating: 4.8,
            reviewCount: 142,
            image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            colors: ["#000000", "#556B2F", "#CE1126"],
            isWishlisted: false
        },
        {
            id: 2,
            name: "Olive Branch Hoodie",
            price: 59.99,
            rating: 4.9,
            reviewCount: 89,
            image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            colors: ["#556B2F", "#36454F", "#C2B280"],
            isWishlisted: false
        },
        {
            id: 3,
            name: "Palestine Map Sweatshirt",
            price: 49.99,
            rating: 4.7,
            reviewCount: 203,
            image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            colors: ["#000000", "#FFFFFF", "#CE1126"],
            isWishlisted: false
        },
        {
            id: 4,
            name: "Traditional Tatreez Cap",
            price: 29.99,
            rating: 4.6,
            reviewCount: 67,
            image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            colors: ["#000000", "#FFFFFF", "#000080"],
            isWishlisted: false
        },
        {
            id: 5,
            name: "Al-Quds Embroidered Jacket",
            price: 79.99,
            originalPrice: 89.99,
            rating: 4.9,
            reviewCount: 54,
            image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            colors: ["#000000", "#4B5320", "#00008B"],
            isWishlisted: false
        },
        {
            id: 6,
            name: "Freedom Fighter T-Shirt",
            price: 39.99,
            rating: 4.8,
            reviewCount: 178,
            image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            colors: ["#FFFFFF", "#000000", "#CE1126"],
            isWishlisted: false
        },
        {
            id: 7,
            name: "Handala Graphic Hoodie",
            price: 64.99,
            rating: 4.7,
            reviewCount: 92,
            image: "https://images.unsplash.com/photo-1527718641255-324f8e2d0420?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            colors: ["#000000", "#333333", "#666666"],
            isWishlisted: false
        },
        {
            id: 8,
            name: "Palestinian Flag Sweater",
            price: 54.99,
            originalPrice: 64.99,
            rating: 4.9,
            reviewCount: 121,
            image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            colors: ["#000000", "#FFFFFF", "#009639"],
            isWishlisted: false
        },
        // Add 8 more products to reach 16
        {
            id: 9,
            name: "Keffiyeh Pattern Polo",
            price: 44.99,
            rating: 4.5,
            reviewCount: 76,
            image: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            colors: ["#FFFFFF", "#000000", "#CE1126"],
            isWishlisted: false
        },
        {
            id: 10,
            name: "Olive Leaf Tank Top",
            price: 29.99,
            rating: 4.6,
            reviewCount: 45,
            image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            colors: ["#FFFFFF", "#556B2F", "#000000"],
            isWishlisted: false
        },
        {
            id: 11,
            name: "Palestine Heritage Sweatshirt",
            price: 59.99,
            originalPrice: 69.99,
            rating: 4.8,
            reviewCount: 134,
            image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            colors: ["#000000", "#333333", "#CE1126"],
            isWishlisted: false
        },
        {
            id: 12,
            name: "Tatreez Embroidered Beanie",
            price: 24.99,
            rating: 4.4,
            reviewCount: 89,
            image: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            colors: ["#000000", "#FFFFFF", "#CE1126"],
            isWishlisted: false
        },
        {
            id: 13,
            name: "Palestinian Sunset T-Shirt",
            price: 36.99,
            rating: 4.7,
            reviewCount: 103,
            image: "https://images.unsplash.com/photo-1527718641255-324f8e2d0420?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            colors: ["#000000", "#FF6B35", "#FFE400"],
            isWishlisted: false
        },
        {
            id: 14,
            name: "Resistance Hoodie",
            price: 69.99,
            rating: 4.9,
            reviewCount: 156,
            image: "https://images.unsplash.com/photo-1558769132-cb1a40ed0ada?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            colors: ["#000000", "#CE1126", "#FFFFFF"],
            isWishlisted: false
        },
        {
            id: 15,
            name: "Al-Aqsa Mosque T-Shirt",
            price: 39.99,
            originalPrice: 49.99,
            rating: 4.8,
            reviewCount: 167,
            image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            colors: ["#FFFFFF", "#000000", "#009639"],
            isWishlisted: false
        },
        {
            id: 16,
            name: "Palestinian Farmer Jumper",
            price: 49.99,
            rating: 4.6,
            reviewCount: 78,
            image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            colors: ["#556B2F", "#000000", "#FFFFFF"],
            isWishlisted: false
        }
    ];


    // Load wishlist from localStorage
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

    // Clear the grid first
    bestSellersGrid.innerHTML = '';

    // Create all 16 product cards
    fallbackProducts.forEach((product, index) => {
        // Check if product is in wishlist
        product.isWishlisted = wishlist.includes(product.id);

        // Generate stars HTML
        const starsHTML = generateStars(product.rating);

        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.style.animationDelay = `${index * 0.1}s`;

        productCard.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    ${product.originalPrice ? '<span class="product-badge">SALE</span>' : ''}
                    <div class="product-actions">
                        <button class="wishlist-btn ${product.isWishlisted ? 'active' : ''}" data-id="${product.id}">
                            <i class="${product.isWishlisted ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                        <button class="quick-view" data-id="${product.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">
                        <span class="current-price">$${product.price.toFixed(2)}</span>
                        ${product.originalPrice ?
                `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>` :
                ''
            }
                    </div>
                    <div class="product-rating">
                        ${starsHTML}
                        <span>(${product.reviewCount})</span>
                    </div>
                    <div class="product-colors">
                        ${product.colors.slice(0, 3).map(color => `
                            <div class="color-dot" style="background-color: ${color}"></div>
                        `).join('')}
                        ${product.colors.length > 3 ?
                `<span style="color: var(--text-light); font-size: 0.9rem;">+${product.colors.length - 3}</span>` :
                ''
            }
                    </div>
                    <button class="add-to-cart-btn" data-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            `;

        bestSellersGrid.appendChild(productCard);
    });

    // Add event listeners to product cards
    addProductEventListeners();

    window.allProducts = fallbackProducts;

    initProductPagination(fallbackProducts);

    loadProductPage(0);
}



// Function to load testimonials
async function loadTestimonials() {
    const testimonialsTrack = document.getElementById('testimonialsTrack');
    const paginationContainer = document.getElementById('testimonialPagination');

    if (!testimonialsTrack) return;

    try {
        // Fetch testimonials from JSON file
        const response = await fetch('data/testimonials.json');
        const data = await response.json();
        const testimonials = data.testimonials;

        // Check current language
        const isArabic = document.documentElement.lang === 'ar' ||
            document.documentElement.getAttribute('data-lang') === 'ar';

        // 3 testimonials per page
        const testimonialsPerPage = 3;
        const totalPages = Math.ceil(testimonials.length / testimonialsPerPage);

        // Clear previous content
        testimonialsTrack.innerHTML = '';
        paginationContainer.innerHTML = '';

        // Create pagination pages
        for (let page = 0; page < totalPages; page++) {
            const startIndex = page * testimonialsPerPage;
            const endIndex = startIndex + testimonialsPerPage;
            const pageTestimonials = testimonials.slice(startIndex, endIndex);

            const pageElement = document.createElement('div');
            pageElement.className = `testimonials-page ${page === 0 ? 'active' : ''}`;
            pageElement.setAttribute('data-page', page);

            // Create testimonial cards for this page
            const testimonialsHTML = pageTestimonials.map(testimonial => {
                // Use Arabic or English based on language preference
                const name = isArabic ? testimonial.arabicName : testimonial.name;
                const location = isArabic ? testimonial.arabicLocation : testimonial.location;
                const comment = isArabic ? testimonial.arabicComment : testimonial.comment;

                return `
                        <div class="testimonial-card">
                            <div class="testimonial-avatar">
                                <img src="${testimonial.avatar}" alt="${name}" onerror="this.src='https://via.placeholder.com/80'">
                            </div>
                            <div class="testimonial-rating">
                                ${generateStars(testimonial.rating)}
                            </div>
                            <p class="testimonial-text">
                                ${comment}
                            </p>
                            <div class="testimonial-author">
                                ${name}
                            </div>
                            <div class="testimonial-location">
                                <i class="fas fa-map-marker-alt"></i> 
                                ${location}
                            </div>
                        </div>
                    `;
            }).join('');

            pageElement.innerHTML = testimonialsHTML;
            testimonialsTrack.appendChild(pageElement);

            // Create pagination dot
            const dot = document.createElement('span');
            dot.className = `pagination-dot ${page === 0 ? 'active' : ''}`;
            dot.setAttribute('data-page', page);
            paginationContainer.appendChild(dot);
        }

        // Initialize testimonial slider
        initTestimonialSlider(totalPages);

    } catch (error) {
        console.error('Error loading testimonials:', error);
        // Fallback to hardcoded testimonials
        loadFallbackTestimonials();
    }
}

// Fallback function if JSON fails
function loadFallbackTestimonials() {
    const testimonialsTrack = document.getElementById('testimonialsTrack');
    const paginationContainer = document.getElementById('testimonialPagination');

    if (!testimonialsTrack) return;

    const fallbackTestimonials = [
        {
            id: 1,
            name: "Layla Hassan",
            arabicName: "ليلى حسن",
            location: "Ramallah",
            arabicLocation: "رام الله",
            rating: 5,
            comment: "The quality of these shirts is exceptional! The keffiyeh design is beautifully printed and the fabric feels amazing.",
            arabicComment: "جودة هذه القمصان استثنائية! تصميم الكوفية مطبوع بشكل جميل والقماش شعور رائع.",
            avatar: "https://randomuser.me/api/portraits/women/32.jpg"
        },
        {
            id: 2,
            name: "Omar Khalil",
            arabicName: "عمر خليل",
            location: "Gaza",
            arabicLocation: "غزة",
            rating: 5,
            comment: "As a Palestinian living abroad, wearing these designs makes me feel connected to home.",
            arabicComment: "كفلسطيني يعيش في الخارج، ارتداء هذه التصاميم يجعلني أشعر بالاتصال بالوطن.",
            avatar: "https://randomuser.me/api/portraits/men/54.jpg"
        },
        {
            id: 3,
            name: "Rana Suleiman",
            arabicName: "رنا سليمان",
            location: "Jerusalem",
            arabicLocation: "القدس",
            rating: 4,
            comment: "Beautiful designs that celebrate our culture. Excellent customer service!",
            arabicComment: "تصاميم جميلة تحتفل بثقافتنا. خدمة العملاء ممتازة!",
            avatar: "https://randomuser.me/api/portraits/women/67.jpg"
        }
    ];

    // Check current language
    const isArabic = document.documentElement.lang === 'ar' ||
        document.documentElement.getAttribute('data-lang') === 'ar';

    // Create single page with all testimonials
    const pageElement = document.createElement('div');
    pageElement.className = 'testimonials-page active';
    pageElement.setAttribute('data-page', 0);

    pageElement.innerHTML = fallbackTestimonials.map(testimonial => {
        const name = isArabic ? testimonial.arabicName : testimonial.name;
        const location = isArabic ? testimonial.arabicLocation : testimonial.location;
        const comment = isArabic ? testimonial.arabicComment : testimonial.comment;

        return `
                <div class="testimonial-card">
                    <div class="testimonial-avatar">
                        <img src="${testimonial.avatar}" alt="${name}">
                    </div>
                    <div class="testimonial-rating">
                        ${generateStars(testimonial.rating)}
                    </div>
                    <p class="testimonial-text">
                        ${comment}
                    </p>
                    <div class="testimonial-author">
                        ${name}
                    </div>
                    <div class="testimonial-location">
                        <i class="fas fa-map-marker-alt"></i> 
                        ${location}
                    </div>
                </div>
            `;
    }).join('');

    testimonialsTrack.innerHTML = '';
    testimonialsTrack.appendChild(pageElement);

    // Create pagination dot
    const dot = document.createElement('span');
    dot.className = 'pagination-dot active';
    dot.setAttribute('data-page', 0);
    paginationContainer.innerHTML = '';
    paginationContainer.appendChild(dot);

    // Initialize testimonial slider with 1 page
    initTestimonialSlider(1);
}

// Function to initialize testimonial slider
function initTestimonialSlider(totalPages) {
    const testimonialsTrack = document.getElementById('testimonialsTrack');
    const prevBtn = document.querySelector('.prev-testimonial');
    const nextBtn = document.querySelector('.next-testimonial');
    const dots = document.querySelectorAll('.pagination-dot');

    if (!testimonialsTrack || !prevBtn || !nextBtn) return;

    let currentPage = 0;

    function showPage(page) {
        // Update active page
        document.querySelectorAll('.testimonials-page').forEach(pageEl => {
            pageEl.classList.remove('active');
        });

        document.querySelectorAll('.pagination-dot').forEach(dot => {
            dot.classList.remove('active');
        });

        testimonialsTrack.querySelector(`[data-page="${page}"]`).classList.add('active');
        document.querySelector(`.pagination-dot[data-page="${page}"]`).classList.add('active');

        // Animate track
        testimonialsTrack.style.transform = `translateX(-${page * 100}%)`;
        currentPage = page;

        // Update button states
        prevBtn.disabled = page === 0;
        nextBtn.disabled = page === totalPages - 1;
    }

    // Event listeners for buttons
    prevBtn.addEventListener('click', () => {
        if (currentPage > 0) {
            showPage(currentPage - 1);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            showPage(currentPage + 1);
        }
    });

    // Event listeners for dots
    dots.forEach(dot => {
        dot.addEventListener('click', function () {
            const page = parseInt(this.getAttribute('data-page'));
            showPage(page);
        });
    });

    // Initialize first page
    showPage(0);
}

// Function to initialize hero slider
function initHeroSlider() {
    const heroImages = [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
    ];

    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

    // Create hero slider container
    const heroBackground = heroSection.querySelector('.hero-background');
    if (!heroBackground) return;

    // Remove existing background image from CSS
    heroSection.style.backgroundImage = 'none';

    // Create slider container with visible arrow buttons
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'hero-slider';
    sliderContainer.innerHTML = `
            <div class="slider-track">
                ${heroImages.map((image, index) => `
                    <div class="slide ${index === 0 ? 'active' : ''}" style="background-image: url('${image}')">
                        <div class="slide-overlay"></div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Arrow buttons for navigation -->
            <button class="slider-arrow arrow-left" aria-label="Previous slide">
                <i class="fas fa-chevron-left"></i>
            </button>
            <button class="slider-arrow arrow-right" aria-label="Next slide">
                <i class="fas fa-chevron-right"></i>
            </button>
            
            <div class="slider-controls">
                <div class="slider-dots">
                    ${heroImages.map((_, index) => `
                        <span class="slider-dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></span>
                    `).join('')}
                </div>
            </div>
        `;

    // Insert slider before olive branches
    heroBackground.insertBefore(sliderContainer, heroBackground.firstChild);

    // Initialize slider functionality
    const slides = sliderContainer.querySelectorAll('.slide');
    const dots = sliderContainer.querySelectorAll('.slider-dot');
    const leftArrow = sliderContainer.querySelector('.arrow-left');
    const rightArrow = sliderContainer.querySelector('.arrow-right');
    let currentSlide = 0;

    function showSlide(index) {
        if (index < 0) {
            currentSlide = slides.length - 1;
        } else if (index >= slides.length) {
            currentSlide = 0;
        } else {
            currentSlide = index;
        }

        const hero = document.querySelector('.hero');

        if (currentSlide === 0) {
            hero.style.setProperty('--hero-gradient-start', '#111111');
            hero.style.setProperty('--hero-gradient-end', '#C2B280');
            hero.style.setProperty('--hero-text', '#1A1A1A');

        } else if (currentSlide === 1) {
            hero.style.setProperty('--hero-gradient-start', '#111111');
            hero.style.setProperty('--hero-gradient-end', '#F4C430');
            hero.style.setProperty('--hero-text', '#1A1A1A');

        } else if (currentSlide === 2) {
            hero.style.setProperty('--hero-gradient-start', '#000000');
            hero.style.setProperty('--hero-gradient-end', '#CE1126');
            hero.style.setProperty('--hero-text', '#1A1A1A');

        } else if (currentSlide === 3) {
            hero.style.setProperty('--hero-gradient-start', '#FFFFFF');
            hero.style.setProperty('--hero-gradient-end', '#000000');
            hero.style.setProperty('--hero-text', '#FFFFFF');
        }


        // Hide all slides
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        // Show selected slide
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');

        // Animate slide transition
        sliderContainer.querySelector('.slider-track').style.transform =
            `translateX(-${currentSlide * 100}%)`;
    }


    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    function prevSlide() {
        showSlide(currentSlide - 1);
    }

    // Add event listeners for arrow buttons
    leftArrow.addEventListener('click', prevSlide);
    rightArrow.addEventListener('click', nextSlide);

    // Add event listeners for dots
    dots.forEach(dot => {
        dot.addEventListener('click', function () {
            const slideIndex = parseInt(this.getAttribute('data-slide'));
            showSlide(slideIndex);
        });
    });

    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
        }
    });

    // Auto slide every 5 seconds
    let autoSlideInterval = setInterval(nextSlide, 5000);

    // Pause auto-slide on hover
    sliderContainer.addEventListener('mouseenter', () => {
        clearInterval(autoSlideInterval);
    });

    sliderContainer.addEventListener('mouseleave', () => {
        autoSlideInterval = setInterval(nextSlide, 5000);
    });

    // Add CSS for slider arrows
    addHeroSliderStyles();
    // 🔥 set colors immediately on page load
    showSlide(0);

}

// Function to add CSS for hero slider
function addHeroSliderStyles() {
    if (!document.querySelector('#hero-slider-styles')) {
        const sliderStyles = document.createElement('style');
        sliderStyles.id = 'hero-slider-styles';
        sliderStyles.textContent = `
                .hero-slider {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    z-index: 12;
                }
                
                .slider-track {
                    display: flex;
                    width: 100%;
                    height: 100%;
                    transition: transform 0.5s ease-in-out;
                    z-index: 11;
                }
                
                .slide {
                    flex: 0 0 100%;
                    height: 100%;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    position: relative;
                    z-index: 13;
                }
                
                .slide-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%);
                    z-index: 14;
                }
                
                .slider-arrow {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(255, 255, 255, 0.2);
                    border: 2px solid rgba(255, 255, 255, 0.5);
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    z-index: 100000 !important; /* Very high z-index */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                    pointer-events: auto !important; /* Ensure clickable */
                }
                
                .slider-arrow:hover {
                    background: var(--primary-color);
                    border-color: var(--primary-color);
                    transform: translateY(-50%) scale(1.1);
                }
                
                .arrow-left {
                    left: 30px;
                }
                
                .arrow-right {
                    right: 30px;
                }
                
                .slider-controls {
                    position: absolute;
                    bottom: 40px;
                    left: 0;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    z-index: 20;
                }
                
                .slider-dots {
                    display: flex;
                    gap: 10px;
                    z-index: 21;
                }
                
                .slider-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.5);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .slider-dot.active {
                    background: var(--primary-color);
                    transform: scale(1.2);
                }
                
                .slider-dot:hover {
                    background: rgba(255, 255, 255, 0.8);
                }
                
                /* Ensure hero content stays above slider */
                .hero-container {
                    position: relative;
                    z-index: 5;
                }
                
                /* Hide olive branches behind slider */
                .olive-branch {
                    z-index: 2;
                }

                @media (max-width: 768px) {
                    .slider-arrow {
                        width: 40px;
                        height: 40px;
                        font-size: 1.2rem;
                    }
                    
                    .slider-arrow::after {
                        content: '';
                        position: absolute;
                        top: -15px;
                        left: -15px;
                        right: -15px;
                        bottom: -15px;
                        z-index: -1;
                    }
                    
                    .arrow-left {
                        left: 10px;
                    }
                    
                    .arrow-right {
                        right: 10px;
                    }
                }

                .hero-slider * {
                    pointer-events: none;
                }
                
                .slider-arrow,
                .slider-dot {
                    pointer-events: auto;
                }
                
                .hero-container {
                    position: relative;
                    z-index: 5;
                    pointer-events: none;
                }

                .hero-content,
                .hero-visual,
                .hero-actions button {
                    pointer-events: auto;
                }
            `;
        document.head.appendChild(sliderStyles);
    }
}

// Function to add product event listeners
function addProductEventListeners() {
    // Wishlist buttons
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const productId = parseInt(this.getAttribute('data-id'));
            toggleWishlist(productId, this);
        });
    });

    // Quick view buttons
    document.querySelectorAll('.quick-view').forEach(btn => {
        btn.addEventListener('click', function () {
            const productId = parseInt(this.getAttribute('data-id'));
            showNotification('Quick view feature coming soon!');
        });
    });

    // Add to cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const productId = parseInt(this.getAttribute('data-id'));
            addProductToCart(productId, this);
        });
    });
}

// Function to toggle wishlist
function toggleWishlist(productId, button) {
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

    if (wishlist.includes(productId)) {
        // Remove from wishlist
        wishlist = wishlist.filter(id => id !== productId);
        button.classList.remove('active');
        button.innerHTML = '<i class="far fa-heart"></i>';
        showNotification('Removed from wishlist');
    } else {
        // Add to wishlist
        wishlist.push(productId);
        button.classList.add('active');
        button.innerHTML = '<i class="fas fa-heart"></i>';
        showNotification('Added to wishlist!');
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// Function to add product to cart
async function addProductToCart(productId, button) {
    try {
        const response = await fetch('data/products.json');
        const data = await response.json();
        const allProducts = data.products;
        const product = allProducts.find(p => p.id === productId);

        if (product) {
            // Get cart from localStorage
            let cart = JSON.parse(localStorage.getItem('cart')) || [];

            // Create cart item
            const cartItem = {
                id: productId,
                name: product.name,
                price: product.price,
                quantity: 1,
                image: product.images[0]
            };

            // Check if product already exists in cart
            const existingItem = cart.find(item => item.id === productId);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push(cartItem);
            }

            // Save to localStorage
            localStorage.setItem('cart', JSON.stringify(cart));

            // Update cart count
            updateCartCount();

            // Show notification
            showNotification(`${product.name} added to cart!`);

            // Button animation
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Added!';
            button.style.backgroundColor = '#10b981';

            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.backgroundColor = '';
            }, 2000);
        }
    } catch (error) {
        console.error('Error adding product to cart:', error);
        showNotification('Error adding product. Please try again.');
    }
}

// Helper function to generate star ratings
function generateStars(rating) {
    let starsHTML = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }

    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }

    return starsHTML;
}

// Function to update cart count
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        let totalItems = 0;
        cart.forEach(item => {
            totalItems += item.quantity || 1;
        });
        cartCount.textContent = totalItems;
    }
}

// Function to show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background-color: var(--primary-color);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2s forwards;
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 2300);
}

// Add CSS for notifications if not already added
if (!document.querySelector('#notification-styles')) {
    const notificationStyles = document.createElement('style');
    notificationStyles.id = 'notification-styles';
    notificationStyles.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
    document.head.appendChild(notificationStyles);
}


