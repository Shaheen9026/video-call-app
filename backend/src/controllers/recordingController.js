const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');
const recordingModel = require('../models/recordingModel');
const { FFMPEG_PATH } = require('../config/env');

const execFileAsync = promisify(execFile);

// Browser ka MediaRecorder + fix-webm-duration library kabhi-kabhi WebM ka
// container thoda malformed bana deti hai (duration sahi hoti hai, lekin
// video player 10-15 second baad hi rukk jaata hai). Isko fix karne ke liye
// ffmpeg se "remux" karte hain — bina quality kharab kiye (-c copy, re-encode
// nahi hota, sirf container theek hota hai), file poori tarah playable ban
// jaati hai.
async function repairWebmContainer(filePath) {
    const fixedPath = filePath.replace(/\.webm$/, '.fixed.webm');

    await execFileAsync(FFMPEG_PATH, ['-y', '-i', filePath, '-c', 'copy', fixedPath]);

    // Purani (corrupt) file hata ke, fix ki hui file ko usi naam se rakho
    fs.unlinkSync(filePath);
    fs.renameSync(fixedPath, filePath);
}

// POST /api/recordings/upload
async function uploadRecording(req, res) {
    if (!req.file) {
        return res.status(400).json({ error: 'No file received' });
    }

    const filePath = req.file.path;
    let repaired = true;
    try {
        await repairWebmContainer(filePath);
    } catch (err) {
        // Agar ffmpeg fail ho jaye (ya install na ho), original file ke
        // saath hi aage badho — upload poori tarah fail nahi hona chahiye.
        repaired = false;
        console.error('⚠️ ffmpeg repair FAILED:', err.message);
    }

    try {
        const recording = await recordingModel.create({
            filename: req.file.filename,
            roomId: req.body.roomId || 'unknown',
            recordedBy: req.body.recordedBy || 'unknown-user',
            size: fs.statSync(filePath).size,
        });

        res.status(200).json({
            message: repaired ? 'Recording saved' : 'Saved, but duration repair failed',
            repaired,
            recording,
        });
    } catch (err) {
        console.error('DB save failed:', err.message);
        res.status(500).json({ error: 'Could not save recording metadata' });
    }
}

// GET /api/recordings
async function listRecordings(req, res) {
    try {
        const recordings = await recordingModel.find().sort({ uploadedAt: -1 });
        res.status(200).json({ recordings });
    } catch (err) {
        console.error('DB fetch failed:', err.message);
        res.status(500).json({ error: 'Could not fetch recordings' });
    }
}

module.exports = { uploadRecording, listRecordings };