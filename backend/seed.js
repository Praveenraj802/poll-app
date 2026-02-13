const mongoose = require('mongoose');
const Poll = require('./models/Poll');
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/polling-app';

const seedDemoPoll = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing polls (Optional - uncomment if you want a clean start)
        // await Poll.deleteMany({});

        const demoPoll = new Poll({
            question: 'What is your favorite programming language for the web?',
            options: [
                { text: 'JavaScript', votes: 15 },
                { text: 'TypeScript', votes: 12 },
                { text: 'Python', votes: 5 },
                { text: 'Go', votes: 3 }
            ]
        });

        await demoPoll.save();
        console.log('Demo poll created successfully!');
        process.exit();
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

seedDemoPoll();
