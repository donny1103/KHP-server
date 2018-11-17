const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const uuidv4 = require('uuid/v4');
const morgan = require('morgan')
const app = express();

const PORT = 9000;
// IN MEM OBJs
const PENDING_USERS = {
  '0243cf5e-98d3-4e17-1234-151e8b7ef750': { 'severity': 55 }
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

// Server Listens
app.listen(PORT);
console.log(`Server listening on port ${PORT}`);
