// ========================================
// SHARED SCRIPT FOR ALL PAGES
// ========================================

// Hold dynamic catalog instances fetched from MongoDB Atlas
let PRODUCTS = [];
let cart = JSON.parse(localStorage.getItem('happiee_cart')) || [];
let slideInterval;

// Modal State
let currentModalProductId = null;
let currentModalQty = 1;
let editingCartItemId = null; 
let currentUploadedPhotos = []; 

// Image Slider State (Local UI)
let currentModalSlide = 0;
let modalSlideCount = 0;
let modalAutoSlideInterval;

document.addEventListener('DOMContentLoaded', () => {
    setupMobileMenu();
    ensureModalMarkup();

    const isHomePage = document.getElementById('heroSlider');
    const isProductsPage = document.getElementById('productsGrid');

    if (isHomePage) initializeHeroSlider();
    
    // Trigger Database Stream ingestion if the viewport resides on the products catalogue page
    if (isProductsPage) {
        initializeProductsPage();
    } else {
        // If not on products page, we still need PRODUCTS to sync the cart properly
        fetchProductsAndSyncCart();
    }
});

// ========================================
// DATABASE FETCH & CART SYNCHRONIZATION
// ========================================
async function fetchProductsAndSyncCart() {
    try {
        const response = await fetch('/api/products/all');
        const data = await response.json();

        if (data.success && data.products) {
            PRODUCTS = data.products.map(product => ({
                ...product,
                id: product._id
            }));
        }
    } catch (err) {
        console.error("Failed synchronizing real-time catalog from MongoDB database instance:", err);
    }

    // Ensure Custom Order Base exists for personalization routing if not provided by DB
    if (!PRODUCTS.find(p => p.category === 'Personalized')) {
        PRODUCTS.push({
            id: '6', _id: '6', name: 'Custom Order Base', category: 'Personalized', price: 0,
            images: ['https://images.unsplash.com/photo-1607344645866-009c320b63e0?q=80&w=500&auto=format&fit=crop'],
            description: 'Unique custom orders tailored directly to your vision.'
        });
    }

    syncCartWithLocalDB();
}

function syncCartWithLocalDB() {
    let syncedCart = [];
    cart.forEach(cartItem => {
        const localProduct = PRODUCTS.find(p => p.id === cartItem.productId || p._id === cartItem.productId);
        if (localProduct) {
            syncedCart.push({
                ...cartItem,
                livePrice: localProduct.price,
                liveName: localProduct.name,
                liveCategory: localProduct.category,
                liveImage: (cartItem.customPhotosBase64 && cartItem.customPhotosBase64.length > 0) ? cartItem.customPhotosBase64[0] : (localProduct.images?.[0] || localProduct.image)
            });
        }
    });

    cart = syncedCart;
    localStorage.setItem('happiee_cart', JSON.stringify(cart));
    updateCartUI();
}

// ========================================
// UI & NAVIGATION SETUP
// ========================================
function setupMobileMenu() {
    const menuToggles = document.querySelectorAll('.menu-toggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');

    const toggleMenu = () => {
        if(mobileMenu) mobileMenu.classList.toggle('open');
        if(mobileOverlay) mobileOverlay.classList.toggle('open');
    };

    menuToggles.forEach(btn => btn.addEventListener('click', toggleMenu));
    document.getElementById('mobileMenuClose')?.addEventListener('click', toggleMenu);
    mobileOverlay?.addEventListener('click', toggleMenu);

    const cartBtns = document.querySelectorAll('.cart-btn');
    cartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(window.location.pathname.includes('cart') || window.location.pathname.includes('cart.html')) return;
            e.preventDefault(); 
            window.location.href = "/cart";
        });
    });

    document.getElementById('clearCartBtn')?.addEventListener('click', () => { cart = []; syncCartWithLocalDB(); });
}

