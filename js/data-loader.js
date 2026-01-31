// data-loader.js - Load JSON data for all pages

// Global data storage
let productsData = null;
let categoriesData = null;
let testimonialsData = null;
let designersData = null;

// Fetch data from JSON file
async function loadData() {
    try {
        const response = await fetch('data/products.json');
        const data = await response.json();
        
        productsData = data.products;
        categoriesData = data.categories;
        testimonialsData = data.testimonials;
        designersData = data.designers;
        
        // Dispatch event that data is loaded
        document.dispatchEvent(new Event('dataLoaded'));
        
        return data;
    } catch (error) {
        console.error('Error loading data:', error);
        // Load fallback data
        loadFallbackData();
    }
}

// Fallback data in case JSON file fails
function loadFallbackData() {
    productsData = [
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
            colors: [
                {"name": "Black & White", "hex": "#000000"},
                {"name": "Olive Green", "hex": "#556B2F"}
            ],
            images: [
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            ],
            tags: ["keffiyeh", "traditional", "best-seller"],
            inStock: true,
            featured: true,
            customizable: true
        }
    ];
    
    categoriesData = [
        {"id": "tshirts", "name": "T-Shirts", "count": 12},
        {"id": "hoodies", "name": "Hoodies", "count": 8}
    ];
    
    testimonialsData = [
        {
            id: 1,
            name: "Layla Hassan",
            location: "Ramallah",
            rating: 5,
            comment: "The quality of these shirts is exceptional!",
            avatar: "https://randomuser.me/api/portraits/women/32.jpg",
            date: "2023-10-15"
        }
    ];
    
    designersData = [
        {
            id: 1,
            name: "Nour Abed",
            role: "Head Designer",
            bio: "Specializes in traditional Palestinian tatreez patterns.",
            avatar: "https://randomuser.me/api/portraits/women/44.jpg"
        }
    ];
    
    document.dispatchEvent(new Event('dataLoaded'));
}

// Load collections for home page
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
                <a href="products.html?collection=${collection.id}" class="btn btn-outline">
                    <i class="fas fa-arrow-right"></i> View ${collection.items} Items
                </a>
            </div>
        </div>
    `).join('');
}

// Load best sellers
function loadBestSellers() {
    const bestSellersGrid = document.getElementById('bestSellersGrid');
    if (!bestSellersGrid || !productsData) return;
    
    const featuredProducts = productsData.filter(product => product.featured);
    
    bestSellersGrid.innerHTML = featuredProducts.map((product, index) => `
        <div class="product-card" style="animation-delay: ${index * 0.1}s">
            <div class="product-image">
                <img src="${product.images[0]}" alt="${product.name}">
                ${product.originalPrice ? '<span class="product-badge">SALE</span>' : ''}
                <div class="product-actions">
                    <button class="wishlist-btn" data-id="${product.id}">
                        <i class="far fa-heart"></i>
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
                    ${generateStars(product.rating)}
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
        </div>
    `).join('');
}

// Load testimonials
function loadTestimonials() {
    const testimonialsSlider = document.getElementById('testimonialsSlider');
    if (!testimonialsSlider || !testimonialsData) return;
    
    const testimonialsHTML = testimonialsData.map((testimonial, index) => `
        <div class="testimonial-card ${index === 0 ? 'active' : ''}" data-index="${index}">
            <div class="testimonial-avatar">
                <img src="${testimonial.avatar}" alt="${testimonial.name}">
            </div>
            <div class="testimonial-rating">
                ${generateStars(testimonial.rating)}
            </div>
            <p class="testimonial-text">${testimonial.comment}</p>
            <div class="testimonial-author">${testimonial.name}</div>
            <div class="testimonial-location">
                <i class="fas fa-map-marker-alt"></i> ${testimonial.location}
            </div>
        </div>
    `).join('');
    
    const dotsHTML = testimonialsData.map((_, index) => `
        <span class="slider-dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></span>
    `).join('');
    
    testimonialsSlider.innerHTML = `
        ${testimonialsHTML}
        <div class="slider-controls">
            ${dotsHTML}
        </div>
    `;
    
    // Add slider functionality
    const dots = testimonialsSlider.querySelectorAll('.slider-dot');
    const cards = testimonialsSlider.querySelectorAll('.testimonial-card');
    
    dots.forEach(dot => {
        dot.addEventListener('click', function() {
            const slideIndex = parseInt(this.getAttribute('data-slide'));
            
            // Update active dot
            dots.forEach(d => d.classList.remove('active'));
            this.classList.add('active');
            
            // Update active card
            cards.forEach(card => card.classList.remove('active'));
            cards[slideIndex].classList.add('active');
        });
    });
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

// Load all data when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    loadData().then(() => {
        // Check which page we're on and load appropriate content
        if (document.getElementById('collectionsGrid')) {
            loadCollections();
        }
        
        if (document.getElementById('bestSellersGrid')) {
            loadBestSellers();
        }
        
        if (document.getElementById('testimonialsSlider')) {
            loadTestimonials();
        }
        
        if (document.getElementById('productsGrid')) {
            loadProductsPage();
        }
        
        if (document.getElementById('productDetails')) {
            loadProductDetails();
        }
    });
});

// Export data for other scripts
window.appData = {
    products: () => productsData,
    categories: () => categoriesData,
    testimonials: () => testimonialsData,
    designers: () => designersData,
    loadData: loadData
};