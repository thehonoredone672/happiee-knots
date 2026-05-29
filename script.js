/**
 * LUMINA HANDMADE - BOUTIQUE GIFTS
 * JavaScript for interactive features
 * Clean, minimalist luxury design
 */

// ========== Data ==========
const categories = [
    {
        id: 'artisan-crafts',
        name: 'Artisan Crafts',
        image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663612193243/2epC47i6oYFM5pzKLA2qJa/category-artisan-crafts-gQ9TWCJVNqhmbMs6zCFrqG.webp',
        description: 'Handmade ceramics and wooden treasures'
    },
    {
        id: 'jewelry',
        name: 'Handmade Jewelry',
        image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663612193243/2epC47i6oYFM5pzKLA2qJa/category-jewelry-nB4uikXUkSyEFtD4RKYTaZ.webp',
        description: 'Elegant pieces, uniquely crafted'
    },
    {
        id: 'home-decor',
        name: 'Home Decor',
        image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663612193243/2epC47i6oYFM5pzKLA2qJa/category-home-decor-WJfVcU6jitzS8WY8SqjCxW.webp',
        description: 'Pieces that make a house feel like home'
    },
    {
        id: 'personalized',
        name: 'Personalized Gifts',
        image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663612193243/2epC47i6oYFM5pzKLA2qJa/category-personalized-gifts-azNtexHgwJ2ZvcytVGJMzQ.webp',
        description: 'Customized treasures for special moments'
    },
    {
        id: 'eco-friendly',
        name: 'Eco-Friendly',
        image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663612193243/2epC47i6oYFM5pzKLA2qJa/category-artisan-crafts-gQ9TWCJVNqhmbMs6zCFrqG.webp',
        description: 'Sustainable and conscious choices'
    },
    {
        id: 'seasonal',
        name: 'Seasonal Collections',
        image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663612193243/2epC47i6oYFM5pzKLA2qJa/category-home-decor-WJfVcU6jitzS8WY8SqjCxW.webp',
        description: 'Limited edition seasonal finds'
    }
];

// ========== DOM Elements ==========
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const categoriesGrid = document.getElementById('categoriesGrid');
const newsletterForm = document.getElementById('newsletterForm');
const searchInput = document.getElementById('searchInput');

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', function() {
    initializeCategories();
    attachEventListeners();
    console.log('Lumina Handmade website initialized');
});

// ========== Functions ==========

/**
 * Initialize and render categories
 */
function initializeCategories() {
    if (!categoriesGrid) return;

    categoriesGrid.innerHTML = categories.map((category, index) => `
        <div class="category-card" style="animation-delay: ${index * 0.1}s">
            <div class="category-image-wrapper">
                <img src="${category.image}" alt="${category.name}" class="category-image">
                <div class="category-overlay"></div>
            </div>
            <div class="category-content">
                <h3 class="category-title">${category.name}</h3>
                <p class="category-description">${category.description}</p>
                <a href="#" class="category-link">
                    Explore
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </a>
            </div>
        </div>
    `).join('');
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
    // Mobile menu toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Close mobile menu when clicking on a nav link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Newsletter form submission
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Category card interactions
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', handleCategoryClick);
    });

    // Action buttons
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', handleActionButton);
    });
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    if (!navMenu) return;
    navMenu.classList.toggle('active');
    
    // Update menu toggle icon
    const icon = menuToggle.querySelector('svg');
    if (navMenu.classList.contains('active')) {
        // Change to X icon
        icon.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>';
    } else {
        // Change back to menu icon
        icon.innerHTML = '<line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
    }
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    if (!navMenu) return;
    navMenu.classList.remove('active');
    
    // Reset menu toggle icon
    const icon = menuToggle.querySelector('svg');
    icon.innerHTML = '<line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
}

/**
 * Handle newsletter form submission
 */
function handleNewsletterSubmit(e) {
    e.preventDefault();
    
    const emailInput = newsletterForm.querySelector('input[type="email"]');
    const email = emailInput.value;

    if (email) {
        // Show success message
        showNotification('Thank you for subscribing!', 'success');
        
        // Reset form
        newsletterForm.reset();
        
        // Log for demonstration
        console.log('Newsletter subscription:', email);
    }
}

/**
 * Handle search input
 */
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    
    if (query.length === 0) {
        // Show all categories
        const cards = document.querySelectorAll('.category-card');
        cards.forEach(card => {
            card.style.display = 'block';
        });
        return;
    }

    // Filter categories based on search query
    const cards = document.querySelectorAll('.category-card');
    cards.forEach(card => {
        const title = card.querySelector('.category-title').textContent.toLowerCase();
        const description = card.querySelector('.category-description').textContent.toLowerCase();
        
        if (title.includes(query) || description.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * Handle category card click
 */
function handleCategoryClick(e) {
    if (e.target.closest('.category-link')) {
        e.preventDefault();
        const categoryName = e.currentTarget.querySelector('.category-title').textContent;
        showNotification(`Exploring ${categoryName}...`, 'info');
        console.log('Category clicked:', categoryName);
    }
}

/**
 * Handle action button clicks
 */
function handleActionButton(e) {
    const button = e.currentTarget;
    
    if (button.classList.contains('heart-btn')) {
        showNotification('Added to Wishlist', 'success');
        button.classList.toggle('active');
    } else if (button.classList.contains('cart-btn')) {
        showNotification('Added to Cart', 'success');
    } else if (button.classList.contains('user-btn')) {
        showNotification('Redirecting to Account...', 'info');
    }
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        font-size: 0.875rem;
        font-weight: 500;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    
    if (!document.querySelector('style[data-notification]')) {
        style.setAttribute('data-notification', 'true');
        document.head.appendChild(style);
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/**
 * Smooth scroll to section
 */
function smoothScroll(target) {
    const element = document.querySelector(target);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Handle hero button click
 */
document.addEventListener('DOMContentLoaded', function() {
    const heroBtn = document.querySelector('.hero-btn');
    if (heroBtn) {
        heroBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Explore our collection', 'info');
            smoothScroll('.categories');
        });
    }
});

/**
 * Handle view all button click
 */
document.addEventListener('DOMContentLoaded', function() {
    const viewAllBtn = document.querySelector('.view-all-mobile');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Loading all categories...', 'info');
        });
    }
});

/**
 * Add keyboard shortcuts
 */
document.addEventListener('keydown', function(e) {
    // Press '/' to focus search
    if (e.key === '/' && searchInput) {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Press 'Escape' to close mobile menu
    if (e.key === 'Escape' && navMenu && navMenu.classList.contains('active')) {
        closeMobileMenu();
    }
});

/**
 * Lazy load images
 */
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for older browsers
        images.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }
}

/**
 * Initialize on page load
 */
window.addEventListener('load', function() {
    lazyLoadImages();
});

/**
 * Add smooth scroll behavior for anchor links
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            smoothScroll(href);
        }
    });
});

/**
 * Track user interactions for analytics (optional)
 */
function trackEvent(eventName, eventData = {}) {
    console.log(`Event: ${eventName}`, eventData);
    // You can send this to an analytics service
}

/**
 * Handle responsive behavior
 */
function handleResponsive() {
    const width = window.innerWidth;
    
    if (width > 768 && navMenu && navMenu.classList.contains('active')) {
        closeMobileMenu();
    }
}

window.addEventListener('resize', handleResponsive);

/**
 * Add active state to navigation links based on scroll position
 */
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ========== Export for use in other modules (if needed) ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        categories,
        toggleMobileMenu,
        handleSearch,
        showNotification,
        smoothScroll,
        trackEvent
    };
}
