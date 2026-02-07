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

// Shopping cart
let cart = [];
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('add-to-cart')) {
        const id = e.target.dataset.id;
        cart.push(id);
        document.getElementById('cart-count').textContent = cart.length;
    }
});

document.getElementById('cart-link').addEventListener('click', function() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = cart.length ? 'Items in cart: ' + cart.join(', ') : 'Cart is empty';
    new bootstrap.Modal(document.getElementById('cartModal')).show();
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