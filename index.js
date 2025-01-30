import http from 'http';
import path from 'path';
import express from 'express';
import {Server as SocketIoServer} from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new SocketIoServer(server);

io.on('connection', socket => {
    console.log("Socket connection with frontend established!");

    socket.on("binaryStream", stream => {
        console.log("Binary Stream incoming....");
    });
});

app.use(express.static(path.resolve('./public')));

server.listen(3000, () => console.log('Server running on port 3000'));