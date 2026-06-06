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
    
    applyFilters();
}

function applyFilters() {
    const searchTerm = document.getElementById('collectionSearch')?.value.toLowerCase() || '';
    const category = document.getElementById('categorySelect')?.value || 'all';
    const sort = document.getElementById('sortSelect')?.value || 'newest';

    let filtered = PRODUCTS.filter(p => {
        if(p.category === 'Personalized') return false; 
        const matchesSearch = p.name.toLowerCase().includes(searchTerm);
        const matchesCategory = category === 'all' || p.category === category;
        return matchesSearch && matchesCategory;
    });

    if (sort === 'price-low') filtered.sort((a, b) => a.price - b.price);
    else if (sort === 'price-high') filtered.sort((a, b) => b.price - a.price);

    renderProducts(filtered);
}

function renderProducts(products) {
    const countEl = document.getElementById('productCount');
    if(countEl) countEl.textContent = products.length;
    
    const productsGrid = document.getElementById('productsGrid');
    if(!productsGrid) return;
    
    productsGrid.innerHTML = products.map(product => {
        const displayImg = product.images?.[0] || product.image;
        return `
        <div class="product-card" onclick="openProductModal('${product.id}')">
            <div class="product-image">
                <img src="${displayImg}" alt="${product.name}">
            </div>
            <div class="product-info">
                <div>
                    <div class="product-title-row">
                        <h3 class="product-name heading-font">${product.name}</h3>
                        <span class="product-price">₹${product.price.toLocaleString()}</span>
                    </div>
                    <p class="product-category">${product.category}</p>
                </div>
                <button class="product-add-btn" onclick="event.stopPropagation(); addToCart('${product.id}', 1)">Add</button>
            </div>
        </div>
    `}).join('');
}

