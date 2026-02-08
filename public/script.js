// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Load products by category
async function loadProducts(category = 'all') {
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

// Shopping cart with full details
let cart = [];

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('add-to-cart')) {
        const id = e.target.dataset.id;
        const product = { id, name: e.target.closest('.card').querySelector('.card-title').textContent, price: parseFloat(e.target.previousElementSibling.textContent.replace('$', '')) };
        cart.push(product);
        updateCartCount();
    }
});

function updateCartCount() {
    document.getElementById('cart-count').textContent = cart.length;
}

document.getElementById('cart-link').addEventListener('click', function() {
    const cartItems = document.getElementById('cart-items');
    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty.</p>';
    } else {
        let html = '<ul class="list-group">';
        let total = 0;
        cart.forEach((item, index) => {
            html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                ${item.name} - $${item.price}
                <button class="btn btn-danger btn-sm remove-item" data-index="${index}">Remove</button>
            </li>`;
            total += item.price;
        });
        html += `</ul><p class="mt-3"><strong>Total: $${total.toFixed(2)}</strong></p>`;
        cartItems.innerHTML = html;
    }
    new bootstrap.Modal(document.getElementById('cartModal')).show();
});

// Remove item from cart
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-item')) {
        const index = e.target.dataset.index;
        cart.splice(index, 1);
        updateCartCount();
        document.getElementById('cart-link').click(); // Refresh modal
    }
});


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

loadProducts();