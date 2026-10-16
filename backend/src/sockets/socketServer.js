const WebSocket = require('ws');
const { WS_HEARTBEAT_MS } = require('../config/env');

const {
    handleJoin,
    handleCallAccept,
    handleCallReject,
    handleCallEnd,
    relayMessage,
    handleDisconnect,
    handleRecordingStatus,
} = require('./callHandlers');
const { handleChatMessage ,handleChatTyping } = require('./chatHandlers'); 
// Message type -> handler mapping. Naya signaling message add karna ho to
// bas yahan ek entry add karo — server bootstrap code kabhi chhedna nahi padega.
const MESSAGE_HANDLERS = {
    join: handleJoin,
    'call-accept': handleCallAccept,
    'call-reject': handleCallReject,
    'call-end': handleCallEnd,
    'recording-status': handleRecordingStatus,
    offer: relayMessage,
    answer: relayMessage,
    'ice-candidate': relayMessage,
    'chat-message': handleChatMessage,
    'chat-typing': handleChatTyping, 
};

function attachSocketServer(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('New client connected');

        // LAN pe router/NAT idle connections ko kuch der baad khud band kar
        // dete hain (kyunki call ke doraan video/audio WebRTC se seedha
        // peer-to-peer jaata hai, is signaling socket pe koi traffic nahi
        // hota). Isliye periodically ek "ping" bhejte hain taaki connection
        // "alive" mana jaaye aur router ise band na kare.
        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('message', (message) => {
            let data;
            try {
                data = JSON.parse(message);
            } catch (err) {
                console.log('Invalid JSON received');
                return;
            }

            console.log('Received:', data.type);

            const handler = MESSAGE_HANDLERS[data.type];
            if (handler) {
                handler(ws, data);
            } else {
                console.log('Unknown message type:', data.type);
            }
        });

        ws.on('close', () => {
            handleDisconnect(ws);
        });
    });

    // Har round mein sabko ping karo. Agar koi client pichle round mein pong
    // wapas nahi bheja (matlab genuinely dead hai), use terminate karo.
    const heartbeat = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, WS_HEARTBEAT_MS);

    wss.on('close', () => clearInterval(heartbeat));

    return wss;
}

module.exports = { attachSocketServer };