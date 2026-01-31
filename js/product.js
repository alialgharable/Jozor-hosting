// Products Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const productsGrid = document.getElementById('productsGrid');
    const viewOptions = document.querySelectorAll('.view-option');
    const mobileFiltersBtn = document.getElementById('mobileFiltersBtn');
    const mobileFiltersOverlay = document.getElementById('mobileFiltersOverlay');
    const closeFiltersBtn = document.getElementById('closeFiltersBtn');
    const clearFiltersBtn = document.querySelector('.clear-filters');
    const applyFiltersBtn = document.querySelector('.apply-filters');
    const categoryFilters = document.querySelectorAll('input[name="category"]');
    const sizeFilters = document.querySelectorAll('.size-filter');
    const colorFilters = document.querySelectorAll('.color-filter');
    const sortSelect = document.querySelector('.sort-select');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const rangeMin = document.querySelector('.range-min');
    const rangeMax = document.querySelector('.range-max');
    const showingCount = document.getElementById('showingCount');
    const totalCount = document.getElementById('totalCount');
    const paginationBtns = document.querySelectorAll('.page-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    function updateGlobalFilterReferences() {
        // Update all filter references to get the latest DOM elements
        const updatedSizeFilters = document.querySelectorAll('.size-filter');
        const updatedCategoryFilters = document.querySelectorAll('input[name="category"]');
        const updatedColorFilters = document.querySelectorAll('.color-filter');
        
        // Return them so they can be assigned to the original variables
        return {
            sizeFilters: updatedSizeFilters,
            categoryFilters: updatedCategoryFilters,
            colorFilters: updatedColorFilters
        };
    }


    // Product data from products.json
    let products = [];
    let filteredProducts = [];
    let currentPage = 1;
    const productsPerPage = 12;

    // Fetch products from JSON file
    async function fetchProducts() {
    try {
        const response = await fetch('data/products.json');
        const data = await response.json();
        products = data.products;
        
        // Update filter counts and settings
        updateFilterCounts();
        initializeFilterSettings();
        
        filteredProducts = [...products];
        renderProducts();
        updateProductCount();
        
        // Wait for DOM to update, then setup filters
        setTimeout(() => {
            // Update global filter references
            const filters = updateGlobalFilterReferences();
            // Assign to the variables in the outer scope (tricky, might need different approach)
            
            setupFilters();
        }, 100);
        
    } catch (error) {
        console.error('Error loading products:', error);
        loadFallbackProducts();
    }
}



function initializeFilterSettings() {
    if (!products || products.length === 0) return;
    
    // Get all unique sizes from products
    const allSizes = new Set();
    products.forEach(product => {
        if (product.sizes) {
            if (Array.isArray(product.sizes)) {
                product.sizes.forEach(size => allSizes.add(size));
            } else {
                allSizes.add(product.sizes);
            }
        }
    });
    
    // Get all unique colors from products
    const allColors = new Set();
    products.forEach(product => {
        if (product.colors && Array.isArray(product.colors)) {
            product.colors.forEach(color => {
                const colorName = typeof color === 'object' ? color.name : color;
                if (colorName) allColors.add(colorName.toLowerCase());
            });
        }
    });
    
    // Get price range from products
    const prices = products.map(p => parseFloat(p.price) || 0).filter(p => !isNaN(p));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Update filter settings
    updateSizeFilters([...allSizes]);
    updatePriceRange(minPrice, maxPrice);
    updateFilterCounts();
}



function updateSizeFilters(availableSizes) {
    const sizeContainer = document.querySelector('.size-filters');
    if (!sizeContainer) return;
    
    // Clear existing size filters
    sizeContainer.innerHTML = '';
    
    // Sort sizes in a logical order
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size'];
    const sortedSizes = [...availableSizes].sort((a, b) => {
        const indexA = sizeOrder.indexOf(a);
        const indexB = sizeOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });
    
    // Create size filter buttons
    sortedSizes.forEach(size => {
        const sizeBtn = document.createElement('button');
        sizeBtn.className = 'size-filter';
        sizeBtn.textContent = size;
        sizeBtn.setAttribute('data-size', size);
        sizeBtn.title = `Size ${size}`;
        sizeContainer.appendChild(sizeBtn);
    });
}



