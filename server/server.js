const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Example product list (can come from database later)
const products = [
  { id: 1, name: 'Paracetamol 500mg', price: 5, image: 'paracetamol.jpg' },
  { id: 2, name: 'Vitamin C Tablets', price: 10, image: 'vitamin-c.jpg' },
  { id: 3, name: 'Cough Syrup', price: 7, image: 'cough.jpg' },
  { id: 4, name: 'Tramadol INJECTION', price: 9, image: 'tramadol-INJECTION.jpg' },
];


// Routes
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/order', (req, res) => {
  const order = req.body;
  console.log('Received Order:', order);
  res.json({ message: 'Order received successfully', order });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
