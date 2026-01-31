// cart.js - Full Cart Page JavaScript

document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const cartEmpty = document.getElementById('cartEmpty');
    const cartItemsList = document.getElementById('cartItemsList');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const checkoutModal = document.getElementById('checkoutModal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const checkoutForm = document.getElementById('checkoutForm');

    // Cart data
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Initialize cart display
    updateCartDisplay();
    updateCartCount();

    // Checkout button
    checkoutBtn.addEventListener('click', () => {
        if (cart.length > 0) {
            checkoutModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });

    // Close modal buttons
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            checkoutModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });

    // Close modal on outside click
    checkoutModal.addEventListener('click', (e) => {
        if (e.target === checkoutModal) {
            checkoutModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Checkout form submit
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = {
            name: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            notes: document.getElementById('notes').value || 'No additional notes',
            cart: cart,
            total: calculateTotal()
        };

        const orderSummary = generateOrderSummary(formData);
        const phoneNumber = "12345678901"; // Replace with your WhatsApp number
        const message = `*New Custom Clothing Order*%0A%0A` +
            `*Customer Information*%0A` +
            `Name: ${formData.name}%0A` +
            `Email: ${formData.email}%0A` +
            `Phone: ${formData.phone}%0A` +
            `Address: ${formData.address}%0A%0A` +
            `*Order Details*%0A${orderSummary}%0A` +
            `*Design Notes*%0A${formData.notes}%0A%0A` +
            `*Total: $${formData.total.toFixed(2)}*`;

        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');

        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        updateCartCount();
        checkoutModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        checkoutForm.reset();
        showNotification('Order sent successfully! Our designer will contact you shortly.');
    });

    // Update cart display
    function updateCartDisplay() {
        if (cart.length === 0) {
            cartEmpty.classList.add('active');
            cartItemsList.classList.remove('active');
            checkoutBtn.disabled = true;
        } else {
            cartEmpty.classList.remove('active');
            cartItemsList.classList.add('active');
            checkoutBtn.disabled = false;
            cartItemsList.innerHTML = '';

            cart.forEach((item, index) => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.style.animationDelay = `${index * 0.1}s`;

                let itemId = item.id;
                if (!itemId) {
                    itemId = item.isCustom
                        ? `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                        : `product_${item.id || index}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
                    item.id = itemId;
                }
                cartItem.setAttribute('data-id', itemId);

                // Design preview
                let designPreviewHTML = '';
                if (item.isCustom) {
                    designPreviewHTML = `
                        <div class="custom-design-details">
                            ${item.customText ? `<div class="design-text-preview" style="color: ${item.textColor || '#000000'}; font-family: ${item.font || 'Arial'}; font-size:16px;">"${item.customText}"</div>` : ''}
                            ${item.design && item.design !== 'none' && item.design !== 'custom' ? `<div class="design-icon-preview"><i class="fas fa-${item.design}" style="color:${item.designColor || '#6d28d9'}"></i><span>${item.design.charAt(0).toUpperCase() + item.design.slice(1)} Design</span></div>` : ''}
                            ${item.design === 'custom' && item.uploadedImage ? `<div class="design-icon-preview"><i class="fas fa-image" style="color:${item.designColor || '#6d28d9'}"></i><span>Custom Image</span></div>` : ''}
                            ${item.garmentType ? `<div class="design-garment-preview">${getGarmentName(item.garmentType)}</div>` : ''}
                            <div class="design-colors-preview">
                                <span class="color-chip" style="background-color:${item.garmentColor || '#ffffff'}" title="Garment Color"></span>
                                ${item.designColor ? `<span class="color-chip" style="background-color:${item.designColor}" title="Design Color"></span>` : ''}
                                ${item.textColor ? `<span class="color-chip" style="background-color:${item.textColor}" title="Text Color"></span>` : ''}
                            </div>
                        </div>
                    `;
                }

                // Regular product color
                const colorToDisplay = item.color || 'Default';
                const colorHexToDisplay = item.colorHex || (item.color ? getColorHex(item.color) : '#cccccc');
                const colorDisplayHTML = (!item.isCustom && colorToDisplay !== 'Default') ? `<div class="cart-item-color"><span>Color:</span><div class="color-indicator" style="background-color:${colorHexToDisplay}"></div><span class="color-name">${colorToDisplay}</span></div>` : '';

                // Image / 3D preview
                let imageHTML = '';
                if (Array.isArray(item.preview) && item.preview[0].startsWith('data:image')) {
                    imageHTML = `<img src="${item.preview[0]}" alt="${item.name}" class="cart-item-img">`;
                } else if (typeof item.preview === 'string' && item.preview.startsWith('data:image')) {
                    imageHTML = `<img src="${item.preview}" alt="${item.name}" class="cart-item-img">`;
                } else if (item.image) {
                    imageHTML = `<img src="${item.image}" alt="${item.name}" class="cart-item-img">`;
                }


                cartItem.innerHTML = `
                    <div class="cart-item-image">${imageHTML}</div>
                    <div class="cart-item-info">
                        <h3 class="cart-item-title">${item.name}</h3>
                        <div class="cart-item-price">
                            $${(item.price || 0).toFixed(2)}
                            ${item.quantity > 1 ? `<span class="item-total">$${(item.price * item.quantity).toFixed(2)} total</span>` : ''}
                        </div>
                        ${colorDisplayHTML}
                        ${item.size ? `<div class="cart-item-size">Size: ${item.size}</div>` : ''}
                        ${designPreviewHTML}
                        <div class="cart-item-quantity">
                            <button class="quantity-btn decrease-quantity" data-id="${itemId}">-</button>
                            <span class="quantity-value">${item.quantity || 1}</span>
                            <button class="quantity-btn increase-quantity" data-id="${itemId}">+</button>
                        </div>
                    </div>
                    <div class="cart-item-actions">
                        <button class="remove-item" data-id="${itemId}" title="Remove item"><i class="fas fa-trash"></i></button>
                        <button class="move-to-wishlist" data-id="${itemId}" title="Save for later"><i class="fas fa-heart"></i></button>
                    </div>
                `;

                cartItemsList.appendChild(cartItem);
            });

            addCartItemEventListeners();
        }

        updateOrderSummary();
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    // Event delegation
    function addCartItemEventListeners() {
        document.addEventListener('click', e => {
            const removeBtn = e.target.closest('.remove-item');
            if (removeBtn) { removeItemFromCart(removeBtn.getAttribute('data-id')); }

            const wishlistBtn = e.target.closest('.move-to-wishlist');
            if (wishlistBtn) { moveToWishlist(wishlistBtn.getAttribute('data-id')); }

            const decreaseBtn = e.target.closest('.decrease-quantity');
            if (decreaseBtn) { updateItemQuantity(decreaseBtn.getAttribute('data-id'), -1); }

            const increaseBtn = e.target.closest('.increase-quantity');
            if (increaseBtn) { updateItemQuantity(increaseBtn.getAttribute('data-id'), 1); }
        });
    }

    // Remove item
    function removeItemFromCart(itemId) {
        const idx = cart.findIndex(item => item.id == itemId);
        if (idx !== -1) {
            const itemElement = document.querySelector(`.cart-item[data-id="${itemId}"]`);
            if (itemElement) { itemElement.classList.add('removing'); }
            setTimeout(() => {
                cart.splice(idx, 1);
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartDisplay();
                updateCartCount();
                showNotification('Item removed from cart');
            }, 300);
        }
    }

    // Move to wishlist
    function moveToWishlist(itemId) {
        const item = cart.find(i => i.id === itemId);
        if (item) {
            let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
            if (!wishlist.some(w => w.id === itemId)) {
                wishlist.push(item);
                localStorage.setItem('wishlist', JSON.stringify(wishlist));
                showNotification('Item moved to wishlist');
            } else showNotification('Item already in wishlist');
        }
    }

    // Update quantity
    function updateItemQuantity(itemId, change) {
        const idx = cart.findIndex(item => item.id == itemId);
        if (idx !== -1) {
            cart[idx].quantity = (cart[idx].quantity || 1) + change;
            if (cart[idx].quantity < 1) { cart[idx].quantity = 1; showNotification('Quantity cannot be less than 1'); }
            if (cart[idx].quantity > 10) { cart[idx].quantity = 10; showNotification('Maximum quantity is 10'); }

            const el = document.querySelector(`.cart-item[data-id="${itemId}"] .quantity-value`);
            if (el) el.textContent = cart[idx].quantity;
            const totalEl = document.querySelector(`.cart-item[data-id="${itemId}"] .item-total`);
            if (totalEl) totalEl.textContent = `$${(cart[idx].price * cart[idx].quantity).toFixed(2)} total`;

            localStorage.setItem('cart', JSON.stringify(cart));
            updateOrderSummary();
            updateCartCount();
        }
    }

    // Order summary
    function updateOrderSummary() {
        let subtotal = cart.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);
        let tax = subtotal * 0.08;
        let shipping = subtotal >= 50 ? 0 : 5.99;
        let total = subtotal + tax + shipping;

        const subtotalEl = document.getElementById('subtotal');
        const taxEl = document.getElementById('tax');
        const shippingEl = document.getElementById('shipping');
        const totalEl = document.getElementById('total');

        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
        if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    }

    // Total for WhatsApp
    function calculateTotal() {
        let subtotal = cart.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);
        let tax = subtotal * 0.08;
        let shipping = subtotal >= 50 ? 0 : 5.99;
        return subtotal + tax + shipping;
    }

    // WhatsApp summary
    function generateOrderSummary(formData) {
        let summary = '';
        formData.cart.forEach((i, idx) => {
            const qty = i.quantity || 1;
            summary += `${idx + 1}. ${i.name}%0A`;
            if (i.size) summary += `   Size: ${i.size}%0A`;
            if (i.color) summary += `   Color: ${i.color}%0A`;
            if (i.isCustom && i.customText) summary += `   Custom Text: "${i.customText}"%0A`;
            if (i.isCustom && i.design && i.design !== 'none') summary += `   Design: ${i.design}%0A`;
            summary += `   Quantity: ${qty}%0A`;
            summary += `   Price: $${i.price.toFixed(2)} x ${qty} = $${(i.price * qty).toFixed(2)}%0A%0A`;
        });

        let subtotal = formData.cart.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);
        let tax = subtotal * 0.08;
        let shipping = subtotal >= 50 ? 0 : 5.99;
        let total = subtotal + tax + shipping;

        summary += `%0ASubtotal: $${subtotal.toFixed(2)}%0ATax: $${tax.toFixed(2)}%0AShipping: ${shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}%0ATotal: $${total.toFixed(2)}%0A`;
        return summary;
    }

    // Cart count
    function updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalItems = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);
            cartCount.textContent = totalItems;
        }
    }

    // Garment helpers
    function getGarmentIcon(type) {
        const icons = { tshirt: 'fa-tshirt', hoodie: 'fa-hoodie', shirt: 'fa-shirt', jacket: 'fa-jacket', cap: 'fa-hat-cowboy', sweatshirt: 'fa-tshirt' };
        return icons[type] || 'fa-tshirt';
    }
    function getGarmentName(type) {
        const names = { tshirt: 'T-Shirt', hoodie: 'Hoodie', shirt: 'Polo Shirt', jacket: 'Jacket', cap: 'Cap', sweatshirt: 'Sweatshirt' };
        return names[type] || 'Custom Garment';
    }
    function getColorHex(colorName) {
        const colors = { Black: '#000', White: '#FFF', Olive: '#556B2F', Red: '#CE1126', Blue: '#3b82f6', Green: '#10b981', Purple: '#8b5cf6', Orange: '#f59e0b', Navy: '#000080', Grey: '#808080', Charcoal: '#36454F', Burgundy: '#800020', Sand: '#C2B280', Cream: '#FFFDD0' };
        return colors[colorName] || '#cccccc';
    }

    // Notification
    function showNotification(msg) {
        const existing = document.querySelectorAll('.notification');
        existing.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = msg;
        notification.style.cssText = `position:fixed;top:100px;right:20px;background-color:var(--primary-color);color:white;padding:15px 25px;border-radius:10px;z-index:10000;animation:slideInRight 0.3s ease, fadeOut 0.3s ease 2s forwards;display:flex;align-items:center;font-weight:500;max-width:350px;`;
        document.body.appendChild(notification);

        setTimeout(() => { notification.remove(); }, 2300);

        if (!document.querySelector('#cart-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'cart-notification-styles';
            style.textContent = `
                @keyframes slideInRight {from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
                @keyframes fadeOut {from{opacity:1}to{opacity:0}}
                .cart-item.removing {animation:slideDown 0.3s ease forwards;}
                @keyframes slideDown {from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(20px)}}
            `;
            document.head.appendChild(style);
        }
    }
});
