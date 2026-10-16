// Remembers the last message the user has seen, so the unread badge survives a page refresh.
// sessionStorage = per browser tab, the same scope as the tab's clientId.
const keyFor = (roomId) => `chat-last-seen:${roomId}`;

export function loadLastSeenId(roomId) {
    try {
        return sessionStorage.getItem(keyFor(roomId));
    } catch {
        return null; // storage blocked or unavailable
    }
}

export function saveLastSeenId(roomId, messageId) {
    try {
        sessionStorage.setItem(keyFor(roomId), messageId);
    } catch {
        // ignore: the badge just won't survive a refresh
    }
}