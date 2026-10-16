const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { MAX_RECORDING_SIZE_MB } = require('../config/env');

const RECORDINGS_DIR = path.join(__dirname, '..', '..', 'storage', 'recordings');

if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, RECORDINGS_DIR);
    },
    filename: (req, file, cb) => {
        const roomId = req.body.roomId || 'unknown-room';
        const safeRoomId = roomId.replace(/[^a-zA-Z0-9_-]/g, '');
        cb(null, `${safeRoomId}-${Date.now()}.webm`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: MAX_RECORDING_SIZE_MB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        // TEMPORARY DEBUG — ye batayega browser actual me kya bhej raha hai
        console.log('DEBUG upload file:', {
            mimetype: file.mimetype,
            originalname: file.originalname,
        });

        // Browser MediaRecorder mimetype "video/webm;codecs=vp9,opus" jaisa
        // bhejta hai (codecs suffix ke saath), isliye startsWith use karo,
        // strict equality nahi — warna har upload reject ho jayega.
        const isWebm = file.mimetype.startsWith('video/webm');
        const hasWebmExt = file.originalname.toLowerCase().endsWith('.webm');
        if (isWebm && hasWebmExt) {
            cb(null, true);
        } else {
            cb(new Error('Only .webm files are allowed'));
        }
    },
});

module.exports = { upload, RECORDINGS_DIR };