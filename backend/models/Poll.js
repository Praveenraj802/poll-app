const mongoose = require('mongoose');

// Schema for individual voting options
const OptionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    votes: {
        type: Number,
        default: 0 // Initialize votes at zero
    }
});

// Main Poll Schema
const PollSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: [OptionSchema], // Array of possible answers
    votedIPs: [String], // Track IPs to prevent multiple voting
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // NEW: Expiry Fields
    expiresAt: {
        type: Date,
        default: null // null means no expiry
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Virtual field to check if poll is expired
PollSchema.virtual('isExpired').get(function () {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
});

// Ensure virtuals are included in JSON response
PollSchema.set('toJSON', { virtuals: true });
PollSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Poll', PollSchema);
