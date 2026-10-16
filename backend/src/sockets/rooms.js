const WebSocket = require('ws');
const { RECONNECT_GRACE_MS } = require('../config/env');
const { clearRoomChat } = require('./chatStore'); 
// rooms[roomId] = [{ ws, clientId, isCaller, disconnectTimer }]
const rooms = {};

function findEntry(roomId, clientId) {
    if (!rooms[roomId]) return null;
    return rooms[roomId].find((c) => c.clientId === clientId) || null;
}

function joinRoom(ws, roomId, clientId) {
    if (!rooms[roomId]) {
        rooms[roomId] = [];
    }
    const room = rooms[roomId];

    // Same clientId wapas aaya (refresh) — purani slot mein hi baithao
    const existing = findEntry(roomId, clientId);
    if (existing) {
        // Agar client already room mein mil gaya, to reconnect wala code chalao.
        if (existing.disconnectTimer) {
            clearTimeout(existing.disconnectTimer); // purana disconnect timer cancel
            existing.disconnectTimer = null;
        }
        existing.ws = ws;
        ws.roomId = roomId;
        ws.clientId = clientId;
        return { full: false, isCaller: existing.isCaller, totalClients: room.length, reconnected: true };
    }

    if (room.length >= 2) { // room mein already 2 log hain — naye ko join mat karne do
        return { full: true };
    }

    const isCaller = room.length === 1; // 2nd person hamesha caller banega
    ws.roomId = roomId;
    ws.clientId = clientId;
    room.push({ ws, clientId, isCaller, disconnectTimer: null });

    return { full: false, isCaller, totalClients: room.length, reconnected: false };
}

function getOtherClient(ws) {
    const other = getOtherEntry(ws);
    return other ? other.ws : null;
}

function getOtherEntry(ws) {
    const { roomId, clientId } = ws;
    if (!roomId || !rooms[roomId]) return null;
    return rooms[roomId].find((c) => c.clientId !== clientId) || null;
}

// "User disconnect hua hai, abhi room se mat hatao. Kuch time wait karo.
// Agar wapas connect nahi hota, tab room se remove karo."
function scheduleCleanup(ws, onExpire) {
    const { roomId, clientId } = ws;
    if (!roomId || !rooms[roomId]) return;
    const entry = findEntry(roomId, clientId);
    if (!entry) return;

    entry.ws = null;
    if (entry.disconnectTimer) clearTimeout(entry.disconnectTimer);
    entry.disconnectTimer = setTimeout(() => {
        cleanupRoom(ws);
        onExpire?.();
    }, RECONNECT_GRACE_MS);
}

function cleanupRoom(ws) {
    const { roomId, clientId } = ws;
       if (roomId) {                                    // ← ADD
        clearRoomChat(roomId);                       // ← ADD (call khatam = chat delete)
    }       
    if (roomId && rooms[roomId]) {
        const entry = findEntry(roomId, clientId);
        if (entry?.disconnectTimer) clearTimeout(entry.disconnectTimer);
        rooms[roomId] = rooms[roomId].filter((c) => c.clientId !== clientId);
        if (rooms[roomId].length === 0) {
            delete rooms[roomId];
        }
    }
    ws.roomId = null;
}

module.exports = {
    rooms,
    joinRoom,
    getOtherClient,
    getOtherEntry,
    scheduleCleanup,
    cleanupRoom,
    WebSocket,
    RECONNECT_GRACE_MS,
};