// ========================================
// HERO SLIDER
// ========================================
function initializeHeroSlider() {
    const slides = document.querySelectorAll('#heroSlider .hero-slide');
    const dotsContainer = document.getElementById('sliderDots');
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    slides.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (idx === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(idx));
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.dot');
    function goToSlide(index) {
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');
        currentSlide = index;
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
        clearInterval(slideInterval);
        startSlideShow();
    }
    function startSlideShow() {
        slideInterval = setInterval(() => {
            const nextSlide = (currentSlide + 1) % slides.length;
            goToSlide(nextSlide);
        }, 5000);
    }
    startSlideShow();
}

// ========================================
// PRODUCTS PAGE LOGIC
// ========================================
async function initializeProductsPage() {
    await fetchProductsAndSyncCart(); // Await the fetch before populating filters

    const categorySelect = document.getElementById('categorySelect');
    if(categorySelect) {
        const uniqueCategories = [...new Set(PRODUCTS.map(p => p.category))];
        const dynOptions = uniqueCategories.filter(c => c !== 'Personalized').map(c => `<option value="${c}">${c}</option>`).join('');
        categorySelect.innerHTML = '<option value="all">All Categories</option>' + dynOptions;
    }

    document.getElementById('collectionSearch')?.addEventListener('input', applyFilters);
    categorySelect?.addEventListener('change', applyFilters);
    document.getElementById('sortSelect')?.addEventListener('change', applyFilters);
    
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('category');
    if (catParam && categorySelect) categorySelect.value = catParam;
    
    if(modalSlideCount > 1) {
        modalAutoSlideInterval = setInterval(() => moveModalSlider(1), 4000);
    }
}

window.moveModalSlider = (direction) => {
    slideToModalImage(currentModalSlide + direction);
}

