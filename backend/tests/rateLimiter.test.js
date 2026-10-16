const test = require('node:test');
const assert = require('node:assert/strict');
const { createRateLimiter } = require('../src/sockets/rateLimiter');

test('allows requests up to the limit, then blocks', () => {
    const isAllowed = createRateLimiter({ max: 3, windowMs: 1000 });

    assert.equal(isAllowed(0), true);
    assert.equal(isAllowed(100), true);
    assert.equal(isAllowed(200), true);
    assert.equal(isAllowed(300), false);
});

test('allows again once the window has passed', () => {
    const isAllowed = createRateLimiter({ max: 2, windowMs: 1000 });

    assert.equal(isAllowed(0), true);
    assert.equal(isAllowed(100), true);
    assert.equal(isAllowed(500), false);
    assert.equal(isAllowed(1000), true); // the first hit (at 0 ms) has left the window
});

test('blocked attempts do not count toward the limit', () => {
    const isAllowed = createRateLimiter({ max: 1, windowMs: 1000 });

    assert.equal(isAllowed(0), true);
    // These 3 are blocked. If they were counted, the window would keep sliding forward.
    assert.equal(isAllowed(300), false);
    assert.equal(isAllowed(600), false);
    assert.equal(isAllowed(900), false);
    assert.equal(isAllowed(1000), true);
});

test('each limiter keeps its own count', () => {
    const a = createRateLimiter({ max: 1, windowMs: 1000 });
    const b = createRateLimiter({ max: 1, windowMs: 1000 });

    assert.equal(a(0), true);
    assert.equal(a(10), false);
    assert.equal(b(10), true); // a hit its limit, b is unaffected
});