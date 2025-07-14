const cartItems = [];

function addToCart(name, price) {
  cartItems.push({ name, price });
  renderCart();
}

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

function placeOrder() {
  if (cartItems.length === 0) {
    alert('Your cart is empty. Please add items to your cart before placing an order.');
    return;
  }

  const orderDetails = cartItems.map(item => `${item.name} - $${item.price}`).join('\n');
  const total = cartItems.reduce((sum, item) => sum + item.price, 0).toFixed(2);

  alert(`Order placed successfully!\n\nOrder Details:\n${orderDetails}\n\nTotal: $${total}`);
  cartItems.length = 0; // Clear the cart
  renderCart(); // Update the cart display
}
