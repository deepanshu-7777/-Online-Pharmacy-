// Declare variables at the top to avoid reference errors
let currentUser = null;
let cart = []; // Always start as array
let token = localStorage.getItem('token');

// Smooth scrolling for navigation (fixed invalid selector issue)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = this.getAttribute('href');
        if (target && target !== '#') { // Ensure valid selector
            const element = document.querySelector(target);
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Load products by category
async function loadProducts(category = 'all') {
    try {
        const response = await fetch(`/api/products/${category}`);
        const products = await response.json();
        const productList = document.getElementById('product-list');
        productList.innerHTML = ''; // Clear previous products
        products.forEach(product => {
            const col = document.createElement('div');
            col.className = 'col-md-4';
            col.innerHTML = `
                <div class="card">
                    <img src="${product.image}" class="card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">${product.description}</p>
                        <p>$${product.price}</p>
                        <button class="btn btn-secondary me-2" onclick="viewDetails('${product._id}')">View Details</button>
                        <button class="btn btn-primary add-to-cart" data-id="${product._id}">Add to Cart</button>
                    </div>
                </div>
            `;
            productList.appendChild(col);
        });
    } catch (err) {
        console.error('Error loading products:', err);
    }
}

// Event listeners for category buttons
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        loadProducts(this.dataset.category);
    });
});

// View product details
function viewDetails(id) {
    window.location.href = `product.html?id=${id}`;
}

// Load product details on product.html
if (window.location.pathname.includes('product.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (productId) {
        fetch(`/api/products/id/${productId}`)
            .then(response => response.json())
            .then(data => {
                const { product, related } = data;
                const details = document.getElementById('product-details');
                details.innerHTML = `
                    <div class="col-md-6">
                        <img src="${product.image}" class="img-fluid" alt="${product.name}">
                    </div>
                    <div class="col-md-6">
                        <h2>${product.name}</h2>
                        <p><strong>Category:</strong> ${product.category}</p>
                        <p><strong>Description:</strong> ${product.description}</p>
                        <p><strong>Price:</strong> $${product.price}</p>
                        <button class="btn btn-primary add-to-cart" data-id="${product._id}">Add to Cart</button>
                    </div>
                `;
                
                // Load related products
                const relatedContainer = document.getElementById('related-products');
                if (related.length > 0) {
                    related.forEach(rel => {
                        const col = document.createElement('div');
                        col.className = 'col-md-3 mb-3';
                        col.innerHTML = `
                            <div class="card">
                                <img src="${rel.image}" class="card-img-top" alt="${rel.name}">
                                <div class="card-body">
                                    <h6 class="card-title">${rel.name}</h6>
                                    <p class="card-text">$${rel.price}</p>
                                    <button class="btn btn-secondary btn-sm" onclick="viewDetails('${rel._id}')">View Details</button>
                                    <button class="btn btn-primary btn-sm add-to-cart" data-id="${rel._id}">Add to Cart</button>
                                </div>
                            </div>
                        `;
                        relatedContainer.appendChild(col);
                    });
                } else {
                    relatedContainer.innerHTML = '<p>No related products found.</p>';
                }
            })
            .catch(err => console.error('Error loading product:', err));
    }
}

// Auth functions
function updateAuthUI() {
    if (currentUser) {
        document.getElementById('auth-btn').classList.add('d-none');
        document.getElementById('logout-btn').classList.remove('d-none');
    } else {
        document.getElementById('auth-btn').classList.remove('d-none');
        document.getElementById('logout-btn').classList.add('d-none');
    }
}

// Check token on page load
window.addEventListener('DOMContentLoaded', function() {
    token = localStorage.getItem('token');
    
    if (token) {
        // Verify token on load
        fetch('/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (res.ok) {
                return res.json();
            } else {
                throw new Error('Invalid token');
            }
        })
        .then(user => {
            currentUser = user;
            updateAuthUI();
            loadCart();
        })
        .catch(() => {
            localStorage.removeItem('token');
            token = null;
            updateAuthUI();
        });
    } else {
        updateAuthUI();
    }
});

document.getElementById('auth-btn').addEventListener('click', () => {
    new bootstrap.Modal(document.getElementById('authModal')).show();
});

// Login form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
        localStorage.setItem('token', data.token);
        token = data.token;
        currentUser = data.user;
        updateAuthUI();
        await loadCart();
        bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
        alert('Logged in successfully!');
    } else {
        alert(data.error);
    }
});

// Signup form
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (res.ok) {
        alert('Signed up successfully! Please login.');
        document.getElementById('login-tab').click();
    } else {
        alert(data.error);
    }
});

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    cart = []; // Clear cart on logout
    updateCartCount();
    updateAuthUI();
    location.reload(); // Refresh to reset UI
}

