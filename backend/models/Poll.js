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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Poll', PollSchema);
