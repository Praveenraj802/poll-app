const router = require('express').Router();
const mongoose = require('mongoose');
const Poll = require('../models/Poll');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/polls
 * @desc    Retrieve all polls from the database, sorted by most recent
 */
router.get('/', async (req, res) => {
    try {
        const polls = await Poll.find().sort({ createdAt: -1 });
        res.json(polls);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Create a new poll
router.post("/create", auth, async (req, res) => {
    try {
        const { question, options, expiresIn, autoDelete } = req.body; // expiresIn is in hours
        console.log("Creating poll with:", { question, options, expiresIn, autoDelete });

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                message: "Database not connected. Please check your MongoDB Atlas IP Whitelist and connection string."
            });
        }

        if (!question || !options || options.length < 2) {
            return res.status(400).json({ message: "Enter a question and at least 2 options" });
        }

        // Calculate expiry date
        let expiresAt = null;
        if (expiresIn && expiresIn > 0) {
            expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn));
        }

        // Format options to match the schema (array of { text, votes })
        const formattedOptions = options.map(opt => ({ text: opt, votes: 0 }));

        // Set auto-deletion date if requested
        let deleteAt = null;
        if (autoDelete && expiresAt) {
            deleteAt = expiresAt;
        }

        const newPoll = new Poll({
            question,
            options: formattedOptions,
            creator: req.user, // From auth middleware
            expiresAt,
            deleteAt
        });
        await newPoll.save();

        res.status(201).json({ message: "Poll created successfully!", poll: newPoll });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @route   GET /api/polls/:id
 * @desc    Fetch a single poll by its MongoDB ID
 */
router.get('/:id', async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        res.json(poll);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

/**
 * @route   POST /api/polls/:id/vote
 * @desc    Increment the vote count for a specific option in a poll
 */
router.post('/:id/vote', async (req, res) => {
    const { optionIndex } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json('Poll not found');

        // Check if poll is expired or inactive
        if (poll.expiresAt && new Date() > poll.expiresAt) {
            return res.status(400).json({ message: "Voting is now closed for this poll." });
        }

        if (!poll.isActive) {
            return res.status(400).json({ message: "This poll is no longer active." });
        }

        // Check if this IP has already voted
        if (poll.votedIPs.includes(ip)) {
            return res.status(400).json({ message: "You have already voted on this poll." });
        }

        // Basic validation of the option index
        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            return res.status(400).json('Invalid option index');
        }

        poll.options[optionIndex].votes += 1; // Increment vote
        poll.votedIPs.push(ip); // Record IP
        await poll.save();

        // Emit real-time update
        if (req.io) {
            req.io.emit('voteUpdate', poll);
        }

        res.json(poll); // Return updated poll object
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

/**
 * @route   POST /api/polls/:id/remove-vote
 * @desc    Decrement the vote count for a specific option in a poll
 */
router.post('/:id/remove-vote', async (req, res) => {
    const { optionIndex } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json('Poll not found');

        // Basic validation of the option index
        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            return res.status(400).json('Invalid option index');
        }

        // Decrement vote only if it's greater than 0
        if (poll.options[optionIndex].votes > 0) {
            poll.options[optionIndex].votes -= 1;
        }

        // Remove IP from voted list
        poll.votedIPs = poll.votedIPs.filter(votedIp => votedIp !== ip);

        await poll.save();

        // Emit real-time update
        if (req.io) {
            req.io.emit('voteUpdate', poll);
        }

        res.json(poll); // Return updated poll object
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Delete a poll entirely
router.delete('/:id', auth, async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json('Poll not found');

        // Verify creator
        if (!poll.creator || poll.creator.toString() !== String(req.user)) {
            return res.status(403).json({ message: "You are not authorized to delete this poll" });
        }

        await Poll.findByIdAndDelete(req.params.id);
        res.json({ message: 'Poll deleted successfully' });
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Remove a specific option from a poll
router.delete('/:id/options/:optionIndex', auth, async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json('Poll not found');

        // Verify creator
        if (poll.creator && poll.creator.toString() !== req.user) {
            return res.status(403).json({ message: "You are not authorized to modify this poll" });
        }

        const index = parseInt(req.params.optionIndex);
        if (isNaN(index) || index < 0 || index >= poll.options.length) {
            return res.status(400).json('Invalid option index');
        }

        // Must have at least 2 options
        if (poll.options.length <= 2) {
            return res.status(400).json({ message: "A poll must have at least 2 options" });
        }

        poll.options.splice(index, 1);
        await poll.save();
        res.json(poll);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

module.exports = router;