function updatePriceRange(minPrice, maxPrice) {
    // Set min and max values
    minPriceInput.min = Math.floor(minPrice);
    minPriceInput.max = Math.ceil(maxPrice);
    maxPriceInput.min = Math.floor(minPrice);
    maxPriceInput.max = Math.ceil(maxPrice);
    
    // Set initial values (0-100 for display, but track actual range)
    minPriceInput.value = Math.floor(minPrice);
    maxPriceInput.value = Math.ceil(maxPrice);
    
    // Update range sliders
    rangeMin.min = Math.floor(minPrice);
    rangeMin.max = Math.ceil(maxPrice);
    rangeMax.min = Math.floor(minPrice);
    rangeMax.max = Math.ceil(maxPrice);
    rangeMin.value = Math.floor(minPrice);
    rangeMax.value = Math.ceil(maxPrice);
    
    // Update price display
    updatePriceDisplay();
}

function updateColorFilters(availableColors) {
    const colorContainer = document.querySelector('.color-filters');
    if (!colorContainer) return;
    
    // Keep default color buttons but update with actual colors
    // We'll preserve the existing ones for now since they're predefined
    
    // Map color names to hex values (add more as needed)
    const colorMap = {
        'Black': '#000000',
        'White': '#FFFFFF',
        'Olive': '#556B2F',
        'Red': '#CE1126',
        'Blue': '#3b82f6',
        'Green': '#10b981',
        'Purple': '#8b5cf6',
        'Orange': '#f59e0b',
        'Navy': '#000080',
        'Grey': '#808080',
        'Charcoal': '#36454F',
        'Burgundy': '#800020',
        'Sand': '#C2B280',
        'Cream': '#FFFDD0'
    };
    
    // Filter to only show colors that exist in products
    const existingColorFilters = colorContainer.querySelectorAll('.color-filter');
    existingColorFilters.forEach(filter => {
        const colorName = filter.getAttribute('data-color');
        if (availableColors.some(availColor => 
            availColor.toLowerCase().includes(colorName.toLowerCase())
        )) {
            filter.style.display = 'block';
        } else {
            filter.style.display = 'none';
        }
    });
}


function updateFilterCounts() {
    // Count products by category
    const categoryCounts = {
        tshirts: products.filter(p => p.category === 'tshirts').length,
        hoodies: products.filter(p => p.category === 'hoodies').length,
        sweatshirts: products.filter(p => p.category === 'sweatshirts').length,
        jackets: products.filter(p => p.category === 'jackets').length,
        accessories: products.filter(p => p.category === 'accessories').length
    };
    
    // Update count displays
    document.querySelectorAll('.filter-option .count').forEach(span => {
        const category = span.closest('.filter-option').querySelector('input').value;
        if (categoryCounts[category] !== undefined) {
            span.textContent = `(${categoryCounts[category]})`;
        }
    });
    
    // Update results count
    updateProductCount();
}


function updateMobileFiltersContent() {
    const mobileFiltersContent = document.querySelector('.mobile-filters-content');
    if (!mobileFiltersContent) return;
    
    // Get the current HTML from the sidebar and update counts
    const sidebarHTML = document.querySelector('.filters-sidebar').innerHTML;
    mobileFiltersContent.innerHTML = sidebarHTML;
    
    // Reinitialize the mobile filters with current data
    setTimeout(() => {
        // Reattach event listeners and update counts
        initializeMobileFilters();
    }, 100);
}

function initializeMobileFilters() {
    const mobileFiltersContent = document.querySelector('.mobile-filters-content');
    if (!mobileFiltersContent) return;
    
    // Update counts in mobile filters
    updateFilterCounts();
}


    // Fallback products if JSON fails