window.editCustomOrder = (cartItemId) => {
    const item = cart.find(i => i.cartItemId === cartItemId);
    if(!item) return;

    editingCartItemId = cartItemId;
    currentModalProductId = item.productId;
    currentModalQty = item.quantity;
    currentUploadedPhotos = item.customPhotosBase64 ? [...item.customPhotosBase64] : [];
    
    document.getElementById('modalCategory').textContent = item.liveCategory;
    document.getElementById('modalTitle').textContent = item.liveName;

    document.getElementById('standardLeftArea').style.display = 'none';
    document.getElementById('standardDetailsArea').style.display = 'none';
    document.getElementById('standardCheckoutArea').style.display = 'none';
    
    document.getElementById('personalizedLeftArea').style.display = 'flex';
    document.getElementById('personalizedCheckoutArea').style.display = 'block';

    document.getElementById('customDetails').value = item.customDetailsText || '';
    document.getElementById('modalAddCustomToCartBtn').textContent = "Update Custom Order";
    syncModalQtyDisplay();
    renderModalUploadGallery();

    const modal = document.getElementById('productModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    clearInterval(modalAutoSlideInterval);
}

function updateModalQty(delta) {
    if(currentModalQty + delta > 0) {
        currentModalQty += delta;
        syncModalQtyDisplay();
    }
}

function syncModalQtyDisplay() {
    if(document.getElementById('modalQtyVal')) document.getElementById('modalQtyVal').textContent = currentModalQty;
    if(document.getElementById('modalCustomQtyVal')) document.getElementById('modalCustomQtyVal').textContent = currentModalQty;
}

// ========================================
// CART CRUD LOGIC 
// ========================================
window.addToCart = (productId, quantity = 1, customDetailsText = null, customPhotosBase64 = [], customCloudinaryUrls = []) => {
    // Generate a unique ID if it's a personalized item
    const isCustom = (customDetailsText || customPhotosBase64.length > 0 || customCloudinaryUrls.length > 0);
    const cartItemId = isCustom ? `${productId}-${Date.now()}` : productId;
    
    const existing = cart.find(item => item.cartItemId === cartItemId);
    
    if (existing && cartItemId === productId) {
        existing.quantity += quantity;
    } else {
        cart.push({ 
            productId, 
            cartItemId, 
            quantity, 
            customDetailsText, 
            customPhotosBase64,       // Kept as a local backup if needed
            customCloudinaryUrls      // Clean HTTP links for WhatsApp
        });
    }
    
    syncCartWithLocalDB();
    showNotification(`Item added to bag!`);
}


async function uploadPhotosToCloudinary(base64Array) {
    if (!base64Array || base64Array.length === 0) return [];

    const uploadPromises = base64Array.map(async (base64Data) => {
        // If it's already an HTTP link (e.g., during an edit), don't re-upload it
        if (base64Data.startsWith('http')) return base64Data;

        const formData = new FormData();
        formData.append('file', base64Data);
        // Replace with your actual Unsigned Upload Preset and Cloud Name from Cloudinary
        formData.append('upload_preset', 'YOUR_UNSIGNED_PRESET'); 

        try {
            const response = await fetch('https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            return data.secure_url; // Returns the "https://res.cloudinary.com/..." link
        } catch (error) {
            console.error("Cloudinary upload failed for an image:", error);
            return null;
        }
    });

    const results = await Promise.all(uploadPromises);
    return results.filter(url => url !== null); // Filter out any failed uploads
}


// Example event handler for your Modal Add/Update Button
document.getElementById('modalAddCustomToCartBtn').addEventListener('click', async function() {
    // 1. Show a loading state (highly recommended as upload takes 1-2 seconds)
    this.textContent = "Uploading images...";
    this.disabled = true;

    // 2. Gather data from your modal state
    const qty = currentModalQty;
    const detailsText = document.getElementById('customDetails').value;
    
    // 3. Upload base64 images to Cloudinary to get HTTP links
    const cloudinaryLinks = await uploadPhotosToCloudinary(currentUploadedPhotos);

    // 4. Send everything to your updated addToCart function
    window.addToCart(currentModalProductId, qty, detailsText, currentUploadedPhotos, cloudinaryLinks);

    // 5. Reset button and close modal
    this.textContent = "Add to Bag";
    this.disabled = false;
    closeProductModal(); 
});


window.updateCartItemQty = (cartItemId, delta) => {
    // Find by index so we can safely modify or remove it
    const index = cart.findIndex(i => i.cartItemId === cartItemId);
    
    if (index !== -1) {
        cart[index].quantity += delta;
        
        // If quantity drops to 0 or below, remove it entirely
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1); // Directly removes the item from the array
        }
        
        syncCartWithLocalDB(); // Save changes to localStorage
        updateCartUI();        // CRITICAL: Force the UI to refresh and hide the item!
    }
}


function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    document.querySelectorAll('.cart-badge').forEach(badge => {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    });
    document.querySelectorAll('.cartCountLabel').forEach(label => label.textContent = totalItems);

    const cartPageContainer = document.getElementById('cartPageContainer');

    if (cart.length === 0) {
        if(cartPageContainer) cartPageContainer.classList.add('is-empty');
        document.querySelectorAll('.cart-empty-state-wrapper').forEach(el => el.style.display = 'flex');
        document.querySelectorAll('.cart-items').forEach(el => el.innerHTML = '');
        document.querySelectorAll('.cart-summary-section').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.cart-controls').forEach(el => el.style.display = 'none');
    } else {
        if(cartPageContainer) cartPageContainer.classList.remove('is-empty');
        document.querySelectorAll('.cart-empty-state-wrapper').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.cart-summary-section').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.cart-controls').forEach(el => el.style.display = 'flex');
        renderCartItems();
    }
}

