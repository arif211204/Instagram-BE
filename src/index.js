const {
  authRoutes,
  PostRoutes,
  commentRoutes,
  postlikeRoutes,
  followRoutes,
  messageRoutes,
} = require('./routes');

require('dotenv').config();



const express = require('express');
const PORT = process.env.PORT || 2000;
const app = express();
const cors = require('cors');
const db = require('./models');
const bearerToken = require('express-bearer-token');
const mysql = require('mysql');
const bodyParser = require('body-parser');


//////////////////////////////////////////////////////////////




//////////////////////////////////////////////////////////////
const options = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password',
  database: 'instagram',
};

//socket io
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const routers = require('./routes');
const io = new Server(server, { cors: { origin: '*' } });
global.io = io;
module.exports = { io };

const messages = [];
io.on('connection', (socket) => {
  console.log('user connected');

  socket.on('NEW_MESSAGE', (data) => {
    // Assuming 'messages' is an array defined outside this function
    messages.push(data);
    io.emit('INIT_MESSAGES', messages); // Emit the updated message to all connected clients
  });

  // Send messages on user connection
  socket.emit('INIT_MESSAGES', messages);
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(bearerToken());
app.use(bodyParser.json());
app.use('/auth', authRoutes);
app.use('/posts', PostRoutes);
app.use('/comments', commentRoutes);
app.use('/postlike', postlikeRoutes);
app.use('/follows', followRoutes);
app.use('/messages', messageRoutes);
app.use('/video', routers.videoRoutes);
app.use('/videolike', routers.videolikeRoutes);
app.use('/videocomment', routers.videocommentRoutes);

app.use('/public/avatars', express.static(`${__dirname}/public/images/avatar`));
app.use('/public/posts', express.static(`${__dirname}/public/images/post`));

app.get(
  '/udin',
  (req, res, next) => {
    res.send('udin');
    next();
  },
  (req, res) => {
    res.send('udin2');
  }
);

server.listen(PORT, () => {
  console.log(`listen on port ${PORT}`);
  // db.sequelize.sync({ alter: true });
});
const connection = mysql.createConnection(options);

async function connectToDatabase() {
  try {
    await connection.connect();
    console.log('connecting to the database');
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }
}

connectToDatabase();
console.log(options);