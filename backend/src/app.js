const express = require('express');
const cors = require('cors');

const { router: recordingRoutes, RECORDINGS_DIR } = require('./routes/recordingRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Recording upload/list/download endpoints
app.use('/api/recordings', recordingRoutes);              // POST /api/recordings/upload, GET /api/recordings
app.use('/recordings', express.static(RECORDINGS_DIR));   // static file serving — actual .webm files access karne ke liye

module.exports = app;