const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected:', MONGO_URI);
    } catch (err) {
        console.error('MongoDB connection failed:', err.message);
    }
}

module.exports = connectDB;