function loadFallbackProducts() {
    products = [
        {
            id: 1,
            name: "Palestinian Keffiyeh Print T-Shirt",
            price: 34.99,
            originalPrice: 44.99,
            category: "tshirts",
            description: "High-quality cotton t-shirt featuring traditional Palestinian keffiyeh pattern design.",
            rating: 4.8,
            reviewCount: 142,
            sizes: ["S", "M", "L", "XL", "XXL"],
            colors: [{name: "Black", hex: "#000000"}, {name: "Olive", hex: "#556B2F"}, {name: "Red", hex: "#CE1126"}],
            images: [
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
            ],
            tags: ["keffiyeh", "traditional", "best-seller"],
            inStock: true,
            featured: true,
            customizable: true
        },
        {
            id: 2,
            name: "Olive Branch Hoodie",
            price: 59.99,
            category: "hoodies",
            description: "Comfortable hoodie with embroidered olive branch design symbolizing peace.",
            rating: 4.9,
            reviewCount: 89,
            sizes: ["M", "L", "XL", "XXL"],
            colors: [{name: "Olive", hex: "#556B2F"}, {name: "Black", hex: "#000000"}],
            images: [
                "https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
            ],
            tags: ["olive", "hoodie", "warm"],
            inStock: true,
            featured: false,
            customizable: true
        },
        {
            id: 3,
            name: "Traditional Tatreez Jacket",
            price: 79.99,
            originalPrice: 89.99,
            category: "jackets",
            description: "Traditional Palestinian embroidery on a premium denim jacket.",
            rating: 4.7,
            reviewCount: 54,
            sizes: ["S", "M", "L"],
            colors: [{name: "Denim Blue", hex: "#3b82f6"}],
            images: [
                "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
            ],
            tags: ["tatreez", "traditional", "jacket"],
            inStock: true,
            featured: true,
            customizable: false
        },
        {
            id: 4,
            name: "Palestinian Flag Beanie",
            price: 24.99,
            category: "accessories",
            description: "Warm beanie with Palestinian flag colors.",
            rating: 4.5,
            reviewCount: 67,
            sizes: ["One Size"],
            colors: [{name: "Black", hex: "#000000"}, {name: "White", hex: "#ffffff"}, {name: "Green", hex: "#10b981"}, {name: "Red", hex: "#CE1126"}],
            images: [
                "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
            ],
            tags: ["beanie", "winter", "accessory"],
            inStock: true,
            featured: false,
            customizable: true
        },
        {
            id: 5,
            name: "Al-Quds Sweatshirt",
            price: 49.99,
            category: "sweatshirts",
            description: "Comfortable sweatshirt featuring Al-Quds (Jerusalem) design.",
            rating: 4.6,
            reviewCount: 103,
            sizes: ["S", "M", "L", "XL"],
            colors: [{name: "White", hex: "#ffffff"}, {name: "Black", hex: "#000000"}],
            images: [
                "https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
            ],
            tags: ["al-quds", "jerusalem", "sweatshirt"],
            inStock: true,
            featured: true,
            customizable: true
        }
    ];
    
    filteredProducts = [...products];
    renderProducts();
    updateProductCount();
    setupFilters();
}


    // Render products to the grid
    function renderProducts() {
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const productsToShow = filteredProducts.slice(startIndex, endIndex);
        
        productsGrid.innerHTML = '';
        
        const isListView = productsGrid.classList.contains('list-view');
        
        productsToShow.forEach(product => {
            const productCard = createProductCard(product, isListView);
            productsGrid.appendChild(productCard);
        });
        
        updatePagination();
        updateWishlistButtons();
    }

    // Create product card HTML
    function createProductCard(product, isListView = false) {
        const card = document.createElement('a');
        card.href = `product-details.html?id=${product.id}`;
        card.className = 'product-card';
        card.setAttribute('data-id', product.id);
        
        const discount = product.originalPrice ? 
            Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
        
        const colorsHtml = product.colors ? product.colors.map(color => 
            `<div class="color-dot" style="background-color: ${typeof color === 'object' ? color.hex : color}" 
                 title="${typeof color === 'object' ? color.name : color}"></div>`
        ).join('') : '';
        
        const badges = [];
        if (product.featured) badges.push('<span class="badge popular">Popular</span>');
        if (product.tags && product.tags.includes('best-seller')) badges.push('<span class="badge sale">Best Seller</span>');
        if (product.originalPrice && discount >= 20) badges.push('<span class="badge sale">Sale</span>');
        
        const badgesHtml = badges.length ? `<div class="product-badges">${badges.join('')}</div>` : '';
        
        if (isListView) {
            card.innerHTML = `
                <div class="product-img">
                    <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
                    ${badgesHtml}
                    <button class="wishlist-btn" data-product-id="${product.id}">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
                <div class="product-info">
                    <div>
                        <h3 class="product-title">${product.name}</h3>
                        <div class="product-price">
                            <span class="current-price">$${product.price.toFixed(2)}</span>
                            ${product.originalPrice ? 
                                `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>` : 
                                ''}
                        </div>
                        <div class="product-rating">
                            ${generateStarRating(product.rating)}
                            <span>(${product.reviewCount})</span>
                        </div>
                        <p class="product-description">${product.description}</p>
                        <div class="product-colors">
                            ${colorsHtml}
                        </div>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary add-to-cart" data-product-id="${product.id}">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                        <button class="btn btn-outline quick-view-btn" data-product-id="${product.id}">
                            <i class="fas fa-eye"></i> Quick View
                        </button>
                    </div>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="product-img">
                    <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
                    ${badgesHtml}
                    <button class="wishlist-btn" data-product-id="${product.id}">
                        <i class="far fa-heart"></i>
                    </button>
                    <div class="quick-view">Quick View</div>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">
                        <span class="current-price">$${product.price.toFixed(2)}</span>
                        ${product.originalPrice ? 
                            `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>` : 
                            ''}
                    </div>
                    <div class="product-rating">
                        ${generateStarRating(product.rating)}
                        <span>(${product.reviewCount})</span>
                    </div>
                    <div class="product-colors">
                        ${colorsHtml}
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary add-to-cart" data-product-id="${product.id}">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                    </div>
                </div>
            `;
        }
        
        return card;
    }

    // Generate star rating HTML
    function generateStarRating(rating) {
        const stars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let starsHtml = '';
        
        for (let i = 1; i <= 5; i++) {
            if (i <= stars) {
                starsHtml += '<i class="fas fa-star"></i>';
            } else if (i === stars + 1 && hasHalfStar) {
                starsHtml += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starsHtml += '<i class="far fa-star"></i>';
            }
        }
        
        return starsHtml;
    }

    // Update product count
    function updateProductCount() {
        showingCount.textContent = Math.min(filteredProducts.length, currentPage * productsPerPage);
        totalCount.textContent = filteredProducts.length;
    }

    // Setup filters
    function setupFilters() {
    let filtersChanged = false;
    
    // Get fresh filter references every time
    const currentSizeFilters = document.querySelectorAll('.size-filter');
    const currentCategoryFilters = document.querySelectorAll('input[name="category"]');
    const currentColorFilters = document.querySelectorAll('.color-filter');
    
    // Category filters
    currentCategoryFilters.forEach(filter => {
        // Remove existing listeners first to avoid duplicates
        const newFilter = filter.cloneNode(true);
        filter.parentNode.replaceChild(newFilter, filter);
        
        newFilter.addEventListener('change', function(e) {
            e.preventDefault();
            e.stopPropagation();
            filtersChanged = true;
            updateFilterUI();
        });
    });
    
    // Size filters - Use event delegation at document level
    document.addEventListener('click', function(e) {
        const sizeFilter = e.target.closest('.size-filter');
        if (sizeFilter) {
            e.preventDefault();
            e.stopPropagation();
            sizeFilter.classList.toggle('active');
            filtersChanged = true;
            updateFilterUI();
            console.log('Size filter clicked:', sizeFilter.textContent, 'Active:', sizeFilter.classList.contains('active'));
        }
    });
    
    // Color filters - Also use event delegation
    document.addEventListener('click', function(e) {
        const colorFilter = e.target.closest('.color-filter');
        if (colorFilter) {
            e.preventDefault();
            e.stopPropagation();
            colorFilter.classList.toggle('active');
            filtersChanged = true;
            updateFilterUI();
        }
    });
    
    // Sort select
    const currentSortSelect = document.querySelector('.sort-select');
    if (currentSortSelect) {
        currentSortSelect.addEventListener('change', function() {
            filterProducts();
        });
    }
    
    // Price range inputs
    function validatePriceInputs() {
        const min = parseFloat(minPriceInput.value) || 0;
        const max = parseFloat(maxPriceInput.value) || 1000;
        
        if (min > max) {
            minPriceInput.value = max;
            maxPriceInput.value = min;
            rangeMin.value = max;
            rangeMax.value = min;
        }
        
        if (min < 0) minPriceInput.value = 0;
        if (max > 1000) maxPriceInput.value = 1000;
        
        updatePriceDisplay();
        filtersChanged = true;
    }
    
    minPriceInput.addEventListener('input', function() {
        rangeMin.value = this.value;
        validatePriceInputs();
    });
    
    maxPriceInput.addEventListener('input', function() {
        rangeMax.value = this.value;
        validatePriceInputs();
    });
    
    rangeMin.addEventListener('input', function() {
        minPriceInput.value = this.value;
        validatePriceInputs();
    });
    
    rangeMax.addEventListener('input', function() {
        maxPriceInput.value = this.value;
        validatePriceInputs();
    });
    
    // Apply filters button
    applyFiltersBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (filtersChanged) {
            filterProducts();
            filtersChanged = false;
            
            const resultsCount = document.getElementById('showingCount');
            resultsCount.style.transform = 'scale(1.2)';
            setTimeout(() => {
                resultsCount.style.transform = 'scale(1)';
            }, 300);
        }
        
        if (mobileFiltersOverlay.classList.contains('active')) {
            mobileFiltersOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Clear filters button
    clearFiltersBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        clearFilters();
        filtersChanged = false;
    });
}

