// Product Details Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id') || 1;
    
    // DOM Elements
    const mainImage = document.getElementById('mainImage');
    const imageThumbnails = document.getElementById('imageThumbnails');
    const productTitle = document.getElementById('productTitle');
    const productName = document.getElementById('productName');
    const productStars = document.getElementById('productStars');
    const ratingValue = document.getElementById('ratingValue');
    const currentPrice = document.getElementById('currentPrice');
    const originalPrice = document.getElementById('originalPrice');
    const discountTag = document.getElementById('discountTag');
    const productDescription = document.getElementById('productDescription');
    const productFeatures = document.getElementById('productFeatures');
    const sizeOptions = document.getElementById('sizeOptions');
    const colorOptions = document.getElementById('colorOptions');
    const productBadge = document.getElementById('productBadge');
    const detailedDescription = document.getElementById('detailedDescription');
    const specsTable = document.getElementById('specsTable');
    const overallRating = document.getElementById('overallRating');
    const overallStars = document.getElementById('overallStars');
    const totalReviews = document.getElementById('totalReviews');
    const ratingBars = document.getElementById('ratingBars');
    const reviewsList = document.getElementById('reviewsList');
    const relatedProductsGrid = document.getElementById('relatedProductsGrid');
    const quantityInput = document.querySelector('.quantity-input');
    const minusBtn = document.querySelector('.quantity-btn.minus');
    const plusBtn = document.querySelector('.quantity-btn.plus');
    const addToCartBtn = document.querySelector('.add-to-cart');
    const wishlistBtn = document.querySelector('.wishlist-btn');
    const whatsappBtn = document.querySelector('.whatsapp-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const whatsappConsultBtn = document.querySelector('.whatsapp-consult');
    
    // Current product data
    let currentProduct = null;
    let allProducts = [];
    let selectedSize = null;
    let selectedColor = null;
    let selectedQuantity = 1;
    
    // Load product data
    async function loadProductData() {
        showLoading();
        
        try {
            const response = await fetch('data/products.json');
            const data = await response.json();
            allProducts = data.products;

            const numericProductId = parseInt(productId);
            
            // Find the product by ID
            currentProduct = allProducts.find(p => p.id === numericProductId );
            
            if (currentProduct) {
                updateProductDetails(currentProduct);
                loadRelatedProducts(currentProduct);
                hideLoading();
            } else {
                showError('Product not found');
            }
        } catch (error) {
            console.error('Error loading product data:', error);
            showError('Failed to load product details');
            loadFallbackProduct();
        }
    }
    
    // Fallback product data
    function loadFallbackProduct() {
        currentProduct = {
            id: productId,
            name: "Palestinian Keffiyeh Print T-Shirt",
            price: 34.99,
            originalPrice: 44.99,
            category: "tshirts",
            description: "High-quality cotton t-shirt featuring traditional Palestinian keffiyeh pattern design. Made with organic cotton and eco-friendly dyes.",
            rating: 4.8,
            reviewCount: 142,
            sizes: ["S", "M", "L", "XL", "XXL"],
            colors: [
                { name: "Black & White", hex: "#000000" },
                { name: "Olive Green", hex: "#556B2F" },
                { name: "Palestinian Red", hex: "#CE1126" }
            ],
            images: [
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            ],
            tags: ["keffiyeh", "traditional", "best-seller"],
            inStock: true,
            featured: true,
            customizable: true
        };
        
        updateProductDetails(currentProduct);
        loadRelatedProducts(currentProduct);
        hideLoading();
    }
    
    // Update product details on the page
    function updateProductDetails(product) {
        // Update basic info
        document.title = `${product.name} | Falasteen Threads`;
        productTitle.textContent = product.name;
        productName.textContent = product.name;
        productDescription.textContent = product.description;
        detailedDescription.textContent = product.detailedDescription || product.description;
        
        // Update price
        currentPrice.textContent = `$${product.price.toFixed(2)}`;
        
        if (product.originalPrice) {
            originalPrice.textContent = `$${product.originalPrice.toFixed(2)}`;
            const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
            discountTag.textContent = `${discount}% OFF`;
            discountTag.style.display = 'inline-block';
        } else {
            originalPrice.style.display = 'none';
            discountTag.style.display = 'none';
        }
        
        // Update rating
        updateRating(product.rating, product.reviewCount);
        
        // Update images
        updateProductImages(product.images);
        
        // Update badge
        updateProductBadge(product);
        
        // Update features
        updateProductFeatures(product);
        
        // Update size options
        updateSizeOptions(product.sizes);
        
        // Update color options
        updateColorOptions(product.colors);
        
        // Update specifications
        updateSpecifications(product.specifications || getDefaultSpecifications(product));
        
        // Update reviews
        updateReviews(product.reviews || [], product.rating, product.reviewCount);
        
        // Initialize selections
        selectedSize = product.sizes ? product.sizes[0] : null;
        selectedColor = product.colors ? product.colors[0] : null;
        selectedQuantity = 1;
        quantityInput.value = 1;
        
        // Update wishlist button
        updateWishlistButton();
    }

    function getDefaultSpecifications(product) {
        return [
            { label: "Material", value: product.material || "Premium Cotton" },
            { label: "Category", value: product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1) : "Clothing" },
            { label: "Customizable", value: product.customizable ? "Yes" : "No" },
            { label: "In Stock", value: product.inStock ? "Yes" : "No" },
            { label: "Care Instructions", value: "Machine wash cold, Tumble dry low" },
            { label: "Origin", value: "Made with care" },
            { label: "Sustainability", value: product.sustainability || "Eco-friendly production" }
        ];
    }
    
    // Update product rating
    function updateRating(rating, reviewCount) {
        // Update stars
        const starsContainer = productStars;
        starsContainer.innerHTML = generateStarRating(rating);
        
        // Update rating text
        ratingValue.textContent = `${rating.toFixed(1)} (${reviewCount} reviews)`;
        
        // Update overall rating
        overallRating.textContent = rating.toFixed(1);
        overallStars.innerHTML = generateStarRating(rating);
        totalReviews.textContent = `Based on ${reviewCount} reviews`;
        
        // Update rating bars (simulated data)
        updateRatingBars(rating, reviewCount);
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
    
    // Update product images
    function updateProductImages(images) {
        if (!images || images.length === 0) return;
        
        // Set main image
        mainImage.src = images[0];
        mainImage.alt = productTitle.textContent;
        
        // Clear thumbnails
        imageThumbnails.innerHTML = '';
        
        // Create thumbnails
        images.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.setAttribute('data-image', image);
            
            const img = document.createElement('img');
            img.src = image;
            img.alt = `${productTitle.textContent} - View ${index + 1}`;
            
            thumbnail.appendChild(img);
            imageThumbnails.appendChild(thumbnail);
            
            // Add click event
            thumbnail.addEventListener('click', function() {
                // Remove active class from all thumbnails
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked thumbnail
                this.classList.add('active');
                
                // Update main image
                mainImage.src = this.getAttribute('data-image');
                
                // Add fade effect
                mainImage.style.opacity = '0.7';
                setTimeout(() => {
                    mainImage.style.opacity = '1';
                }, 200);
            });
        });
    }
    
    // Update product badge
    function updateProductBadge(product) {
        if (product.tags && product.tags.includes('best-seller')) {
            productBadge.textContent = 'Best Seller';
            productBadge.style.backgroundColor = 'var(--secondary-color)';
            productBadge.style.display = 'block';
        } else if (product.featured) {
            productBadge.textContent = 'Featured';
            productBadge.style.backgroundColor = '#10b981';
            productBadge.style.display = 'block';
        } else if (product.originalPrice) {
            const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
            if (discount >= 20) {
                productBadge.textContent = 'Sale';
                productBadge.style.backgroundColor = '#f59e0b';
                productBadge.style.display = 'block';
            } else {
                productBadge.style.display = 'none';
            }
        } else {
            productBadge.style.display = 'none';
        }
    }
    
    // Update product features
    function updateProductFeatures(product) {
        productFeatures.innerHTML = '';
        
        // Default features for clothing
        const defaultFeatures = [
            "Premium quality materials",
            "Durable construction",
            "Easy to customize",
            "Eco-friendly production",
            "Comfortable fit"
        ];
        
        const features = product.features || defaultFeatures;
        
        features.forEach(feature => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-check"></i> ${feature}`;
            productFeatures.appendChild(li);
        });
    }
    
    // Update size options
    function updateSizeOptions(sizes) {
        if (!sizes || sizes.length === 0) return;
        
        sizeOptions.innerHTML = '';
        
        sizes.forEach((size, index) => {
            const button = document.createElement('button');
            button.className = `size-option ${index === 0 ? 'active' : ''}`;
            button.textContent = size;
            
            button.addEventListener('click', function() {
                // Remove active class from all size options
                document.querySelectorAll('.size-option').forEach(opt => opt.classList.remove('active'));
                
                // Add active class to clicked option
                this.classList.add('active');
                
                // Update selected size
                selectedSize = size;
            });
            
            sizeOptions.appendChild(button);
        });
    }
    
    // Update color options
    function updateColorOptions(colors) {
        if (!colors || colors.length === 0) return;
        
        colorOptions.innerHTML = '';
        
        colors.forEach((color, index) => {
            const button = document.createElement('button');
            button.className = `color-option ${index === 0 ? 'active' : ''}`;
            
            if (typeof color === 'object') {
                button.style.backgroundColor = color.hex;
                button.setAttribute('data-color', color.name);
                button.setAttribute('data-hex', color.hex);
                button.setAttribute('title', color.name);
            } else {
                button.style.backgroundColor = color;
                button.setAttribute('data-color', color);
                button.setAttribute('data-hex', color);
                button.setAttribute('title', color);
            }
            
            button.addEventListener('click', function() {
                // Remove active class from all color options
                document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
                
                // Add active class to clicked option
                this.classList.add('active');
                
                // Update selected color
                selectedColor = {
                    name: this.getAttribute('data-color'),
                    hex: this.getAttribute('data-hex')
                };
            });
            
            colorOptions.appendChild(button);
        });
    }
    
    // Update specifications
    function updateSpecifications(specifications) {
        specsTable.innerHTML = '';
    
        specifications.forEach(spec => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <th>${spec.label}</th>
                <td>${spec.value}</td>
            `;
            specsTable.appendChild(row);
        });
    }
    
    // Update rating bars
    function updateRatingBars(rating, totalReviews) {
        // Simulated rating distribution
        const distribution = [
            { stars: 5, percentage: 65 },
            { stars: 4, percentage: 20 },
            { stars: 3, percentage: 10 },
            { stars: 2, percentage: 3 },
            { stars: 1, percentage: 2 }
        ];
        
        ratingBars.innerHTML = '';
        
        distribution.forEach(item => {
            const bar = document.createElement('div');
            bar.className = 'rating-bar';
            bar.innerHTML = `
                <span>${item.stars} stars</span>
                <div class="bar">
                    <div class="fill" style="width: ${item.percentage}%"></div>
                </div>
                <span>${item.percentage}%</span>
            `;
            ratingBars.appendChild(bar);
        });
    }
    
    // Update reviews
    function updateReviews(reviews, rating, reviewCount) {
        reviewsList.innerHTML = '';
        
        if (reviews.length === 0) {
            // Show a message if no reviews
            reviewsList.innerHTML = `
                <div class="no-reviews">
                    <i class="fas fa-comment-alt"></i>
                    <p>No reviews yet. Be the first to review this product!</p>
                </div>
            `;
            return;
        }
        
        reviews.forEach(review => {
            const reviewElement = document.createElement('div');
            reviewElement.className = 'review';
            reviewElement.innerHTML = `
                <div class="review-header">
                    <div class="reviewer">
                        <div class="avatar">${review.avatar || review.name.charAt(0)}</div>
                        <div class="reviewer-info">
                            <h4>${review.name}</h4>
                            <div class="review-rating">
                                ${generateStarRating(review.rating)}
                            </div>
                        </div>
                    </div>
                    <span class="review-date">${review.date || 'Recently'}</span>
                </div>
                <div class="review-content">
                    <p>${review.comment}</p>
                </div>
            `;
            reviewsList.appendChild(reviewElement);
        });
    }

    function handleAddToCart() {
    if (!currentProduct) return;
    
    // Check if color is selected
    if (!selectedColor) {
        showNotification('Please select a color');
        return;
    }
    
    // Check if size is selected
    if (!selectedSize) {
        showNotification('Please select a size');
        return;
    }
    
    // Get cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Get the color name properly
    const colorName = typeof selectedColor === 'object' ? selectedColor.name : selectedColor;
    const colorHex = typeof selectedColor === 'object' ? selectedColor.hex : selectedColor;
    
    const cartItem = {
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        size: selectedSize,
        color: colorName, // Save color name
        colorHex: colorHex, // Save color hex
        quantity: parseInt(selectedQuantity),
        image: currentProduct.images[0],
        category: currentProduct.category,
        isCustom: false // Mark as regular product
    };
    
    // Check if similar item already in cart (same product, size, and color)
    const existingItemIndex = cart.findIndex(item => 
        item.id === cartItem.id && 
        item.size === cartItem.size && 
        item.color === cartItem.color
    );

    if (existingItemIndex > -1) {
        // Update quantity
        cart[existingItemIndex].quantity += parseInt(selectedQuantity);
    } else {
        // Add new item
        cart.push(cartItem);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    updateCartCount();
    
    // Show notification
    showNotification(`${selectedQuantity} ${currentProduct.name} added to cart!`);

    // Button animation
    const originalHTML = addToCartBtn.innerHTML;
    addToCartBtn.innerHTML = '<i class="fas fa-check"></i> Added!';
    addToCartBtn.style.backgroundColor = '#10b981';
    
    setTimeout(() => {
        addToCartBtn.innerHTML = originalHTML;
        addToCartBtn.style.backgroundColor = '';
    }, 2000);
}


    // Load related products
    function loadRelatedProducts(currentProduct) {
        if (!allProducts || allProducts.length === 0) return;
        
        // Filter related products (same category, exclude current)
        const relatedProducts = allProducts
            .filter(p => p.id != currentProduct.id && p.category === currentProduct.category)
            .slice(0, 4); // Show up to 4 related products
        
        if (relatedProducts.length === 0) {
            // If no same category products, show any other products
            relatedProductsGrid.innerHTML = '<p class="no-products">No related products found.</p>';
            return;
        }
        
        // Clear current grid
        relatedProductsGrid.innerHTML = '';
        
        // Add related products
        relatedProducts.forEach(product => {
            const productCard = createProductCard(product);
            relatedProductsGrid.appendChild(productCard);
        });
    }
    
    // Create product card for related products
    function createProductCard(product) {
        const card = document.createElement('a');
        card.href = `product-details.html?id=${product.id}`;
        card.className = 'product-card';
        
        const discount = product.originalPrice ? 
            Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
        
        const badges = [];
        if (product.featured) badges.push('<span class="badge popular">Popular</span>');
        if (product.tags && product.tags.includes('best-seller')) badges.push('<span class="badge sale">Best Seller</span>');
        if (product.originalPrice && discount >= 20) badges.push('<span class="badge sale">Sale</span>');
        
        const badgesHtml = badges.length ? `<div class="product-badges">${badges.join('')}</div>` : '';
        
        card.innerHTML = `
            <div class="product-img">
                <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
                ${badgesHtml}
                <button class="wishlist-btn" data-product-id="${product.id}">
                    <i class="far fa-heart"></i>
                </button>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-rating">
                    ${generateStarRating(product.rating)}
                </div>
                <button class="btn btn-sm add-to-cart" data-product-id="${product.id}">Add to Cart</button>
            </div>
        `;
        
        return card;
    }
    
    // Update wishlist button
    function updateWishlistButton() {
        const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        const icon = wishlistBtn.querySelector('i');
        
        if (wishlist.includes(currentProduct.id.toString())) {
            icon.className = 'fas fa-heart';
            wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> In Wishlist';
        } else {
            icon.className = 'far fa-heart';
            wishlistBtn.innerHTML = '<i class="far fa-heart"></i> Add to Wishlist';
        }
    }
    
    // Quantity controls
    minusBtn.addEventListener('click', function() {
        let currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
            selectedQuantity = quantityInput.value;
        }
    });
    
    plusBtn.addEventListener('click', function() {
        let currentValue = parseInt(quantityInput.value);
        if (currentValue < 10) {
            quantityInput.value = currentValue + 1;
            selectedQuantity = quantityInput.value;
        }
    });
    
    quantityInput.addEventListener('change', function() {
        let value = parseInt(this.value);
        if (value < 1) this.value = 1;
        if (value > 10) this.value = 10;
        selectedQuantity = this.value;
    });
    

    // Wishlist button
    wishlistBtn.addEventListener('click', function() {
        if (!currentProduct) return;
        
        // Get wishlist from localStorage
        let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        const productId = currentProduct.id.toString();
        
        if (wishlist.includes(productId)) {
            // Remove from wishlist
            wishlist = wishlist.filter(id => id !== productId);
            this.innerHTML = '<i class="far fa-heart"></i> Add to Wishlist';
            showNotification('Removed from wishlist');
        } else {
            // Add to wishlist
            wishlist.push(productId);
            this.innerHTML = '<i class="fas fa-heart"></i> In Wishlist';
            showNotification('Added to wishlist!');
        }
        
        // Save to localStorage
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        
        // Update wishlist button
        updateWishlistButton();
    });
    
    // WhatsApp buttons
    whatsappBtn.addEventListener('click', function() {
        sendWhatsAppMessage('product');
    });
    
    if (whatsappConsultBtn) {
        whatsappConsultBtn.addEventListener('click', function() {
            sendWhatsAppMessage('consultation');
        });
    }
    
    function sendWhatsAppMessage(type) {
        if (!currentProduct) return;
        
        const phoneNumber = "12345678901"; // Replace with actual WhatsApp number
        let message = '';
        
        if (type === 'product') {
            message = 
                `I'm interested in the ${currentProduct.name}!%0A%0A` +
                `Product Details:%0A` +
                `- Price: $${currentProduct.price}%0A` +
                `- Size: ${selectedSize}%0A` +
                `- Color: ${selectedColor}%0A` +
                `- Quantity: ${selectedQuantity}%0A%0A` +
                `I'd like to purchase this item!`;
        } else {
            message = 
                `I'm interested in customizing the ${currentProduct.name}!%0A%0A` +
                `I'd like to discuss customization options including:%0A` +
                `- Screen printing%0A` +
                `- Embroidery%0A` +
                `- Direct-to-garment printing%0A%0A` +
                `Please provide more information about pricing and process!`;
        }
        
        const url = `https://wa.me/${phoneNumber}?text=${message}`;
        window.open(url, '_blank');
    }
    
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(tab => tab.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding tab content
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === tabId) {
                    pane.classList.add('active');
                }
            });
        });
    });
    
    // Event delegation for related products
    document.addEventListener('click', function(e) {
        // Add to cart buttons in related products
        if (e.target.closest('.add-to-cart')) {
            e.preventDefault();
            e.stopPropagation();
            
            const productId = e.target.closest('.add-to-cart').getAttribute('data-product-id');
            const product = allProducts.find(p => p.id == productId);
            
            if (!product) return;
            
            // Get cart from localStorage
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            
            // Create cart item
            const cartItem = {
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                image: product.images[0]
            };
            
            // Add to cart
            cart.push(cartItem);
            
            // Save to localStorage
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // Update cart count
            updateCartCount();
            
            // Show notification
            showNotification(`${product.name} added to cart!`);
            
            // Button animation
            const button = e.target.closest('.add-to-cart');
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Added!';
            button.style.backgroundColor = '#10b981';
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.backgroundColor = '';
            }, 2000);
        }
        
        // Wishlist buttons in related products
        if (e.target.closest('.wishlist-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            const productId = e.target.closest('.wishlist-btn').getAttribute('data-product-id');
            const button = e.target.closest('.wishlist-btn');
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
    });
    
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
    
    // Show loading state
    function showLoading() {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'loadingOverlay';
        overlay.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(overlay);
    }
    
    // Hide loading state
    function hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    // Show error message
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: white;
                padding: 40px;
                border-radius: 15px;
                box-shadow: var(--shadow-lg);
                text-align: center;
                z-index: 10000;
            ">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #ef4444; margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 10px;">Error Loading Product</h3>
                <p style="margin-bottom: 20px; color: var(--text-light);">${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Try Again</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
    
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
    
    // Initialize
    loadProductData();
    updateCartCount();

    addToCartBtn.addEventListener('click', handleAddToCart);
});