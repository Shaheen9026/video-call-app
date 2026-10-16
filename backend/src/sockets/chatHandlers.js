
const { sanitizeDisplayName } = require('./nameUtils');
const { WebSocket, getOtherClient } = require('./rooms');
const { addMessage } = require('./chatStore');
const { createRateLimiter } = require('./rateLimiter');
const { MAX_MESSAGE_LENGTH, CHAT_RATE_LIMIT_MAX, CHAT_RATE_LIMIT_WINDOW_MS } = require('../config/env');

// Har connection ka apna rate limiter. WeakMap ka fayda: connection band hote hi
// uska limiter apne aap memory se hat jaata hai, alag se saaf nahi karna padta.
const limiters = new WeakMap();

function getLimiter(ws) {
    if (!limiters.has(ws)) {
        limiters.set(
            ws,
            createRateLimiter({ max: CHAT_RATE_LIMIT_MAX, windowMs: CHAT_RATE_LIMIT_WINDOW_MS }),
        );
    }
    return limiters.get(ws);
    
}

// Har jagah "readyState === OPEN" check likhne ki jagah ek chhota helper
function send(ws, payload) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
    }
}

function handleChatMessage(ws, data) {
    const clientMessageId =
        typeof data.clientMessageId === 'string' ? data.clientMessageId.slice(0, 64) : undefined;

    // 1. Ye client kisi room mein join hai? (join ke baad hi ws.roomId set hota hai)
    if (!ws.roomId || !ws.clientId) {
        send(ws, { type: 'chat-error', clientMessageId, message: 'Join a room before sending messages' });
        return;
    }

    // 2. Bahut tezi se message bhej raha hai? (spam se bachav)
    if (!getLimiter(ws)()) {
        send(ws, {
            type: 'chat-error',
            clientMessageId,
            message: 'You are sending messages too fast. Please wait a moment.',
        });
        return;
    }

    // 3. Text validate karo — server client ki baat par bharosa nahi karta
    const text = typeof data.text === 'string' ? data.text.trim() : '';

    if (!text) {
        send(ws, { type: 'chat-error', clientMessageId, message: 'Message cannot be empty' });
        return;
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
        send(ws, {
            type: 'chat-error',
            clientMessageId,
            message: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)`,
        });
        return;
    }

    // 4. Save karo. senderId server ke paas pehle se hai (ws.clientId),
    // client se nahi lete
   // const message = addMessage(ws.roomId, { senderId: ws.clientId, text, clientMessageId });
       // 4. Save karo. senderId server ke paas pehle se hai (ws.clientId),
    // client se nahi lete. Naam bhi sanitize karke hi save hota hai.
    const senderName = sanitizeDisplayName(data.displayName);
    const message = addMessage(ws.roomId, { senderId: ws.clientId, senderName, text, clientMessageId });

    // 5. Bhejne wale ko confirmation, aur doosre user ko message
    send(ws, { type: 'chat-message', message });
    send(getOtherClient(ws), { type: 'chat-message', message });
}

// "Typing..." indicator: kuch save nahi hota, bas dusre user ko bata dete hain
function handleChatTyping(ws, data) {
    if (!ws.roomId || !ws.clientId) return;
    send(getOtherClient(ws), { type: 'chat-typing', 
        isTyping: data.isTyping === true,
        senderName: sanitizeDisplayName(data.displayName),
    });
}

module.exports = { handleChatMessage, handleChatTyping };