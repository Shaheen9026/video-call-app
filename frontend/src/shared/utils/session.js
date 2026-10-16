const CLIENT_ID_KEY = "meet_client_id";
const ACTIVE_ROOM_KEY = "meet_active_room";
const DISPLAY_NAME_KEY = "meet_display_name"; 

// Har browser tab ke liye ek stable clientId — refresh ke baad bhi wahi rehta hai.
// Backend isi se pehchanta hai ki ye "naya" client hai ya "wapas aaya hua" purana client.
export function getOrCreateClientId() {
    let id = sessionStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
        id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        sessionStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
}

export function saveActiveRoom(roomId) {
    sessionStorage.setItem(ACTIVE_ROOM_KEY, roomId);
}

export function getActiveRoom() {
    return sessionStorage.getItem(ACTIVE_ROOM_KEY);
}

export function clearActiveRoom() {
    sessionStorage.removeItem(ACTIVE_ROOM_KEY);
}
// User's chosen display name, remembered per tab (same scope as clientId).
export function getDisplayName() {
    return sessionStorage.getItem(DISPLAY_NAME_KEY) || "";
}

export function saveDisplayName(name) {
    sessionStorage.setItem(DISPLAY_NAME_KEY, name.trim());
}