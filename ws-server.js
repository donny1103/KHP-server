const express = require('express');
const WebSocket = require('ws');
const SocketServer = WebSocket.Server;
const uuidv4 = require('uuid/v4');
const moment = require('moment');
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
      }

      if (client.id === id && !action) {
        // Send data to specific user, mainly for sending message
        client.send(data);
      } 
      
      // Broadcast to all but not this specific one
      if (action === 'excluded' && id !== client.id) {
        client.send(data);
        console.log('Broadcase exclude:', client.id)
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

  // Assign id as a key-value pair to the socket object
  ws.id = userId.id;
  ws.send(JSON.stringify(userId));

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
        ws.send(JSON.stringify(PENDING_USERS));
        break;

      case 'startChat':
        console.log(`Start Chat ${message.counsellor.name} with ${message.userId}`);
        ENGAGED_USERS[message.userId] = {
          ...PENDING_USERS.queue[message.userId],
          userId:message.userId, 
          counsellorId: message.counsellor.id, 
          messages:[]
        };
        
        delete PENDING_USERS.queue[message.userId];
        wss.broadcast(JSON.stringify(PENDING_USERS), message.counsellor.id, 'excluded');
        wss.broadcast(JSON.stringify({
          type:'toCounsellorMsg',
          counselerId: message.counsellor.id,
          userId: message.userId,
          text: `Hi I am not sad, not the much ${message.counsellor.name}`,
          time: moment().format('h:mm:ss a')
        }), message.counsellor.id);
        break;

      case 'toUserMsg':
        if(ENGAGED_USERS[message.userId]){
          ENGAGED_USERS[message.userId].messages.push({...message});
          wss.broadcast(JSON.stringify(message), message.userId);
        }
        break;

      case 'toCounsellorMsg':
        if(ENGAGED_USERS[message.userId]){
          ENGAGED_USERS[message.userId].messages.push({...message});
          wss.broadcast(JSON.stringify(message), message.counsellorId);
        }
        break;

      default:
        console.log('Message not recognised:', message);
    }
  });

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {

    switch(ws.type){
      case 'user':
        queueCount.count = Object.keys(PENDING_USERS.queue).length;
        if (ENGAGED_USERS[userId.id].counsellorId){
          console.log('user disconect to this counsellor');
          let disconnectMsgToCounsellor = {
            type: 'disconnect',
            id: userId.id
          }
          wss.broadcast(JSON.stringify(disconnectMsgToCounsellor), ENGAGED_USERS[userId.id].counsellorId);
        }

        Object.keys(PENDING_USERS.queue).includes(userId.id) ? 
        delete PENDING_USERS.queue[userId.id] :
        delete ENGAGED_USERS[userId.id];

        // Disconnect user
        wss.broadcast(JSON.stringify(PENDING_USERS),'counsellor');
        
        // Broadcast new user count
        wss.broadcast(JSON.stringify(queueCount),'user');
        console.log('User disconnected');
        break;
      case 'counsellor':
        console.log('Counsellor disconnected');
        break;
      default:
        console.log('Disconnect type not recognised:', ws.type);
    }
  });
});