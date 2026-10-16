
// Node ke test ke liye ".js" likhna padta hai (Vite mein zaroori nahi, par likhne se koi nuksaan nahi)
import { CHAT_EVENTS, MESSAGE_STATUS } from "./constants.js";

// Server ka chat event aane par messages ki nayi list banata hai.
// Ye "pure" function hai: React ya socket ko nahi chhuta, sirf purani list leke
// nayi list deta hai. Isliye alag se test ho sakta hai.
export function applyChatEvent(messages, data) {    
    switch (data.type) {
        case CHAT_EVENTS.MESSAGE: { 

            if (!data.message) return messages;
    const incoming = { ...data.message, status: MESSAGE_STATUS.SENT };     
        
// Ye message list mein pehle se hai? (id se ya clientMessageId se dhundho)
    const index = messages.findIndex(      
                (m) =>
                    (m.id && m.id === incoming.id) ||
                    (incoming.clientMessageId && m.clientMessageId === incoming.clientMessageId),
            );

            // 1. Bilkul naya message — end mein jodo
            if (index === -1) return [...messages, incoming];

            // 2. Pehle se hai (mera "sending" wala message, ya duplicate) —
            //    server ka version rakho, usme asli id aur timestamp hai

            const next = [...messages]; 
            next[index] = incoming;
            return next;
        }                 


        case CHAT_EVENTS.HISTORY: {
            if (!Array.isArray(data.messages)) return messages;

            // Refresh ke baad server poori chat bhejta hai — purani list ki jagah ye rakho
            return data.messages.map((m) => ({ ...m, status: MESSAGE_STATUS.SENT }));
        }

        case CHAT_EVENTS.ERROR:   // NEW
            // Server ne message reject kiya — wahi "sending" message ab "failed" dikhega
            return markMessageFailed(messages, data.clientMessageId);

        default:
            return messages;
    }    
}  

// NEW — Sirf "sending" wala message "failed" ho sakta hai. Jo message pehle hi
// "sent" ho chuka hai (server ne confirm kar diya), use kabhi failed nahi banate,
// chahe error ya timeout der se aaye.
export function markMessageFailed(messages, clientMessageId) {
    if (!clientMessageId) return messages;

    return messages.map((m) =>
        m.clientMessageId === clientMessageId && m.status === MESSAGE_STATUS.SENDING
            ? { ...m, status: MESSAGE_STATUS.FAILED }
            : m,
    );
}




// Id of the newest message the server has confirmed (messages still "sending" have no id yet).
export function getLastServerMessageId(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].id) return messages[i].id;
    }
    return null;
}

// Number of messages from the other user that come after the last message the user has seen.
// If lastSeenId is missing or not in the list (first time, or a brand new chat), everything counts as unread.

export function countUnreadAfter(messages, lastSeenId, clientId) {
    const seenIndex = lastSeenId ? messages.findIndex((m) => m.id === lastSeenId) : -1;
    return messages.slice(seenIndex + 1).filter((m) => m.senderId !== clientId).length;
}  


















