// Sliding-window rate limiter. Ek limiter = ek connection ke liye hisaab.
// "windowMs" milliseconds ke andar zyada se zyada "max" baar allow karta hai.
function createRateLimiter({ max, windowMs }) {
    const hits = []; // sirf allow hue kaamon ke time

    return function isAllowed(now = Date.now()) {
        // Window se purane hits hata do
        while (hits.length > 0 && now - hits[0] >= windowMs) {
            hits.shift();
        }

        if (hits.length >= max) {
            return false;
        }

        hits.push(now);
        return true;
    };
}

module.exports = { createRateLimiter };