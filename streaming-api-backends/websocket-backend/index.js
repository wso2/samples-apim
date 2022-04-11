const http = require('http');
const WebSocket = require('ws');
const url = require('url');

const PORT = 8080;
const server = http.createServer();
const notifications = new WebSocket.Server({ noServer: true }); // /notifications
const room1 = new WebSocket.Server({ noServer: true }); // /rooms?room=room1
const room2 = new WebSocket.Server({ noServer: true }); // /rooms?room=room2
const commonRoom = new WebSocket.Server({ noServer: true }); // /rooms?room=common

server.listen(PORT, function log() {
    console.log(`Notifications on: ws://localhost:${PORT}/notifications`);
    console.log(`Chat rooms on: ws://localhost:${PORT}/rooms?room={ID}`);
});

const rooms = { 'room1': room1, 'room2': room2, 'common': commonRoom };

server.on('upgrade', function upgrade(request, socket, head) {
    const pathname = url.parse(request.url).pathname;
    const queryParams = url.parse(request.url, true).query;

    if (pathname === '/notifications') {
        notifications.handleUpgrade(request, socket, head, function done(ws) {
            notifications.emit('connection', ws, request);
        });
    } else if (pathname === '/rooms') {
        let room = rooms[queryParams.room];
        if (room) {
            room.handleUpgrade(request, socket, head, function done(ws) {
                room.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    }
});

notifications.on('connection', function connection(ws) {
// ws.send('Subscribed to notifications!');
    ws.send('{"type" : "ka"}');

    ws.on('message', function message(msg) {
        broadcastToAllSubscribers(ws, notifications, msg)
    });
});

room1.on('connection', function connection(ws) {
    ws.send('You joined room1!');
    broadcastToAllSubscribers(ws, notifications, 'Someone joined room1!');

    ws.on('message', function message(msg) {
        broadcastToAllSubscribers(ws, room1, msg);
    });
});

room2.on('connection', function connection(ws) {
    ws.send('You joined room2!');
    broadcastToAllSubscribers(ws, notifications, 'Someone joined room2!');

    ws.on('message', function message(msg) {
        broadcastToAllSubscribers(ws, room2, msg);
    });
});

commonRoom.on('connection', function connection(ws) {
    ws.send('You joined the common room!');
    broadcastToAllSubscribers(ws, notifications, 'Someone joined the common room!');

    ws.on('message', function message(msg) {
        broadcastToAllSubscribers(ws, commonRoom, msg);
    });
});

function broadcastToAllSubscribers(ws, channel, msg) {
    channel.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    });
}
