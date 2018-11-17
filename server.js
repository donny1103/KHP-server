const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const uuidv4 = require('uuid/v4');
const morgan = require('morgan')
const app = express();

const PORT = 9000;
// IN MEM OBJs
const PENDING_USERS = {
  '0243cf5e-98d3-4e17-1234-151e8b7ef750': { age: 5, name: 'Raymond', 'severity': 55, time: new Date() },
  '0243cf5e-98d3-4e17-1234-151e8b7e2323': { age: 8, name: 'Donny', 'severity': 100, time: new Date() },
  '0243cf5e-98d3-4e17-1234-151e8b7e2342': { age: 10, name: 'Alfred', 'severity': 20, time: new Date() },
  '0243cf5e-98d3-4e17-1234-151esd7e2342': { age: 10, name: 'Bob', 'severity': 60, time: new Date() },
  '0243cf5e-98d3-4e17-1234-151e8s7e2342': { age: 6, name: 'Food', 'severity': 33, time: new Date() },
  '0243cf5e-98d3-4e17-1234-dd1e8b7e2342': { age: 7, name: 'Fish', 'severity': 28, time: new Date() },
}

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());

// GET routes
app.get('/userid', (req, res) => {
  data = {userId: uuidv4()};
  res.json(data);
})

app.get('/pendingusers', (req, res) => {
  res.json(PENDING_USERS);
})

// POST routes
app.post('/user', (req, res) => {
  console.log(req.body);
  user = req.body;
  PENDING_USERS[user.userId] = user
  res.send()
});

// DELETE routes
app.delete('/user', (req, res) => {
  delete PENDING_USERS[req.body.id]
  res.status(200).send()
})

// Server Listens
app.listen(PORT);
console.log(`Server listening on port ${PORT}`);
