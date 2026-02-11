const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const stripe = require('stripe')('your-stripe-secret-key'); // Replace with your key

const app = express();
app.use(cors());
app.use(express.json());
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const JWT_SECRET = 'your-secret-key'; // Change to a strong secret in production

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pharmacy', { useNewUrlParser: true, useUnifiedTopology: true });

// Require models
const Product = require('./Models/Product');
const User = require('./Models/User');

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
// Signup route
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const user = new User({ name, email, password });
        await user.save();
        console.log('User created:', email); // Debug
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Server error during signup' });
    }
});

// Login route (already updated, but ensure it's catching errors)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { name: user.name, email: user.email } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Protected route example (e.g., get user profile)
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json(user);
});

// ... existing code ...

// Get user's cart
app.get('/api/cart', authenticateToken, async (req, res) => {
    console.log('GET /api/cart called for user:', req.user.id);
    try {
        const user = await User.findById(req.user.id).populate({ path: 'cart.productId', strictPopulate: false });
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ error: 'User not found' });
        }
        if (!user.cart) user.cart = [];
        console.log('Cart loaded:', user.cart);
        res.json(user.cart);
    } catch (err) {
        console.error('Get cart error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add to cart
app.post('/api/cart', authenticateToken, async (req, res) => {
    console.log('POST /api/cart called for user:', req.user.id, 'with data:', req.body);
    try {
        const { productId, quantity = 1 } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ error: 'User not found' });
        }
        if (!user.cart) user.cart = [];
        
        const existingItem = user.cart.find(item => item.productId.equals(new mongoose.Types.ObjectId(productId)));
        if (existingItem) {
            existingItem.quantity += quantity;
            console.log('Updated existing item quantity');
        } else {
            user.cart.push({ productId: new mongoose.Types.ObjectId(productId), quantity });
            console.log('Added new item to cart');
        }
        user.markModified('cart'); // Force Mongoose to save the array
        await user.save();
        console.log('Cart saved successfully to DB:', user.cart);
        res.json(user.cart);
    } catch (err) {
        console.error('Add to cart error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update cart item quantity
app.put('/api/cart/:productId', authenticateToken, async (req, res) => {
    console.log('PUT /api/cart/:productId called for user:', req.user.id, 'product:', req.params.productId, 'data:', req.body);
    try {
        const { quantity } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ error: 'User not found' });
        }
        if (!user.cart) user.cart = [];
        
        const item = user.cart.find(item => item.productId.equals(new mongoose.Types.ObjectId(req.params.productId)));
        if (item) {
            item.quantity = quantity;
            if (quantity <= 0) user.cart = user.cart.filter(i => i !== item);
            user.markModified('cart');
            await user.save();
            console.log('Cart updated successfully to DB:', user.cart);
        } else {
            console.log('Item not found in cart');
        }
        res.json(user.cart);
    } catch (err) {
        console.error('Update cart error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Remove from cart
app.delete('/api/cart/:productId', authenticateToken, async (req, res) => {
    console.log('DELETE /api/cart/:productId called for user:', req.user.id, 'product:', req.params.productId);
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ error: 'User not found' });
        }
        if (!user.cart) user.cart = [];
        
        user.cart = user.cart.filter(item => !item.productId.equals(new mongoose.Types.ObjectId(req.params.productId)));
        user.markModified('cart');
        await user.save();
        console.log('Cart after removal saved to DB:', user.cart);
        res.json(user.cart);
    } catch (err) {
        console.error('Remove from cart error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));