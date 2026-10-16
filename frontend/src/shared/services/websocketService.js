import { WS_SERVER_URL } from "../utils/constants";
import { getOrCreateClientId } from "../utils/session";
export function createWebSocketConnection(roomId, onMessage, onClose) {
    const ws = new WebSocket(WS_SERVER_URL);

    const clientId = getOrCreateClientId();
    ws.onopen = () => {
        console.log("Connected to signaling server");
        ws.send(JSON.stringify({ type: "join", roomId, clientId }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onMessage(data);
    };

    ws.onclose = () => {
        console.log("Disconnected from signaling server");
        onClose?.();
    };

    ws.onerror = (err) => {
        console.error("WebSocket error:", err.message || err);
    };

    return ws;
}



export function sendMessage(ws, type, payload = {}) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, ...payload }));//JSON.stringify() JavaScript object ko JSON string mein convert karta hai, taaki WebSocket par bheja ja sake.
        return true;    // NEW — bhej diya
    }
    return false;       // NEW — socket open nahi tha, bheja nahi
}
