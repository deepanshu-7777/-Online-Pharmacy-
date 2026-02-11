const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    message: String,
     cart: [{ productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, quantity: { type: Number, default: 1 } }] // New cart field
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    try {
        if (!this.isModified('password')) return next();
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (err) {
        next(err); // Pass error to save
    }
});

// Compare password (updated to handle both hashed and plain-text passwords)
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        // Check if the stored password is hashed (bcrypt format)
        if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$') || this.password.startsWith('$2y$')) {
            // Hashed password: use bcrypt.compare
            return await bcrypt.compare(candidatePassword, this.password);
        } else {
            // Plain-text password (fallback for old users): direct comparison
            const isMatch = candidatePassword === this.password;
            if (isMatch) {
                // Re-hash the password for security
                this.password = await bcrypt.hash(candidatePassword, 10);
                await this.save();
                console.log('Password re-hashed for user:', this.email);
            }
            return isMatch;
        }
    } catch (err) {
        console.error('Password comparison error:', err);
        return false; // Return false on error to prevent login
    }
};

module.exports = mongoose.model('User', userSchema);