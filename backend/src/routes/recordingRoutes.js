const express = require('express');
const router = express.Router();
const { upload, RECORDINGS_DIR } = require('../middleware/uploadMiddleware');
const { uploadRecording, listRecordings } = require('../controllers/recordingController');

// upload.single() ke multer errors (galat file type, size limit, etc.)
// pehle yahan catch karte hain taaki client ko generic 500 crash ki jagah
// ek readable JSON error message mile.
function handleUpload(req, res, next) {
    upload.single('recording')(req, res, (err) => {
        if (err) {
            console.error('Upload rejected:', err.message);
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}

router.post('/upload', handleUpload, uploadRecording);
router.get('/', listRecordings);

module.exports = { router, RECORDINGS_DIR };