// ========================================
// DYNAMIC MODAL GENERATION & BINDING
// ========================================
function ensureModalMarkup() {
    if (!document.getElementById('productModal')) {
        const modalHTML = `
        <div class="modal-overlay" id="productModal" style="display:none">
            <div class="modal-content">
                <button class="close-modal-btn" id="closeModalBtn">&times;</button>
                <div class="modal-grid">
                    
                    <div id="standardLeftArea">
                        <div class="modal-main-img-wrapper">
                            <button class="modal-slider-arrow prev" onclick="moveModalSlider(-1)">&#10094;</button>
                            <div class="modal-slider-track" id="modalSliderTrack"></div>
                            <button class="modal-slider-arrow next" onclick="moveModalSlider(1)">&#10095;</button>
                        </div>
                        <div class="modal-thumbnails" id="modalThumbnails"></div>
                    </div>

                    <div class="modal-upload-container" id="personalizedLeftArea" style="display:none;">
                        <label class="upload-box">
                            <input type="file" id="customPhotos" accept="image/*" multiple class="custom-file-input-hidden">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-pink-500)" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            <p class="upload-title heading-font">Upload Reference Photo(s)</p>
                            <p class="upload-subtitle text-muted">Click or drop multiple images here to add to gallery.</p>
                        </label>
                        <div id="uploadFileGallery"></div>
                    </div>

                    <div class="modal-info">
                        <p class="modal-category" id="modalCategory"></p>
                        <h2 class="modal-title heading-font" id="modalTitle"></h2>
                        <div id="standardDetailsArea">
                            <p class="modal-price" id="modalPrice"></p>
                            <div class="modal-desc" id="modalDesc"></div>
                        </div>
                        <div id="standardCheckoutArea">
                            <div class="modal-qty-container">
                                <span class="modal-qty-label">Quantity:</span>
                                <div class="qty-selector" style="background: white;">
                                    <button class="qty-btn" id="modalQtyMinus">−</button>
                                    <span class="qty-val" id="modalQtyVal">1</span>
                                    <button class="qty-btn" id="modalQtyPlus">+</button>
                                </div>
                            </div>
                            <button class="btn btn-primary" id="modalAddToCartBtn" style="width: 100%; border-radius: 8px;">Add to Bag</button>
                        </div>
                        <div id="personalizedCheckoutArea" style="display:none;">
                            <label class="custom-label">Customization Details</label>
                            <textarea id="customDetails" rows="6" class="custom-textarea" placeholder="Enter custom names, dates, colors, specific themes or requests..."></textarea>
                            <div class="modal-qty-container" style="margin-bottom: 1.5rem;">
                                <span class="modal-qty-label">Quantity:</span>
                                <div class="qty-selector" style="background: white;">
                                    <button class="qty-btn" id="modalCustomQtyMinus">−</button>
                                    <span class="qty-val" id="modalCustomQtyVal">1</span>
                                    <button class="qty-btn" id="modalCustomQtyPlus">+</button>
                                </div>
                            </div>
                            <button class="btn btn-primary" id="modalAddCustomToCartBtn" style="width: 100%; border-radius: 8px;">Add Custom Order to Bag</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    bindModalEvents();
}

function bindModalEvents() {
    document.getElementById('closeModalBtn').addEventListener('click', closeProductModal);
    document.getElementById('productModal').addEventListener('click', (e) => {
        if(e.target === document.getElementById('productModal')) closeProductModal();
    });
    
    document.getElementById('modalQtyMinus').addEventListener('click', () => updateModalQty(-1));
    document.getElementById('modalQtyPlus').addEventListener('click', () => updateModalQty(1));
    document.getElementById('modalAddToCartBtn').addEventListener('click', () => {
        addToCart(currentModalProductId, currentModalQty);
        closeProductModal();
    });

    document.getElementById('modalCustomQtyMinus').addEventListener('click', () => updateModalQty(-1));
    document.getElementById('modalCustomQtyPlus').addEventListener('click', () => updateModalQty(1));
    
    const photoUploadInput = document.getElementById('customPhotos');
    if (photoUploadInput) {
        photoUploadInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                const photoPromises = Array.from(this.files).map(file => {
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.readAsDataURL(file);
                    });
                });
                Promise.all(photoPromises).then(base64Photos => {
                    currentUploadedPhotos = currentUploadedPhotos.concat(base64Photos);
                    renderModalUploadGallery();
                });
            }
        });
    }

    document.getElementById('modalAddCustomToCartBtn').addEventListener('click', () => {
        const customDetails = document.getElementById('customDetails').value;
        if(!customDetails.trim() && currentUploadedPhotos.length === 0) {
            alert("Please provide customization details or upload a photo before adding to bag.");
            return;
        }

        if(editingCartItemId) {
            const item = cart.find(i => i.cartItemId === editingCartItemId);
            if(item) {
                item.quantity = currentModalQty;
                item.customDetailsText = customDetails;
                item.customPhotosBase64 = currentUploadedPhotos;
            }
            syncCartWithLocalDB();
            closeProductModal();
            showNotification(`Cart Updated!`);
        } else {
            addToCart(currentModalProductId, currentModalQty, customDetails, currentUploadedPhotos);
            closeProductModal();
        }
    });
}

function renderModalUploadGallery() {
    const galleryContainer = document.getElementById('uploadFileGallery');
    galleryContainer.innerHTML = ''; 
    currentUploadedPhotos.forEach((src, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'thumbnail-wrapper';
        wrapper.innerHTML = `
            <img src="${src}">
            <button class="remove-thumb-btn" onclick="removeModalPhoto(${index})">&times;</button>
        `;
        galleryContainer.appendChild(wrapper);
    });
}

window.removeModalPhoto = (index) => {
    currentUploadedPhotos.splice(index, 1);
    renderModalUploadGallery();
}

window.openProductModal = (id) => {
    const product = PRODUCTS.find(p => p.id === id || p._id === id);
    if(!product) return;

    currentModalProductId = product.id;
    currentModalQty = 1;
    editingCartItemId = null; 
    currentUploadedPhotos = []; 

    // Build Native Slider for Modal
    const imagesArray = product.images && product.images.length > 0 ? product.images : [product.image];
    modalSlideCount = imagesArray.length;
    currentModalSlide = 0;

    const track = document.getElementById('modalSliderTrack');
    track.innerHTML = imagesArray.map(img => `<img src="${img}">`).join('');
    track.style.transform = `translateX(0%)`;

    const thumbnailsContainer = document.getElementById('modalThumbnails');
    thumbnailsContainer.innerHTML = imagesArray.map((img, idx) => `
        <img src="${img}" class="modal-thumb ${idx === 0 ? 'active' : ''}" onclick="slideToModalImage(${idx})">
    `).join('');

    // Toggle Arrows
    document.querySelectorAll('.modal-slider-arrow').forEach(el => {
        el.style.display = modalSlideCount > 1 ? 'flex' : 'none';
    });

    // Auto-slide setup
    clearInterval(modalAutoSlideInterval);
    if(modalSlideCount > 1) {
        modalAutoSlideInterval = setInterval(() => moveModalSlider(1), 4000);
    }

    document.getElementById('modalCategory').textContent = product.category;
    document.getElementById('modalTitle').textContent = product.name;
    document.getElementById('modalPrice').textContent = product.price > 0 ? `₹${product.price.toLocaleString()}` : 'Custom Pricing';
    document.getElementById('modalDesc').textContent = product.description;
    syncModalQtyDisplay();

    if (product.category === 'Personalized') {
        document.getElementById('standardLeftArea').style.display = 'none';
        document.getElementById('standardDetailsArea').style.display = 'none';
        document.getElementById('standardCheckoutArea').style.display = 'none';
        
        document.getElementById('personalizedLeftArea').style.display = 'flex';
        document.getElementById('personalizedCheckoutArea').style.display = 'block';
        
        document.getElementById('customDetails').value = '';
        document.getElementById('uploadFileGallery').innerHTML = '';
        document.getElementById('modalAddCustomToCartBtn').textContent = "Add Custom Order to Bag";
    } else {
        document.getElementById('standardLeftArea').style.display = 'flex';
        document.getElementById('standardDetailsArea').style.display = 'block';
        document.getElementById('standardCheckoutArea').style.display = 'block';
        
        document.getElementById('personalizedLeftArea').style.display = 'none';
        document.getElementById('personalizedCheckoutArea').style.display = 'none';
    }

    const modal = document.getElementById('productModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.slideToModalImage = (index) => {
    currentModalSlide = index;
    if (currentModalSlide < 0) currentModalSlide = modalSlideCount - 1;
    if (currentModalSlide >= modalSlideCount) currentModalSlide = 0;
    
    document.getElementById('modalSliderTrack').style.transform = `translateX(-${currentModalSlide * 100}%)`;
    
    const thumbs = document.querySelectorAll('.modal-thumb');
    thumbs.forEach(t => t.classList.remove('active'));
    if(thumbs[currentModalSlide]) thumbs[currentModalSlide].classList.add('active');

    clearInterval(modalAutoSlideInterval);
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
window.addToCart = (productId, quantity = 1, customDetailsText = null, customPhotosBase64 = []) => {
    const cartItemId = (customDetailsText || customPhotosBase64.length > 0) ? `${productId}-${Date.now()}` : productId;
    const existing = cart.find(item => item.cartItemId === cartItemId);
    
    if (existing && cartItemId === productId) {
        existing.quantity += quantity;
    } else {
        cart.push({ productId, cartItemId, quantity, customDetailsText, customPhotosBase64 });
    }
    
    syncCartWithLocalDB();
    showNotification(`Item added to bag!`);
}

window.updateCartItemQty = (cartItemId, delta) => {
    const item = cart.find(i => i.cartItemId === cartItemId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) cart = cart.filter(i => i.cartItemId !== cartItemId);
        syncCartWithLocalDB();
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
            if (item.customDetailsText) {
                textMessage += `   _Customization: ${item.customDetailsText}_\n`;
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
