const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const stripe = require('stripe')('your-stripe-secret-key'); // Replace with your key

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pharmacy', { useNewUrlParser: true, useUnifiedTopology: true });

// Product Model
const Product = mongoose.model('Product', new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    image: String,
    category: String // e.g., 'medicine', 'general'
}));

// User Model
const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: String,
    message: String
}));

// API Routes
app.get('/api/products/:category', async (req, res) => {
    try {
        const category = req.params.category;
        const products = category === 'all' ? await Product.find() : await Product.find({ category: category });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// API to get a single product by ID with related products
app.get('/api/products/id/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        
        // Fetch related products (same category, exclude current)
        const related = await Product.find({ category: product.category, _id: { $ne: product._id } }).limit(4);
        
        res.json({ product, related });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/contact', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Stripe Checkout
app.post('/create-checkout-session', async (req, res) => {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: req.body.items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: { name: 'Product' },
                unit_amount: 1000, // Example price
            },
            quantity: 1,
        })),
        mode: 'payment',
        success_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel',
    });
    res.json({ id: session.id });
});

// Static files (after all API routes)
app.use(express.static('public'));

// Root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.listen(3000, () => console.log('Server running on port 3000'));