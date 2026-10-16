
const { randomUUID } = require('crypto');
const { MAX_CHAT_HISTORY } = require('../config/env');

// chats[roomId] = [{ id, clientMessageId, senderId, text, timestamp }]
// Sirf memory mein rehta hai (DB mein nahi). Call khatam hote hi
// clearRoomChat() se delete ho jaata hai, bilkul rooms.js ki tarah.
const chats = {};

function addMessage(roomId, { senderId, senderName, text, clientMessageId }) {
    if (!chats[roomId]) {
        chats[roomId] = [];
    }

    const list = chats[roomId];

    // Same bande ka same clientMessageId dobara aaye (jaise Retry) to naya message
    // mat banao — pehle wala hi lauta do. Isse duplicate message nahi bante.
    if (clientMessageId) {
        const existing = list.find(
            (m) => m.senderId === senderId && m.clientMessageId === clientMessageId,
        );
        if (existing) return existing;
    }

    const message = {
        id: randomUUID(),
        clientMessageId,
        senderId,
          senderName,
        text,
        timestamp: Date.now(),
    };

    list.push(message);

    // Limit se zyada ho jaye to sabse purane messages hatao
    if (list.length > MAX_CHAT_HISTORY) {
        list.splice(0, list.length - MAX_CHAT_HISTORY);
    }

    return message;
}

// Copy return karte hain taaki bahar ka code original array na badal de
function getMessages(roomId) {
    return chats[roomId] ? [...chats[roomId]] : [];
}

function clearRoomChat(roomId) {
    delete chats[roomId];
}

module.exports = { addMessage, getMessages, clearRoomChat };