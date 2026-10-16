const { WebSocket, joinRoom, getOtherClient, scheduleCleanup, cleanupRoom } = require('./rooms');
const { getMessages } = require('./chatStore');  
function handleJoin(ws, data) {
    const { roomId, clientId } = data;

    if (!roomId || !clientId) {
        ws.send(JSON.stringify({ type: 'error', message: 'roomId and clientId are required' }));
        return;
    }

    const result = joinRoom(ws, roomId, clientId);

    if (result.full) {
        ws.send(JSON.stringify({ type: 'room-full' }));
        ws.close();
        return;
    }

    ws.send(JSON.stringify({ type: 'joined', isCaller: result.isCaller, reconnected: result.reconnected }));

    if (result.reconnected) {
        // Ye client refresh karke wapas aaya — doosre peer ko batao taaki wo
         ws.send(JSON.stringify({ type: 'chat-history', messages: getMessages(roomId) })); 
        // connection renegotiate kare (naya offer bheje)
        const other = getOtherClient(ws);
        if (other && other.readyState === WebSocket.OPEN) {
            other.send(JSON.stringify({ type: 'peer-reconnected' }));
        }
    } else if (result.totalClients === 2) {
        const waiter = getOtherClient(ws);
        if (waiter && waiter.readyState === WebSocket.OPEN) {
            waiter.send(JSON.stringify({ type: 'incoming-call', roomId }));
        }
    }

    console.log(`Client joined room: ${roomId}, total clients: ${result.totalClients}, reconnected: ${result.reconnected}`);
}

function handleCallAccept(ws) {
    const other = getOtherClient(ws);
    if (other && other.readyState === WebSocket.OPEN) {
        other.send(JSON.stringify({ type: 'call-accepted' }));
    }
}   

function handleCallReject(ws) {
    const other = getOtherClient(ws);
    if (other && other.readyState === WebSocket.OPEN) {
        other.send(JSON.stringify({ type: 'call-rejected' }));
    }
    cleanupRoom(ws);
}

function handleCallEnd(ws) {
    const other = getOtherClient(ws);
    if (other && other.readyState === WebSocket.OPEN) {
        other.send(JSON.stringify({ type: 'call-ended' }));
    }
    cleanupRoom(ws);
}

function relayMessage(ws, data) {
    const other = getOtherClient(ws);
    if (other && other.readyState === WebSocket.OPEN) {
        other.send(JSON.stringify(data));
    }
}

function handleDisconnect(ws) {
    const other = getOtherClient(ws);

    // Turant "call-ended" nahi bhejte — pehle doosre peer ko batao ki connection
    // lost hui hai, phir grace period do (refresh se wapas aa sakta hai)
    if (other && other.readyState === WebSocket.OPEN) {
        other.send(JSON.stringify({ type: 'peer-connection-lost' }));
    }

    scheduleCleanup(ws, () => {
        if (other && other.readyState === WebSocket.OPEN) {
            other.send(JSON.stringify({ type: 'call-ended' }));
        }
    });

    console.log('Client disconnected (grace period started)');
}

function handleRecordingStatus(ws, data) {
    // Jab ek user recording start/stop kare, dusre peer ko turant batao —
    // taaki dono ko pata rahe call record ho rahi hai (privacy/consent ke liye zaroori)
    const other = getOtherClient(ws);
    if (other && other.readyState === WebSocket.OPEN) {
        other.send(JSON.stringify({
            type: 'recording-status',
            isRecording: data.isRecording,
        }));
    }
}

module.exports = {
    handleJoin,
    handleCallAccept,
    handleCallReject,
    handleCallEnd,
    relayMessage,
    handleDisconnect,
    handleRecordingStatus
};