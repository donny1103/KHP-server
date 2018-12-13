const express = require('express');
const WebSocket = require('ws');
const SocketServer = WebSocket.Server;
const uuidv4 = require('uuid/v4');

// Dummy Data
PENDING_USERS = {
  type: 'queue',
  queue: {
    '0243cf5e-98d3-4e17-1234-151e8b7ef750': { age: 5, name: 'Raymond', gender: 'male', 'severity': 55, time: new Date(), sadValue: 6, scaredValue: 3, favoriteColor: 'green', careAbout:['friend','teacher','pet','other']},
    '0243cf5e-98d3-4e17-1234-151e8b7e2323': { age: 8, name: 'Donny', gender: 'male', 'severity': 100, time: new Date(), sadValue: 3, scaredValue: 3, favoriteColor: 'red', careAbout:['friend','sister','brother','dad','mom']},
    '0243cf5e-98d3-4e17-1234-151e8b7e2342': { age: 10, name: 'Alfred', gender: 'male', 'severity': 20, time: new Date(), sadValue: 6, scaredValue: 7, favoriteColor: 'blue' , careAbout:['friend','sister']},
    '0243cf5e-98d3-4e17-1234-151esd7e2342': { age: 10, name: 'Bob', gender: 'male', 'severity': 60, time: new Date(), sadValue: 3, scaredValue: 3, favoriteColor: 'pink' , careAbout:['brother','dad','mom']},
    '0243cf5e-98d3-4e17-1234-151e8s7e2342': { age: 6, name: 'Food', gender: 'female', 'severity': 33, time: new Date(), sadValue: 2, scaredValue: 7, favoriteColor: 'red' , careAbout:['dad','mom']},
    '0243cf5e-98d3-4e17-1234-dd1e8b7e2342': { age: 7, name: 'Fish', gender: 'female', 'severity': 28, time: new Date(), sadValue: 6, scaredValue: 6, favoriteColor: 'purple' , careAbout:['sister','brother','dad','mom']},
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
  // Assign ID
  const userId = {
    type: 'id',
    id: uuidv4(),
  }
  ws.send(JSON.stringify(userId));
  // Broadcast user count
  const queueCount = {
    type: 'updateCount',
    count: Object.keys(PENDING_USERS.queue).length,
  }
  wss.broadcast(JSON.stringify(queueCount));
  wss.broadcast(JSON.stringify(PENDING_USERS));

  // Handling incoming messages.
  ws.on('message', data => {
    const message = JSON.parse(data);
    switch (message.type) {
      case 'user':
        queueCount.count = Object.keys(PENDING_USERS.queue).length;

        if (message.sadValue) {
          message.severity = Math.round(((message.sadValue + message.scaredValue) / 14) * 100);
        } else {
          message.severity = 1;
        }
        console.log(PENDING_USERS.queue[message.userId] = message);
        console.log('added/updated user');

        wss.broadcast(JSON.stringify(PENDING_USERS));
        wss.broadcast(JSON.stringify(queueCount));
        break;
      case 'startChat':
        console.log(`Start Chat ${message.counsellorName} with ${message.id}`);
        wss.broadcast(JSON.stringify(message));
        break;
      default:
        console.log('Message not recognised:', message);
    }
  })

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    console.log('Client disconnected');
    delete PENDING_USERS.queue[userId.id]
    wss.broadcast(JSON.stringify(PENDING_USERS));
    // Broadcast new user count
    queueCount.count = Object.keys(PENDING_USERS.queue).length;
    wss.broadcast(JSON.stringify(queueCount));
  })
});