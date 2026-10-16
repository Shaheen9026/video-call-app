const { MAX_DISPLAY_NAME_LENGTH } = require('../config/env');

// Server never trusts a name from the client as-is: trim it, cap its length,
// and fall back to "Guest" if nothing usable is left.
function sanitizeDisplayName(rawName) {
    const name = typeof rawName === 'string' ? rawName.trim().slice(0, MAX_DISPLAY_NAME_LENGTH) : '';
    return name || 'Guest';
}

module.exports = { sanitizeDisplayName };