// Update filter UI without filtering
function updateFilterUI() {
    // Just update the filter button state if needed
    const applyBtn = document.querySelector('.apply-filters');
    if (applyBtn) {
        applyBtn.style.animation = 'pulse 2s infinite';
        setTimeout(() => {
            applyBtn.style.animation = '';
        }, 2000);
    }
}

    // Filter products based on selected criteria
    function filterProducts() {
    const scrollPosition = window.scrollY;
    
    // Get fresh size filter elements every time
    const currentSizeFilters = document.querySelectorAll('.size-filter');
    const currentCategoryFilters = document.querySelectorAll('input[name="category"]');
    const currentColorFilters = document.querySelectorAll('.color-filter');
    
    const selectedCategories = Array.from(currentCategoryFilters)
        .filter(f => f.checked)
        .map(f => f.value);

    const selectedSizes = Array.from(currentSizeFilters)
        .filter(f => f.classList.contains('active'))
        .map(f => f.getAttribute('data-size') || f.textContent);

    const selectedColors = Array.from(currentColorFilters)
        .filter(f => f.classList.contains('active'))
        .map(f => f.getAttribute('data-color'));

    const minPrice = parseFloat(minPriceInput.value) || 0;
    const maxPrice = parseFloat(maxPriceInput.value) || 1000;
    const sortBy = sortSelect.value;

    console.log('Filtering with sizes:', selectedSizes);
    console.log('Active size filters found:', currentSizeFilters.length);

    // Filter products
    filteredProducts = products.filter(product => {
        // Category filter
        if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) {
            return false;
        }

        // Size filter - FIXED: Use current size filter data
        if (selectedSizes.length > 0) {
            let hasSize = false;
            const productSizes = product.sizes;
            
            if (productSizes) {
                if (Array.isArray(productSizes)) {
                    hasSize = selectedSizes.some(selectedSize => {
                        const selectedSizeLower = selectedSize.toLowerCase();
                        return productSizes.some(productSize => 
                            productSize.toString().toLowerCase() === selectedSizeLower
                        );
                    });
                } else if (typeof productSizes === 'string') {
                    const productSizeLower = productSizes.toLowerCase();
                    hasSize = selectedSizes.some(selectedSize => 
                        productSizeLower === selectedSize.toLowerCase()
                    );
                }
            }
            if (!hasSize) {
                console.log('Product filtered out by size:', product.name, 'Sizes:', productSizes, 'Selected:', selectedSizes);
                return false;
            }
        }

        // Color filter
        if (selectedColors.length > 0) {
            let hasColor = false;
            const productColors = product.colors;
            
            if (productColors && Array.isArray(productColors)) {
                hasColor = productColors.some(color => {
                    const colorName = typeof color === 'object' ? color.name : color;
                    if (!colorName) return false;
                    
                    return selectedColors.some(selectedColor => {
                        const colorNameStr = colorName.toString().toLowerCase();
                        const selectedColorStr = selectedColor.toString().toLowerCase();
                        
                        if (colorNameStr === selectedColorStr) return true;
                        if (colorNameStr.includes(selectedColorStr) || selectedColorStr.includes(colorNameStr)) {
                            return true;
                        }
                        
                        return false;
                    });
                });
            }
            if (!hasColor) return false;
        }

        // Price filter
        const productPrice = parseFloat(product.price) || 0;
        if (productPrice < minPrice || productPrice > maxPrice) {
            return false;
        }

        return true;
    });

    console.log('Products after filtering:', filteredProducts.length);

    // Sort products
    switch (sortBy) {
        case 'price-low':
            filteredProducts.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
            break;
        case 'rating':
            filteredProducts.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
            break;
        case 'newest':
            filteredProducts.sort((a, b) => (b.id || 0) - (a.id || 0));
            break;
        case 'best-selling':
            filteredProducts.sort((a, b) => (parseFloat(b.reviewCount) || 0) - (parseFloat(a.reviewCount) || 0));
            break;
        default:
            filteredProducts.sort((a, b) => {
                if (a.featured && !b.featured) return -1;
                if (!a.featured && b.featured) return 1;
                return (parseFloat(b.reviewCount) || 0) - (parseFloat(a.reviewCount) || 0);
            });
            break;
    }

    currentPage = 1;
    renderProducts();
    updateProductCount();
    
    setTimeout(() => {
        window.scrollTo(0, scrollPosition);
    }, 100);
}




    
    // Clear all filters
    function clearFilters() {
    console.log('Clearing all filters...');
    
    // Clear all size filters
    const allSizeFilters = document.querySelectorAll('.size-filter');
    allSizeFilters.forEach(filter => {
        filter.classList.remove('active');
    });
    
    // Clear category filters
    const allCategoryFilters = document.querySelectorAll('input[name="category"]');
    allCategoryFilters.forEach(filter => {
        filter.checked = true;
    });
    
    // Clear color filters
    const allColorFilters = document.querySelectorAll('.color-filter');
    allColorFilters.forEach(filter => {
        filter.classList.remove('active');
    });
    
    // Reset price range
    minPriceInput.value = 0;
    maxPriceInput.value = 1000;
    rangeMin.value = 0;
    rangeMax.value = 1000;
    
    // Reset sort
    sortSelect.value = 'featured';
    
    // Reset products
    filteredProducts = [...products];
    currentPage = 1;
    
    // Update UI
    updatePriceDisplay();
    updateFilterUI();
    renderProducts();
    updateProductCount();
    
    // No need to reinitialize filters - event delegation handles it
    showNotification('All filters cleared');
}


