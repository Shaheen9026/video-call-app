
const http = require('http');

const { PORT } = require('./src/config/env');
const connectDB = require('./src/config/db');
const app = require('./src/app');
const { attachSocketServer } = require('./src/sockets/socketServer');

connectDB();

const server = http.createServer(app);
attachSocketServer(server);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Signaling server running on port ${PORT}`);
});

