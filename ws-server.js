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
  },
  counsellorId:''
}

// ENGAGED_USERS
ENGAGED_USERS = {};

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
wss.broadcast = (data, id, action) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {

      if (!id && !action ){
        client.send(data);
      } 

      if (client.type === id) {
        // Broadcase to client type: counsellor/users
        client.send(data);
        console.log(`Send data to ${client.type}`);
      }

      if (client.id === id && !action) {
        // Send data to specific user, mainly for sending message
        client.send(data);
        console.log(`Send data to ${client.id}`);
      } 
      
      // Broadcast to all but not this specific one
      if (action === 'excluded' && id !== client.id) {
        client.send(data);
        console.log('Excluded broadcase to', client.id)
      }
    }
  })
};

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
  };

  ws.id = userId.id;
  ws.send(JSON.stringify(userId));
  ws.send(JSON.stringify(PENDING_USERS));

  // Broadcast user count
  const queueCount = {
    type: 'updateCount',
    count: Object.keys(PENDING_USERS.queue).length,
  };

  // Handling incoming messages.
  ws.on('message', data => {
    const message = JSON.parse(data);
    switch (message.type) {
      case 'user':
        ws.type = message.type;
        queueCount.count = Object.keys(PENDING_USERS.queue).length;

        if (message.sadValue) {
          message.severity = Math.round(((message.sadValue + message.scaredValue) / 14) * 100);
        } else {
          message.severity = 1;
        }
        console.log('added/updated user',PENDING_USERS.queue[message.userId] = message);

        wss.broadcast(JSON.stringify(queueCount),'user');
        wss.broadcast(JSON.stringify(PENDING_USERS),'counsellor');
        break;
      
      // Counsellor connected
      case 'counsellor':
        ws.type = message.type;
        break;

      case 'startChat':
        let counsellorId = message.counsellor.id;
        let userId = message.id;
        console.log(`Start Chat ${message.counsellor.name} with ${userId}`);

        ENGAGED_USERS[userId] = {...PENDING_USERS.queue[userId], counsellorId}
        delete PENDING_USERS.queue[userId];
        console.log(ENGAGED_USERS);

        wss.broadcast(JSON.stringify(PENDING_USERS), 'counsellor');
        break;
      case 'toUserMsg':
        console.log('receiving msg');
        break;
      default:
        console.log('Message not recognised:', message);
    }
  });

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    console.log('Client disconnected');

    // 
    if (ws.type === 'user'){
      queueCount.count = Object.keys(PENDING_USERS.queue).length;
      Object.keys(PENDING_USERS.queue).includes(userId.id) ? 
      delete PENDING_USERS.queue[userId.id] :
      delete ENGAGED_USERS[userId.id];

      // Disconnect user
      wss.broadcast(JSON.stringify(PENDING_USERS),'counsellor');

      // Broadcast new user count
      wss.broadcast(JSON.stringify(queueCount),'user');
    }

    
  });
});