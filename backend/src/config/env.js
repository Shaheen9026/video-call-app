// Saare environment variables ek jagah — kahin aur process.

require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/video-call-db',
    FFMPEG_PATH: process.env.FFMPEG_PATH || 'ffmpeg',
    MAX_RECORDING_SIZE_MB: Number(process.env.MAX_RECORDING_SIZE_MB || 500),
    RECONNECT_GRACE_MS: Number(process.env.RECONNECT_GRACE_MS || 30000),
    WS_HEARTBEAT_MS: Number(process.env.WS_HEARTBEAT_MS || 20000),
        MAX_MESSAGE_LENGTH: Number(process.env.MAX_MESSAGE_LENGTH || 2000),
    MAX_CHAT_HISTORY: Number(process.env.MAX_CHAT_HISTORY || 200),
     CHAT_RATE_LIMIT_MAX: Number(process.env.CHAT_RATE_LIMIT_MAX || 10),                // NEW
    CHAT_RATE_LIMIT_WINDOW_MS: Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS || 5000), // NEW
        MAX_DISPLAY_NAME_LENGTH: Number(process.env.MAX_DISPLAY_NAME_LENGTH || 30),
};
