// Backend ke chatHandlers.js / callHandlers.js ke type naamon se match karna zaroori hai.
export const CHAT_EVENTS = {
    MESSAGE: "chat-message",   // naya message — bhejne wale ko bhi wapas aata hai, aur dusre ko bhi
    HISTORY: "chat-history",   // refresh ke baad server purani chat bhejta hai
    ERROR: "chat-error",       // server ne message reject kiya (khaali / bahut lamba / room mein nahi)
      TYPING: "chat-typing",     // dusra user type kar raha hai
};

export const MESSAGE_STATUS = {
    SENDING: "sending",   // bheja, server ke confirm ka wait
    SENT: "sent",         // server ne save karke wapas bhej diya
    FAILED: "failed",     // server ne reject kiya ya bhejne mein error aaya
};

// Sirf input box ke liye (UX). Asli rok backend ke MAX_MESSAGE_LENGTH par hai —
// backend ka number badlo to yahan bhi wahi rakhna.
export const MAX_MESSAGE_LENGTH = 2000;
export const SEND_TIMEOUT_MS = 8000;
// Type karte waqt "typing" signal itne millisecond mein ek baar se zyada nahi bhejte
export const TYPING_THROTTLE_MS = 2000;
// Dusre ka "typing" signal itne millisecond tak dobara na aaye to indicator hata do
export const TYPING_EXPIRE_MS = 4000;
// Matches the backend's MAX_DISPLAY_NAME_LENGTH.
export const MAX_NAME_LENGTH = 30;