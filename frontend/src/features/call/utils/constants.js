export const ICE_SERVERS = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const CALL_STATUS = {
    WAITING: "waiting",       // room mein akela hoon, dusre ka wait
    INCOMING: "incoming",     // dusra call kar raha hai — accept/reject dikhana hai
    CALLING: "calling",       // maine join kiya, dusra already room mein tha — uska accept ka wait
    IN_CALL: "in-call",       // call connected
    REJECTED: "rejected",     // dusre ne reject kar diya
    ENDED: "ended",           // call end ho gayi
    ROOM_FULL: "room-full",   // room mein already 2 log hain
};
export const CONNECTION_STATE = {
    CONNECTING: "connecting",
    CONNECTED: "connected",
    RECONNECTING: "reconnecting",
    DISCONNECTED: "disconnected",
};