function renderCartItems() {
    const cartItemsContainers = document.querySelectorAll('.cart-items');
    if(cartItemsContainers.length === 0) return;

    const cartHTML = cart.map(item => {
        const hasPhotos = item.customPhotosBase64 && item.customPhotosBase64.length > 0;
        const isPersonalized = item.liveCategory === 'Personalized';
        
        return `
        <div class="cart-item">
            <div class="cart-item-image" ${isPersonalized ? `onclick="editCustomOrder('${item.cartItemId}')" style="cursor:pointer;" title="Edit Custom Order"` : ''}>
                <img src="${hasPhotos ? item.customPhotosBase64[0] : item.liveImage}" alt="${item.liveName}">
            </div>
            <div class="cart-item-content">
                <div class="cart-item-header">
                    <div>
                        <div class="cart-item-name heading-font">${item.liveName}</div>
                        <div class="cart-item-cat">${item.liveCategory}</div>
                    </div>
                    ${item.livePrice > 0 ? `<div class="cart-item-price">₹${(item.livePrice * item.quantity).toLocaleString()}</div>` : `<div class="cart-item-price">TBD</div>`}
                </div>
                
                ${isPersonalized ? `
                    <div class="cart-item-custom-info">
                        <p style="font-size: 0.85rem; color: var(--color-gray-700); margin-bottom: 6px;"><b>Notes:</b> ${item.customDetailsText || 'None'}</p>
                        ${!hasPhotos ? '<p style="font-size: 0.8rem; color: var(--color-pink-600); margin-bottom: 6px;">No photo uploaded.</p>' : `
                        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; cursor:pointer;" onclick="editCustomOrder('${item.cartItemId}')">
                            ${item.customPhotosBase64.map(src => `<img src="${src}" style="width: 32px; height: 32px; border-radius: 4px; object-fit: cover; border: 1px solid var(--color-pink-200);">`).join('')}
                        </div>
                        `}
                        <button onclick="editCustomOrder('${item.cartItemId}')" style="font-size: 0.8rem; font-weight: 600; color: var(--color-pink-600); text-decoration: underline; padding: 0; background: none; border: none; cursor: pointer;">Edit Personalization</button>
                    </div>
                ` : ''}

                <div class="cart-item-actions">
                    <div class="qty-selector">
                        <button class="qty-btn" onclick="updateCartItemQty('${item.cartItemId}', -1)">−</button>
                        <span class="qty-val">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateCartItemQty('${item.cartItemId}', 1)">+</button>
                    </div>
                    <button class="cart-item-remove" onclick="updateCartItemQty('${item.cartItemId}', -999)">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');

    cartItemsContainers.forEach(container => container.innerHTML = cartHTML);

    const subtotal = cart.reduce((sum, item) => sum + (item.livePrice * item.quantity), 0);
    document.querySelectorAll('.cartSubtotal').forEach(el => el.textContent = `₹${subtotal.toLocaleString()}`);
    document.querySelectorAll('.cartTotal').forEach(el => el.textContent = `₹${subtotal.toLocaleString()}`);
}

function showNotification(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        background-color: var(--color-pink-600); color: white; padding: 12px 24px;
        border-radius: 50px; font-size: 14px; z-index: 2000;
        box-shadow: 0 4px 12px rgba(219, 39, 119, 0.3); animation: slideInUp 0.3s ease-out;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOutDown 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// ========================================
// CHECKOUT & WHATSAPP LOGIC
// ========================================
window.openCheckoutForm = function() {
    const checkoutModal = document.getElementById('checkoutModal');
    if(checkoutModal) {
        checkoutModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
};

window.closeCheckoutForm = function() {
    const checkoutModal = document.getElementById('checkoutModal');
    if(checkoutModal) {
        checkoutModal.style.display = 'none';
        document.body.style.overflow = '';
    }
};

const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', function(e) {
        e.preventDefault(); 

        const name = document.getElementById('customerName').value;
        const phone = document.getElementById('customerPhone').value;
        const address = document.getElementById('customerAddress').value;
        const pincode = document.getElementById('customerPincode').value;
        const state = document.getElementById('customerState').value;
        const country = document.getElementById('customerCountry').value;

        let textMessage = `*NEW ORDER - HAPPIEE KNOTS*\n\n`;
        textMessage += `*📦 Customer Details:*\n`;
        textMessage += `• Name: ${name}\n`;
        textMessage += `• Phone: ${phone}\n`;
        textMessage += `• Address: ${address}, ${state} - ${pincode}, ${country}\n\n`;
        textMessage += `*🛍️ Items Ordered:*\n`;

        let grandTotal = 0;
        
        cart.forEach((item, index) => {
            const itemTotal = item.livePrice * item.quantity;
            grandTotal += itemTotal;
            textMessage += `${index + 1}. ${item.liveName} (x${item.quantity}) - ₹${itemTotal.toLocaleString('en-IN')}\n`;
            
            // Check if it's a personalized product with custom details
            if (item.customDetailsText) {
                textMessage += `   _Customization: ${item.customDetailsText}_\n`;
            }

            // CRITICAL ADDITION: Only append image if it is a custom item and has a Cloudinary image link
            if (item.customCloudinaryUrl) {
                textMessage += `   📸 Reference Image: ${item.customCloudinaryUrl}\n`;
            } else if (item.customPhotosBase64 && item.customPhotosBase64.length > 0 && !item.customCloudinaryUrl) {
                // Fallback warning if you forgot to upload it to cloud storage first
                textMessage += `   📸 Reference Image: [Image uploaded in form]\n`;
            }
        });

        textMessage += `\n*💵 Grand Total: ₹${grandTotal.toLocaleString('en-IN')}*`;

        const encodedMessage = encodeURIComponent(textMessage);
        
        // Target WhatsApp Number
        const whatsAppLink = `https://wa.me/919025681308?text=${encodedMessage}`;

        // Clear cart
        cart = [];
        localStorage.setItem('happiee_cart', JSON.stringify(cart));
        
        closeCheckoutForm();
        window.open(whatsAppLink, '_blank');
        
        if (typeof renderCartItems === 'function') updateCartUI();
    });
}