// Load cart from DB if logged in
async function loadCart() {
    if (currentUser && token) {
        console.log('Loading cart for user');
        try {
            const res = await fetch('/api/cart', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                cart = Array.isArray(data) ? data : [];
                console.log('Cart loaded:', cart);
                updateCartCount();
            } else {
                console.error('Failed to load cart:', res.status, res.statusText);
                cart = [];
            }
        } catch (err) {
            console.error('Error loading cart:', err);
            cart = [];
        }
    }
}

// Add to cart (with persistence and notification)
async function addToCart(productId) {
    if (!Array.isArray(cart)) cart = [];
    const existingItem = cart.find(item => item.productId._id === productId || item.productId === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        const product = { productId, quantity: 1 };
        cart.push(product);
    }
    updateCartCount();
    showNotification('Item added to cart!');
    if (currentUser) {
        token = localStorage.getItem('token');
        console.log('Saving cart for user');
        try {
            const res = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ productId, quantity: 1 })
            });
            if (!res.ok) {
                console.error('Failed to save cart:', res.status, res.statusText);
            } else {
                console.log('Cart saved successfully');
            }
        } catch (err) {
            console.error('Error saving to cart:', err);
        }
    }
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'alert alert-success position-fixed';
    notification.style.top = '10px';
    notification.style.right = '10px';
    notification.style.zIndex = '1050';
    notification.innerHTML = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000); // Remove after 3 seconds
}

// Update cart count
function updateCartCount() {
    if (!Array.isArray(cart)) cart = [];
    document.getElementById('cart-count').textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

// View cart modal with editing
document.getElementById('cart-link').addEventListener('click', async () => {
    const cartItems = document.getElementById('cart-items');
    if (!Array.isArray(cart) || cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty.</p>';
    } else {
        let html = '<ul class="list-group">';
        let total = 0;
        for (const item of cart) {
            let product = item.productId;
            if (typeof product === 'string') {
                try {
                    const res = await fetch(`/api/products/id/${product}`);
                    const data = await res.json();
                    product = data.product;
                } catch (err) {
                    console.error('Error fetching product:', err);
                    continue;
                }
            }
            const itemTotal = product.price * item.quantity;
            total += itemTotal;
            html += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${product.name}</strong><br>
                        $${product.price} x ${item.quantity} = $${itemTotal.toFixed(2)}
                    </div>
                    <div>
                        <button class="btn btn-sm btn-secondary me-1" onclick="changeQuantity('${product._id}', ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button class="btn btn-sm btn-secondary ms-1" onclick="changeQuantity('${product._id}', ${item.quantity + 1})">+</button>
                        <button class="btn btn-danger btn-sm ms-2" onclick="removeFromCart('${product._id}')">Remove</button>
                    </div>
                </li>
            `;
        }
        html += `</ul><p class="mt-3"><strong>Total: $${total.toFixed(2)}</strong></p>`;
        cartItems.innerHTML = html;
    }
    new bootstrap.Modal(document.getElementById('cartModal')).show();
});

// Change quantity
async function changeQuantity(productId, newQuantity) {
    if (!Array.isArray(cart)) cart = [];
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    const item = cart.find(item => item.productId._id === productId || item.productId === productId);
    if (item) item.quantity = newQuantity;
    updateCartCount();
    console.log(`Quantity changed for product ${productId} to ${newQuantity}`);
    if (currentUser) {
        token = localStorage.getItem('token');
        console.log('Updating cart quantity on server');
        try {
            const res = await fetch(`/api/cart/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ quantity: newQuantity })
            });
            if (!res.ok) {
                console.error('Failed to update cart quantity:', res.status, res.statusText);
            } else {
                console.log('Cart quantity updated successfully');
            }
        } catch (err) {
            console.error('Error updating cart:', err);
        }
    }
    document.getElementById('cart-link').click(); // Refresh modal
}

// Remove from cart
async function removeFromCart(productId) {
    if (!Array.isArray(cart)) cart = [];
    cart = cart.filter(item => item.productId._id !== productId && item.productId !== productId);
    updateCartCount();
    console.log(`Item ${productId} removed from cart`);
    showNotification('Item removed from cart!');
    if (currentUser) {
        token = localStorage.getItem('token');
        console.log('Removing item from cart on server');
        try {
            const res = await fetch(`/api/cart/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                console.error('Failed to remove item from cart:', res.status, res.statusText);
            } else {
                console.log('Item removed from cart successfully');
            }
        } catch (err) {
            console.error('Error removing from cart:', err);
        }
    }
    document.getElementById('cart-link').click(); // Refresh modal
}

// Stripe checkout
const stripe = Stripe('your-stripe-public-key'); // Replace with your key
document.getElementById('checkout-btn').addEventListener('click', async function() {
    const response = await fetch('/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart })
    });
    const session = await response.json();
    stripe.redirectToCheckout({ sessionId: session.id });
});

// Contact form
document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value
    };
    await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    alert('Message sent!');
});

// Load all products on page load
loadProducts();

// Add to cart event listener
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('add-to-cart')) {
        addToCart(e.target.dataset.id);
    }
});