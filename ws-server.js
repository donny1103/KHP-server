const express = require('express');
const WebSocket = require('ws');
const SocketServer = WebSocket.Server;
const uuidv4 = require('uuid/v4');

// Dummy Data
PENDING_USERS = {
  type: 'queue',
  queue: {
    '0243cf5e-98d3-4e17-1234-151e8b7ef750': { age: 5, name: 'Raymond', 'severity': 55, time: new Date() },
    '0243cf5e-98d3-4e17-1234-151e8b7e2323': { age: 8, name: 'Donny', 'severity': 100, time: new Date() },
    '0243cf5e-98d3-4e17-1234-151e8b7e2342': { age: 10, name: 'Alfred', 'severity': 20, time: new Date() },
    '0243cf5e-98d3-4e17-1234-151esd7e2342': { age: 10, name: 'Bob', 'severity': 60, time: new Date() },
    '0243cf5e-98d3-4e17-1234-151e8s7e2342': { age: 6, name: 'Food', 'severity': 33, time: new Date() },
    '0243cf5e-98d3-4e17-1234-dd1e8b7e2342': { age: 7, name: 'Fish', 'severity': 28, time: new Date() },
  }
}

// Set the port to 3001
const PORT = 3001;

// Create a new express server
const server = express()
  // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${PORT}`));

// Create the WebSockets server
const wss = new SocketServer({ server });

// Set broadcast function;
wss.broadcast = data => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  })
}

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
wss.on('connection', (ws) => {
  console.log('Client connected. Total', wss.clients.size);
  // New user detected
  // Broadcast user count
  const userCount = {
    type: 'updateCount',
    count: Object.keys(PENDING_USERS.queue).length,
  }

  ws.send(JSON.stringify(PENDING_USERS));
  wss.broadcast(JSON.stringify(userCount));

  // Handling incoming messages.
  ws.on('message', data => {
    const message = JSON.parse(data);
    switch (message.type) {
      case 'user':
        if (!message.id) {
          message.id = uuidv4();
        };
        PENDING_USERS[message.id] = message;
        wss.broadcast(PENDING_USERS);
        break;
      case 'postMessage':
        console.log(`User ${message.username} said ${message.content}`)
        message.id = uuidv4();
        message.type = 'incomingMessage';
        wss.broadcast(JSON.stringify(message));
        break;
      case 'postNotification':
        message.id = uuidv4();
        message.type = 'incomingNotification';
        wss.broadcast(JSON.stringify(message));
        break;
      default:
        console.log('Message not recognised:', message);
    }
  })

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    console.log('Client disconnected');
    // Broadcast new user count
    userCount.count = wss.clients.size;
    wss.broadcast(JSON.stringify(userCount));
  })
});