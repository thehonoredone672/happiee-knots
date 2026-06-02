// ========================================
// SHARED SCRIPT FOR BOTH PAGES
// ========================================

const PRODUCTS = [
    {
        id: '1',
        name: 'Ruby Luxe Handbag',
        category: 'Handbags',
        price: 2499,
        image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=600&auto=format&fit=crop',
        description: 'A beautifully structured handcrafted handbag featuring rich crimson tones and premium gold-finish hardware.'
    },
    {
        id: '2',
        name: 'Sunwoven Citrus Tote',
        category: 'Handbags',
        price: 1699,
        image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=600&auto=format&fit=crop',
        description: 'A vibrant handwoven tote that blends sunny cream and citrus-orange tones for a fresh, standout look.'
    },
    {
        id: '3',
        name: 'Wedding Keepsake Set',
        category: 'Wedding',
        price: 3999,
        image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=600&auto=format&fit=crop',
        description: 'Elegant keepsake set crafted specially for your special day. Custom initials engraved.'
    },
    {
        id: '4',
        name: 'Deluxe Hamper',
        category: 'Hampers',
        price: 3499,
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=500&auto=format&fit=crop',
        description: 'A beautifully curated gift hamper with handpicked artisan items wrapped in sustainable packaging.'
    },
    {
        id: '5',
        name: 'Festive Collection',
        category: 'Festive',
        price: 1899,
        image: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?q=80&w=600&auto=format&fit=crop',
        description: 'Celebrate with our festive gift selections featuring sweets, diyas, and handcrafted decor.'
    },
    {
        id: '6',
        name: 'Custom Order Base',
        category: 'Personalized',
        price: 0, 
        image: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?q=80&w=500&auto=format&fit=crop',
        description: 'Unique custom orders tailored directly to your vision.'
    }
];

let cart = JSON.parse(localStorage.getItem('happiee_cart')) || [];
let slideInterval;

let currentModalProductId = null;
let currentModalQty = 1;
let editingCartItemId = null; 

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu
    const menuToggles = document.querySelectorAll('.menu-toggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');

    const toggleMenu = () => {
        if(mobileMenu) mobileMenu.classList.toggle('open');
        if(mobileOverlay) mobileOverlay.classList.toggle('open');
    };

    menuToggles.forEach(btn => btn.addEventListener('click', toggleMenu));
    const menuCloseBtn = document.getElementById('mobileMenuClose');
    if(menuCloseBtn) menuCloseBtn.addEventListener('click', toggleMenu);
    if(mobileOverlay) mobileOverlay.addEventListener('click', toggleMenu);

    const clearCartBtn = document.getElementById('clearCartBtn');
    if(clearCartBtn) clearCartBtn.addEventListener('click', () => { cart = []; saveAndUpdateCart(); });

    updateCartUI();
    ensureModalMarkup();

    const isHomePage = document.getElementById('heroSlider');
    const isProductsPage = document.getElementById('productsGrid');

    if (isHomePage) initializeHeroSlider();
    if (isProductsPage) initializeProductsPage();
});

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
function initializeProductsPage() {
    const collectionSearch = document.getElementById('collectionSearch');
    const categorySelect = document.getElementById('categorySelect');
    const sortSelect = document.getElementById('sortSelect');
    
    if(collectionSearch) collectionSearch.addEventListener('input', applyFilters);
    if(categorySelect) categorySelect.addEventListener('change', applyFilters);
    if(sortSelect) sortSelect.addEventListener('change', applyFilters);
    
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('category');
    if (catParam && categorySelect) categorySelect.value = catParam;
    
    applyFilters();
}

