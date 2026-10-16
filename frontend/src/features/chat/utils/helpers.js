// Server ka timestamp (milliseconds) leke "3:45 PM" jaisa time deta hai
export function formatMessageTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Har message ki apni unique id — server isi ko wapas bhejta hai taaki
// frontend "sending" wale message ko "sent" mein badal sake
export function createClientMessageId() {
    return typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
// Sirf http:// aur https:// links pehchante hain (javascript: jaise khatarnak links nahi)
const URL_REGEX = /https?:\/\/[^\s<>"']+/g;

// Text ko tukdon mein todta hai: [{ type: "text" | "link", value }]
// Link ke end ki punctuation (. , ! ? ) ) link ka hissa nahi maani jaati.
export function splitTextWithLinks(text) {
    const parts = [];
    let lastIndex = 0;

    for (const match of text.matchAll(URL_REGEX)) {
        const url = match[0].replace(/[.,!?;:)\]]+$/, "");
        if (match.index > lastIndex) {
            parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
        }
        parts.push({ type: "link", value: url });
        lastIndex = match.index + url.length;
    }

    if (lastIndex < text.length) {
        parts.push({ type: "text", value: text.slice(lastIndex) });
    }
    return parts;
}