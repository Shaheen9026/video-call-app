const test = require('node:test');
const assert = require('node:assert/strict');
const { addMessage, getMessages, clearRoomChat } = require('../src/sockets/chatStore');
const { MAX_CHAT_HISTORY } = require('../src/config/env');

test('saves a message and assigns a server id and timestamp', () => {
    const message = addMessage('room-save', { senderId: 'a', text: 'hi', clientMessageId: 'c1' });

    assert.equal(message.text, 'hi');
    assert.equal(message.senderId, 'a');
    assert.equal(message.clientMessageId, 'c1');
    assert.ok(message.id, 'message should have an id');
    assert.equal(typeof message.timestamp, 'number');
    assert.equal(getMessages('room-save').length, 1);
});

test('does not create a duplicate when the same sender retries with the same clientMessageId', () => {
    const first = addMessage('room-dup', { senderId: 'a', text: 'hi', clientMessageId: 'c1' });
    const second = addMessage('room-dup', { senderId: 'a', text: 'hi', clientMessageId: 'c1' });

    assert.equal(second.id, first.id);
    assert.equal(getMessages('room-dup').length, 1);
});

test('treats the same clientMessageId from a different sender as a new message', () => {
    addMessage('room-two', { senderId: 'a', text: 'hi', clientMessageId: 'same' });
    addMessage('room-two', { senderId: 'b', text: 'hello', clientMessageId: 'same' });

    assert.equal(getMessages('room-two').length, 2);
});

test('drops the oldest messages once the history limit is exceeded', () => {
    for (let i = 0; i < MAX_CHAT_HISTORY + 5; i++) {
        addMessage('room-limit', { senderId: 'a', text: `m${i}`, clientMessageId: `id${i}` });
    }

    const messages = getMessages('room-limit');
    assert.equal(messages.length, MAX_CHAT_HISTORY);
    assert.equal(messages[0].text, 'm5'); // m0 to m4 were dropped
});

test('getMessages returns a copy, so changing it does not change the store', () => {
    addMessage('room-copy', { senderId: 'a', text: 'hi', clientMessageId: 'c1' });

    const copy = getMessages('room-copy');
    copy.length = 0;

    assert.equal(getMessages('room-copy').length, 1);
});

test('keeps each room\'s chat separate', () => {
    addMessage('room-x', { senderId: 'a', text: 'x', clientMessageId: 'c1' });

    assert.equal(getMessages('room-y').length, 0);
});

test('clearRoomChat deletes the chat of that room', () => {
    addMessage('room-clear', { senderId: 'a', text: 'hi', clientMessageId: 'c1' });
    clearRoomChat('room-clear');

    assert.equal(getMessages('room-clear').length, 0);
});