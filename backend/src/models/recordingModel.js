const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    roomId: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Recording', recordingSchema, 'callsDetails.recordings');