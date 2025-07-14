const cartItems = [];

// Add product to cart
function addToCart(name, price) {
  cartItems.push({ name, price });
  renderCart();
}

// Render the cart
function renderCart() {
  const cartList = document.getElementById('cart-items');
  const totalElement = document.getElementById('cart-total');
  cartList.innerHTML = '';
  let total = 0;

  cartItems.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.name} - $${item.price}`;
    cartList.appendChild(li);
    total += item.price;
  });

  totalElement.textContent = total.toFixed(2);
}

// Place order and send to backend
function placeOrder() {
  if (cartItems.length === 0) {
    alert('Your cart is empty. Please add items to your cart before placing an order.');
    return;
  }

  const order = {
    items: cartItems,
    total: cartItems.reduce((sum, item) => sum + item.price, 0),
    timestamp: new Date().toISOString()
  };

  fetch('http://localhost:5000/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  })
    .then(res => res.json())
    .then(data => {
      alert(`✅ Order placed successfully!\n\nOrder Details:\n${data.order.items.map(i => `${i.name} - $${i.price}`).join('\n')}\n\nTotal: $${data.order.total}`);
      cartItems.length = 0;
      renderCart();
    })
    .catch(err => {
      alert('❌ Failed to place order. Please try again later.');
      console.error(err);
    });
}

// Load product list from backend
function loadProducts() {
  fetch('http://localhost:5000/api/products')
    .then(res => res.json())
    .then(products => {
      const grid = document.getElementById('product-grid');
      grid.innerHTML = '';

      products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
          <img src="images/${product.image || 'default.jpg'}" alt="${product.name}" />
          <h3>${product.name}</h3>
          <p>Price: $${product.price}</p>
          <button onclick="addToCart('${product.name}', ${product.price})">Add to Cart</button>
        `;
        grid.appendChild(card);
      });
    })
    .catch(err => {
      console.error('❌ Failed to load products:', err);
    });
}

// Initialize on page load
window.onload = () => {
  loadProducts();
  renderCart();
};
