// about.js - Enhanced About Us Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS (Animate On Scroll)
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });

    // Animate stats counter with improved effect
    function animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-count'));
            const suffix = stat.textContent.includes('%') ? '%' : '';
            let current = 0;
            const duration = 2000; // 2 seconds
            const increment = target / (duration / 30);
            let startTime = null;
            
            function animate(currentTime) {
                if (!startTime) startTime = currentTime;
                const progress = currentTime - startTime;
                
                current = Math.min(target, (progress / duration) * target);
                stat.textContent = Math.floor(current) + suffix;
                
                if (current < target) {
                    requestAnimationFrame(animate);
                }
            }
            
            requestAnimationFrame(animate);
        });
    }
    
    // Stats animation observer
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(animateStats, 300);
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }
    
    // Timeline animation
    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const timelineItems = entry.target.querySelectorAll('.timeline-item');
            timelineItems.forEach((item, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        item.classList.add('visible');
                    }, index * 200);
                }
            });
        });
    }, { threshold: 0.3 });
    
    const timelineSection = document.querySelector('.timeline-section');
    if (timelineSection) {
        timelineObserver.observe(timelineSection);
    }
    
    // Back to Top button
    const backToTopBtn = document.querySelector('.back-to-top');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Pattern cards interaction
    const patternCards = document.querySelectorAll('.pattern-card');
    
    patternCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const patternType = this.getAttribute('data-pattern');
            const patternVisual = this.querySelector('.pattern-visual');
            
            patternVisual.style.transform = 'scale(1.1)';
            patternVisual.style.transition = 'transform 0.5s ease';
            
            // Add subtle animation to pattern
            switch(patternType) {
                case 'olive':
                    patternVisual.style.backgroundPosition = '100px 100px';
                    break;
                case 'cypress':
                    patternVisual.style.backgroundPosition = '40px 40px';
                    break;
                case 'water':
                    patternVisual.style.animation = 'wave 20s linear infinite';
                    break;
                case 'star':
                    patternVisual.style.transform = 'scale(1.1) rotate(5deg)';
                    break;
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const patternVisual = this.querySelector('.pattern-visual');
            patternVisual.style.transform = 'scale(1)';
            patternVisual.style.backgroundPosition = '0 0';
            patternVisual.style.animation = 'none';
        });
    });
    
    // Scroll down button
    const scrollDownBtn = document.querySelector('.scroll-down');
    if (scrollDownBtn) {
        scrollDownBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = document.querySelector('#story');
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }
    
    // Team member 3D effect
    const teamMembers = document.querySelectorAll('.team-member');
    
    teamMembers.forEach(member => {
        member.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateY = (x - centerX) / 25;
            const rotateX = (centerY - y) / 25;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-15px)`;
        });
        
        member.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-15px)';
            setTimeout(() => {
                this.style.transform = '';
            }, 300);
        });
    });
    
    // Value card tilt effect
    const valueCards = document.querySelectorAll('.value-card');
    
    valueCards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            
            const rotate = (x / rect.width - 0.5) * 10;
            
            this.style.transform = `perspective(1000px) rotateY(${rotate}deg) translateY(-15px) scale(1.02)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-15px) scale(1.02)';
            setTimeout(() => {
                this.style.transform = '';
            }, 300);
        });
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
            cartCount.style.animation = 'none';
            setTimeout(() => {
                cartCount.style.animation = 'bounce 0.5s ease';
            }, 10);
        }
    }
    
    // Initialize cart count
    updateCartCount();
    
    // Add CSS for wave animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes wave {
            0% { background-position: 0 0; }
            100% { background-position: 100px 100px; }
        }
        @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
        }
    `;
    document.head.appendChild(style);
    
    // Floating flags animation enhancement
    const flags = document.querySelectorAll('.flag-item');
    flags.forEach((flag, index) => {
        flag.style.animationDelay = `${index * 3}s`;
    });
    
    // Heritage banner text animation
    const heritageText = document.querySelector('.heritage-text');
    if (heritageText) {
        const text = heritageText.querySelector('span');
        const originalText = text.textContent;
        text.innerHTML = '';
        
        originalText.split('').forEach((char, i) => {
            const span = document.createElement('span');
            span.textContent = char;
            span.style.opacity = '0';
            span.style.display = 'inline-block';
            span.style.animation = `fadeIn 0.5s forwards ${i * 0.05}s`;
            text.appendChild(span);
        });
        
        const fadeStyle = document.createElement('style');
        fadeStyle.textContent = `
            @keyframes fadeIn {
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(fadeStyle);
    }
    
    // Interactive pattern showcase
    const patterns = document.querySelectorAll('.pattern-visual');
    patterns.forEach(pattern => {
        pattern.addEventListener('click', function() {
            const parent = this.closest('.pattern-card');
            const info = parent.querySelector('.pattern-info');
            
            info.classList.toggle('expanded');
            
            if (info.classList.contains('expanded')) {
                info.style.maxHeight = info.scrollHeight + 'px';
            } else {
                info.style.maxHeight = null;
            }
        });
    });
});