// Update price display
function updatePriceDisplay() {
    const minValue = minPriceInput.value || 0;
    const maxValue = maxPriceInput.value || 100;
    
    document.getElementById('minValueDisplay').textContent = `$${minValue}`;
    document.getElementById('maxValueDisplay').textContent = `$${maxValue}`;
}

// Initialize price display
updatePriceDisplay();

// Update price display on input
minPriceInput.addEventListener('input', function() {
    updatePriceDisplay();
});

maxPriceInput.addEventListener('input', function() {
    updatePriceDisplay();
});

rangeMin.addEventListener('input', function() {
    minPriceInput.value = this.value;
    updatePriceDisplay();
});

rangeMax.addEventListener('input', function() {
    maxPriceInput.value = this.value;
    updatePriceDisplay();
});

    // Update pagination
    function updatePagination() {
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        const pageNumbers = document.querySelector('.page-numbers');
        
        // Clear existing page numbers (keep prev/next buttons)
        const existingPages = pageNumbers.querySelectorAll('.page-btn:not(.prev-btn):not(.next-btn)');
        existingPages.forEach(page => page.remove());
        
        // Create page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // Add page number buttons
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'page-btn';
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderProducts();
                updateProductCount();
            });
            
            if (i === currentPage) {
                pageBtn.classList.add('active');
            }
            
            pageNumbers.insertBefore(pageBtn, pageNumbers.querySelector('.page-dots'));
        }
        
        // Update prev/next button states
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
        
        // Update dots visibility
        const dots = pageNumbers.querySelector('.page-dots');
        dots.style.display = totalPages > maxVisiblePages ? 'flex' : 'none';
    }

    // View toggle
    viewOptions.forEach(option => {
        option.addEventListener('click', function() {
            viewOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            const viewType = this.getAttribute('data-view');
            if (viewType === 'list') {
                productsGrid.classList.add('list-view');
            } else {
                productsGrid.classList.remove('list-view');
            }
            
            renderProducts();
        });
    });

    // Mobile filters toggle
    // Mobile filters toggle