function applyFilters() {
    const collectionSearch = document.getElementById('collectionSearch');
    const categorySelect = document.getElementById('categorySelect');
    const sortSelect = document.getElementById('sortSelect');
    if(!collectionSearch) return;

    const searchTerm = collectionSearch.value.toLowerCase();
    const category = categorySelect.value;
    const sort = sortSelect.value;

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
    
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card" onclick="openProductModal('${product.id}')">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div class="product-title-row">
                        <h3 class="product-name heading-font">${product.name}</h3>
                        <span class="product-price">₹${product.price.toLocaleString()}</span>
                    </div>
                    <p class="product-category">${product.category}</p>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
                    <button class="product-add-btn" onclick="event.stopPropagation(); addToCart('${product.id}', 1)">Add to Bag</button>
                    <button class="product-add-btn" style="background: var(--color-gray-900, #111); color: white; border: none;" onclick="event.stopPropagation(); addToCart('${product.id}', 1); window.location.href='/cart';">Buy Now</button>
                </div>
            </div>
        </div>
    `).join('');
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
                    <div class="modal-image-container" id="standardLeftArea">
                        <img src="" id="modalImg" alt="Product">
                    </div>
                    <div class="modal-upload-container" id="personalizedLeftArea" style="display:none;">
                        <label class="upload-box">
                            <input type="file" id="customPhotos" accept="image/*" multiple class="custom-file-input-hidden">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-pink-500)" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            <p class="upload-title heading-font">Upload Reference Photo(s)</p>
                            <p class="upload-subtitle text-muted">Click or drop multiple images here</p>
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
    
    // Standard Bindings
    document.getElementById('modalQtyMinus').addEventListener('click', () => updateModalQty(-1));
    document.getElementById('modalQtyPlus').addEventListener('click', () => updateModalQty(1));
    document.getElementById('modalAddToCartBtn').addEventListener('click', () => {
        addToCart(currentModalProductId, currentModalQty);
        closeProductModal();
    });

    // Custom Bindings
    document.getElementById('modalCustomQtyMinus').addEventListener('click', () => updateModalQty(-1));
    document.getElementById('modalCustomQtyPlus').addEventListener('click', () => updateModalQty(1));
    
    const photoUploadInput = document.getElementById('customPhotos');
    if (photoUploadInput) {
        photoUploadInput.addEventListener('change', function() {
            const galleryContainer = document.getElementById('uploadFileGallery');
            galleryContainer.innerHTML = ''; 
            
            if (this.files && this.files.length > 0) {
                Array.from(this.files).forEach(file => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        galleryContainer.appendChild(img);
                    }
                    reader.readAsDataURL(file);
                });
            }
        });
    }

    document.getElementById('modalAddCustomToCartBtn').addEventListener('click', () => {
        const customDetails = document.getElementById('customDetails').value;
        const files = document.getElementById('customPhotos').files;
        
        const photoPromises = Array.from(files).map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        });

        Promise.all(photoPromises).then(base64Photos => {
            let finalPhotos = base64Photos;
            
            if(editingCartItemId && files.length === 0) {
                const existingItem = cart.find(i => i.cartItemId === editingCartItemId);
                if(existingItem && existingItem.customPhotosBase64) {
                    finalPhotos = existingItem.customPhotosBase64;
                }
            }

            if(!customDetails.trim() && finalPhotos.length === 0) {
                alert("Please provide customization details or upload a photo before adding to bag.");
                return;
            }

            if(editingCartItemId) {
                const item = cart.find(i => i.cartItemId === editingCartItemId);
                if(item) {
                    item.quantity = currentModalQty;
                    item.customDetailsText = customDetails;
                    item.customPhotosBase64 = finalPhotos;
                }
                saveAndUpdateCart();
                closeProductModal();
                showNotification(`Cart Updated!`);
            } else {
                addToCart(currentModalProductId, currentModalQty, customDetails, finalPhotos);
                closeProductModal();
            }
        });
    });
}

window.openProductModal = (id) => {
    const product = PRODUCTS.find(p => p.id === id);
    if(!product) return;

    currentModalProductId = product.id;
    currentModalQty = 1;
    editingCartItemId = null; 

    document.getElementById('modalImg').src = product.image;
    document.getElementById('modalCategory').textContent = product.category;
    document.getElementById('modalTitle').textContent = product.name;
    document.getElementById('modalPrice').textContent = `₹${product.price.toLocaleString()}`;
    document.getElementById('modalDesc').textContent = product.description;
    
    syncModalQtyDisplay();

    if (product.category === 'Personalized') {
        document.getElementById('standardLeftArea').style.display = 'none';
        document.getElementById('standardDetailsArea').style.display = 'none';
        document.getElementById('standardCheckoutArea').style.display = 'none';
        
        document.getElementById('personalizedLeftArea').style.display = 'flex';
        document.getElementById('personalizedCheckoutArea').style.display = 'block';
        
        document.getElementById('customDetails').value = '';
        document.getElementById('customPhotos').value = '';
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

window.editCustomOrder = (cartItemId) => {
    const item = cart.find(i => i.cartItemId === cartItemId);
    if(!item) return;

    editingCartItemId = cartItemId;
    currentModalProductId = item.id;
    currentModalQty = item.quantity;
    
    document.getElementById('modalCategory').textContent = item.category;
    document.getElementById('modalTitle').textContent = item.name;

    document.getElementById('standardLeftArea').style.display = 'none';
    document.getElementById('standardDetailsArea').style.display = 'none';
    document.getElementById('standardCheckoutArea').style.display = 'none';
    
    document.getElementById('personalizedLeftArea').style.display = 'flex';
    document.getElementById('personalizedCheckoutArea').style.display = 'block';

    document.getElementById('customDetails').value = item.customDetailsText || '';
    document.getElementById('modalAddCustomToCartBtn').textContent = "Update Custom Order";
    syncModalQtyDisplay();

    const previewContainer = document.getElementById('uploadFileGallery');
    previewContainer.innerHTML = '';
    if(item.customPhotosBase64 && item.customPhotosBase64.length > 0) {
        item.customPhotosBase64.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            previewContainer.appendChild(img);
        });
    }

    const modal = document.getElementById('productModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    document.body.style.overflow = 'auto';
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
// CART LOGIC
// ========================================

window.addToCart = (id, quantity = 1, customDetailsText = null, customPhotosBase64 = []) => {
    const product = PRODUCTS.find(p => p.id === id);
    const cartItemId = (customDetailsText || customPhotosBase64.length > 0) ? `${id}-${Date.now()}` : id;
    
    const existing = cart.find(item => item.cartItemId === cartItemId);
    
    if (existing && cartItemId === id) {
        existing.quantity += quantity;
    } else {
        cart.push({ ...product, cartItemId, quantity, customDetailsText, customPhotosBase64 });
    }
    
    saveAndUpdateCart();
    showNotification(`${product.name} added to bag!`);
}

window.updateCartItemQty = (cartItemId, delta) => {
    const item = cart.find(i => i.cartItemId === cartItemId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) cart = cart.filter(i => i.cartItemId !== cartItemId);
        saveAndUpdateCart();
    }
}

function saveAndUpdateCart() {
    localStorage.setItem('happiee_cart', JSON.stringify(cart));
    updateCartUI();
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
        document.querySelectorAll('.cart-empty-state').forEach(el => el.style.display = 'flex');
        document.querySelectorAll('.cart-items').forEach(el => el.innerHTML = '');
        document.querySelectorAll('.cart-summary-section').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.cart-controls').forEach(el => el.style.display = 'none');
    } else {
        if(cartPageContainer) cartPageContainer.classList.remove('is-empty');
        document.querySelectorAll('.cart-empty-state').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.cart-summary-section').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.cart-controls').forEach(el => el.style.display = 'flex');
        renderCartItems();
    }
}

function renderCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    if(!cartItemsContainer) return;

    cartItemsContainer.innerHTML = cart.map(item => {
        const hasPhotos = item.customPhotosBase64 && item.customPhotosBase64.length > 0;
        const imgSrc = hasPhotos ? item.customPhotosBase64[0] : item.image;
        const isPersonalized = item.category === 'Personalized';
        
        return `
        <div class="cart-item">
            <div class="cart-item-image" ${isPersonalized ? `onclick="editCustomOrder('${item.cartItemId}')" style="cursor:pointer;" title="Edit Custom Order"` : ''}>
                <img src="${imgSrc}" alt="${item.name}">
            </div>
            <div class="cart-item-content">
                <div class="cart-item-header">
                    <div>
                        <div class="cart-item-name heading-font">${item.name}</div>
                        <div class="cart-item-cat">${item.category}</div>
                        ${isPersonalized ? `
                            <div class="cart-item-custom-info">
                                <p style="font-size: 0.85rem; color: var(--color-gray-700); margin-bottom: 4px;"><b>Notes:</b> ${item.customDetailsText || 'None'}</p>
                                ${!hasPhotos ? '<p style="font-size: 0.8rem; color: var(--color-pink-600); margin-bottom: 6px;">No photo uploaded</p>' : `
                                <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; cursor:pointer;" onclick="editCustomOrder('${item.cartItemId}')">
                                    ${item.customPhotosBase64.map(src => `<img src="${src}" style="width: 32px; height: 32px; border-radius: 4px; object-fit: cover; border: 1px solid var(--color-pink-200);">`).join('')}
                                </div>
                                `}
                                <button onclick="editCustomOrder('${item.cartItemId}')" style="font-size: 0.8rem; font-weight: 600; color: var(--color-pink-600); text-decoration: underline; padding: 0; background: none; border: none; cursor: pointer;">Edit Personalization</button>
                            </div>
                        ` : ''}
                    </div>
                    ${item.price > 0 ? `<div class="cart-item-price">₹${(item.price * item.quantity).toLocaleString()}</div>` : `<div class="cart-item-price">TBD</div>`}
                </div>
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

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
