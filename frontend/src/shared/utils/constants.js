


// Backend WebSocket signaling server ka URL — call aur (future) chat, dono
// isi ek connection ko share karte hain. .env se aata hai; agar set nahi hai
// to localhost pe fallback karta hai (dev ke liye).
export const WS_SERVER_URL = import.meta.env.VITE_WS_URL || "ws://localhost:5000";
// Backend REST API ka base URL (recording upload jaise HTTP endpoints ke liye)
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
// Message bhejne ke itne millisecond baad tak server ka confirm na aaye to "failed" maano
export const SEND_TIMEOUT_MS = 8000;