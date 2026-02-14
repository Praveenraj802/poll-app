const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    password: {
        type: String,
        select: false // Don't include in queries by default
    },
    // OTP Fields
    otp: {
        type: String,
        select: false
    },
    otpExpiry: {
        type: Date,
        select: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        index: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for faster email lookups
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Virtual for ID to ensure consistency between id and _id
userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Virtual field to check if user is admin
userSchema.virtual('isAdmin').get(function () {
    return this.role === 'admin';
});

module.exports = mongoose.model('User', userSchema);