mobileFiltersBtn.addEventListener('click', function() {
    mobileFiltersOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Copy filters to mobile overlay
    const filtersContent = document.querySelector('.filters-sidebar').innerHTML;
    const mobileFiltersContent = document.querySelector('.mobile-filters-content');
    mobileFiltersContent.innerHTML = filtersContent;
    
    // Reattach event listeners for mobile filters
    setTimeout(() => {
        const mobileClearBtn = mobileFiltersContent.querySelector('.clear-filters');
        const mobileApplyBtn = mobileFiltersContent.querySelector('.apply-filters');
        const mobileCategoryFilters = mobileFiltersContent.querySelectorAll('input[name="category"]');
        const mobileSizeFilters = mobileFiltersContent.querySelectorAll('.size-filter');
        const mobileColorFilters = mobileFiltersContent.querySelectorAll('.color-filter');
        const mobileMinPrice = mobileFiltersContent.querySelector('#minPrice');
        const mobileMaxPrice = mobileFiltersContent.querySelector('#maxPrice');
        const mobileRangeMin = mobileFiltersContent.querySelector('.range-min');
        const mobileRangeMax = mobileFiltersContent.querySelector('.range-max');
        const mobileSortSelect = mobileFiltersContent.querySelector('.sort-select');
        
        // Copy current filter states
        mobileCategoryFilters.forEach((filter, index) => {
            if (index < categoryFilters.length) {
                filter.checked = categoryFilters[index].checked;
            }
        });
        
        mobileSizeFilters.forEach((filter, index) => {
            if (index < sizeFilters.length) {
                filter.classList.toggle('active', sizeFilters[index].classList.contains('active'));
            }
        });
        
        mobileColorFilters.forEach((filter, index) => {
            if (index < colorFilters.length) {
                filter.classList.toggle('active', colorFilters[index].classList.contains('active'));
            }
        });
        
        if (mobileMinPrice) mobileMinPrice.value = minPriceInput.value;
        if (mobileMaxPrice) mobileMaxPrice.value = maxPriceInput.value;
        if (mobileRangeMin) mobileRangeMin.value = rangeMin.value;
        if (mobileRangeMax) mobileRangeMax.value = rangeMax.value;
        if (mobileSortSelect) mobileSortSelect.value = sortSelect.value;
        
        // Add mobile filter event listeners
        if (mobileClearBtn) {
            mobileClearBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                clearFilters();
                
                // Also clear mobile filters
                mobileCategoryFilters.forEach(filter => filter.checked = true);
                mobileSizeFilters.forEach(filter => filter.classList.remove('active'));
                mobileColorFilters.forEach(filter => filter.classList.remove('active'));
                if (mobileMinPrice) mobileMinPrice.value = 0;
                if (mobileMaxPrice) mobileMaxPrice.value = 100;
                if (mobileSortSelect) mobileSortSelect.value = 'featured';
                
                // Close mobile overlay
                mobileFiltersOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        if (mobileApplyBtn) {
            mobileApplyBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Update main filters with mobile filter values
                mobileCategoryFilters.forEach((filter, index) => {
                    if (index < categoryFilters.length) {
                        categoryFilters[index].checked = filter.checked;
                    }
                });
                
                mobileSizeFilters.forEach((filter, index) => {
                    if (index < sizeFilters.length) {
                        if (filter.classList.contains('active')) {
                            sizeFilters[index].classList.add('active');
                        } else {
                            sizeFilters[index].classList.remove('active');
                        }
                    }
                });
                
                mobileColorFilters.forEach((filter, index) => {
                    if (index < colorFilters.length) {
                        if (filter.classList.contains('active')) {
                            colorFilters[index].classList.add('active');
                        } else {
                            colorFilters[index].classList.remove('active');
                        }
                    }
                });
                
                if (mobileMinPrice) minPriceInput.value = mobileMinPrice.value;
                if (mobileMaxPrice) maxPriceInput.value = mobileMaxPrice.value;
                if (mobileRangeMin) rangeMin.value = mobileRangeMin.value;
                if (mobileRangeMax) rangeMax.value = mobileRangeMax.value;
                if (mobileSortSelect) sortSelect.value = mobileSortSelect.value;
                
                // Apply filters
                filterProducts();
                
                // Close mobile overlay
                mobileFiltersOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        // Mobile-only event listeners for real-time updates
        mobileCategoryFilters.forEach(filter => {
            filter.addEventListener('change', function() {
                // Just track changes, don't filter yet
            });
        });
        
        mobileSizeFilters.forEach(filter => {
            filter.addEventListener('click', function() {
                this.classList.toggle('active');
            });
        });
        
        mobileColorFilters.forEach(filter => {
            filter.addEventListener('click', function() {
                this.classList.toggle('active');
            });
        });
        
        // Mobile price inputs
        if (mobileMinPrice) {
            mobileMinPrice.addEventListener('input', function() {
                if (mobileRangeMin) mobileRangeMin.value = this.value;
            });
        }
        
        if (mobileMaxPrice) {
            mobileMaxPrice.addEventListener('input', function() {
                if (mobileRangeMax) mobileRangeMax.value = this.value;
            });
        }
        
        if (mobileRangeMin) {
            mobileRangeMin.addEventListener('input', function() {
                if (mobileMinPrice) mobileMinPrice.value = this.value;
            });
        }
        
        if (mobileRangeMax) {
            mobileRangeMax.addEventListener('input', function() {
                if (mobileMaxPrice) mobileMaxPrice.value = this.value;
            });
        }
    }, 100);

    updateMobileFiltersContent();
});

    closeFiltersBtn.addEventListener('click', function() {
        mobileFiltersOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close filters on overlay click
    mobileFiltersOverlay.addEventListener('click', function(e) {
        if (e.target === mobileFiltersOverlay) {
            mobileFiltersOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Pagination
    prevBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderProducts();
            updateProductCount();
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    });

    nextBtn.addEventListener('click', function() {
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderProducts();
            updateProductCount();
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    });

    // Add to cart functionality
    function handleAddToCart(e , productId , button) {
        e.preventDefault();
        e.stopPropagation();
        
        
        const product = products.find(p => p.id == productId);
        
        if (!product) return;
        
        // Get cart from localStorage
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Check if product already in cart
        const existingItemIndex = cart.findIndex(item => item.id == productId);
        
        if (existingItemIndex > -1) {
            // Update quantity
            cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + 1;
        } else {
            // Add new item
            const cartItem = {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images && product.images.length > 0 ? product.images[0] : 'default-image.jpg',
                quantity: 1,
                color: product.colors && product.colors[0] ? 
                    (typeof product.colors[0] === 'object' ? product.colors[0].name : 'Default') : 
                    'Default',
                size: product.sizes && product.sizes[0] || 'M'
            };

            cartItem.image = product.images && product.images.length > 0 ? product.images[0] : 'default-image.jpg';
            
            cart.push(cartItem);
        }
        
        // Save to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart count
        updateCartCount();
        
        // Show notification
        showNotification(`${product.name} added to cart!`);
        
        // Button feedback
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Added!';
        button.style.backgroundColor = '#10b981';
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.backgroundColor = '';
        }, 2000);
    }

    // Wishlist functionality
    function handleWishlist(e , button) {
        e.preventDefault();
        e.stopPropagation();
        
        const productId = button.getAttribute('data-product-id');
        const icon = button.querySelector('i');
        
        // Get wishlist from localStorage
        let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        
        if (wishlist.includes(productId)) {
            // Remove from wishlist
            wishlist = wishlist.filter(id => id !== productId);
            icon.className = 'far fa-heart';
            showNotification('Removed from wishlist');
        } else {
            // Add to wishlist
            wishlist.push(productId);
            icon.className = 'fas fa-heart';
            showNotification('Added to wishlist!');
        }
        
        // Save to localStorage
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        
        // Button animation
        button.style.transform = 'scale(1.2)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 300);
    }

    // Update wishlist button states
    function updateWishlistButtons() {
        const wishlistButtons = document.querySelectorAll('.wishlist-btn');
        const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        
        wishlistButtons.forEach(button => {
            const productId = button.getAttribute('data-product-id');
            const icon = button.querySelector('i');
            
            if (wishlist.includes(productId)) {
                icon.className = 'fas fa-heart';
                button.classList.add('active');
            } else {
                icon.className = 'far fa-heart';
                button.classList.remove('active');
            }
        });
    }

    // Update cart count
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

    // Show notification
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

    // Event delegation for dynamic content
    document.addEventListener('click', function(e) {
        // Add to cart buttons

        const addToCartBtn = e.target.closest('.add-to-cart');
        if (addToCartBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            const productId = addToCartBtn.getAttribute('data-product-id');
            // Navigate to product details page instead of adding directly
            window.location.href = `product-details.html?id=${productId}`;
        }

        
        // Wishlist buttons
        const wishlistBtn = e.target.closest('.wishlist-btn');
        if (wishlistBtn) {
            handleWishlist(e, wishlistBtn); // Pass button element
        }
        
        // Quick view buttons
        const quickViewBtn = e.target.closest('.quick-view-btn');
        if (quickViewBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            const productId = quickViewBtn.getAttribute('data-product-id');
            window.location.href = `product-details.html?id=${productId}`;
        }
    });

    // Initialize
    fetchProducts();
    updateCartCount();

    // Add CSS animations if not already added
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
});