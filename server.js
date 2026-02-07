const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const stripe = require('stripe')('your-stripe-secret-key'); // Replace with your key

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

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

// API to get products by category
app.get('/api/products/:category', async (req, res) => {
    const category = req.params.category;
    const products = category === 'all' ? await Product.find() : await Product.find({ category: category });
    res.json(products);
});

app.post('/api/contact', async (req, res) => {
    const user = new User(req.body);
    await user.save();
    res.sendStatus(200);
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

app.listen(3000, () => console.log('Server running on port 3000'));