import { useRef, useCallback } from "react";
import { createWebSocketConnection, sendMessage } from "../services/websocketService";

// Sirf WebSocket signaling transport ka kaam karta hai — connect, send, close.
// Isko koi WebRTC ka pata nahi hota, sirf messages pass karta hai.
export function useWebSocket() {
    const wsRef = useRef(null);//WebSocket connection ko store karne ke liye.
    //Ye function WebSocket connection establish karne ke liye hai.
    const connect = useCallback((roomId, onMessage, onClose) => {
        const ws = createWebSocketConnection(roomId, onMessage, onClose);
        wsRef.current = ws;//Ab jo connection bana tha usko save kar diya.
        return ws;
    }, []);

    const send = useCallback((type, payload) => {//WebSocket ke through message send karna.
      return   sendMessage(wsRef.current, type, payload);
    }, []);

    const close = useCallback(() => {//WebSocket connection ko band karna.
        wsRef.current?.close();
    }, []);

    return { wsRef, connect, send, close };
}