// ========================================================
//      ONE UNIFIED NAVBAR SESSION INITIALIZATION
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
    syncNavbarSessionState();
});

async function syncNavbarSessionState() {
    try {
        const response = await fetch('/api/auth/me', { method: 'GET' });
        const data = await response.json();

        const authHeaderContainer = document.getElementById('authHeaderContainer');
        const mobileAuthContainer = document.getElementById('mobileAuthContainer');

        if (data.success && data.user) {
            // 1. Calculate the user's name initials dynamically (e.g., "Naveen Kumar" -> "NK")
            const initials = data.user.name
                .split(' ')
                .map(part => part[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

            // 2. Desktop Navigation Update: Changes LOGIN/SIGNUP to LOG OUT + Profile Circle
            if (authHeaderContainer) {
                authHeaderContainer.innerHTML = `
                    <a href="/api/auth/logout" class="nav-link hide-mobile" style="color: var(--color-gray-600); font-weight: 600; margin-right: 12px; display: inline-block;">LOG OUT</a>
                    <a href="/profile" class="user-profile-badge" style="display: inline-flex;" title="View Profile">
                        ${initials}
                    </a>
                `;
            }

            // 3. FIXED: Mobile View Menu Update (Removes Login/Signup and injects personalized state)
            if (mobileAuthContainer) {
                mobileAuthContainer.innerHTML = `
                    <div style="padding: 1rem 0; border-top: 1px solid var(--color-pink-100); margin-top: 10px; width: 100%; text-align: center;">
                        <span class="mobile-nav-link" style="color: var(--color-black); font-size: 1.1rem; display: block; margin-bottom: 0.5rem; text-transform: none; font-family: 'Outfit', sans-serif;">
                            Hello, ${data.user.name.split(' ')[0]}
                        </span>
                        <a href="/api/auth/logout" class="mobile-nav-link" style="color: var(--color-pink-600); font-size: 1.1rem; font-weight: 700;">
                            LOGOUT
                        </a>
                    </div>
                `;
            }
        }
    } catch (err) {
        console.error("Navbar structural authorization state synchronization drop:", err);
    }
}
