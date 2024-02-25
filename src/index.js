const {
  authRoutes,
  PostRoutes,
  commentRoutes,
  postlikeRoutes,
  followRoutes,
  messageRoutes,
  notificationRoutes
} = require('./routes');

require('dotenv').config();



const express = require('express');
const PORT = process.env.PORT || 2000;
const app = express();
const cors = require('cors');
const db = require('./models');
const bearerToken = require('express-bearer-token');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken')

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_SECRET,
  'http://localhost:2700/auth/google/callback'
);

const scopes = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'openid'
];

const authorizationUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  include_granted_scopes: true,
});

app.get('/auth/google', (req, res) => {
  res.redirect(authorizationUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    });

    const { data } = await oauth2.userinfo.get();

    if (!data.email || !data.name) {
      return res.status(403).json({ error: 'Missing email or name from Google userinfo.' });
    }
    let user = await db.User.findOne({ where: { email: data.email } });

    if (!user) {
      user = await db.User.create({
        email: data.email,
        username: data.name,
        image_url: data.picture,
        fullname: data.name,
      });
    }
    const payload = { id: user.id, username: user.username,email:user.email };
    const token = jwt.sign(payload, process.env.jwt_secret, { expiresIn: '7h' });

    res.redirect(`http://localhost:3000/login?token=${token}`);

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


//socket io
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const routers = require('./routes');
const io = new Server(server, { cors: { origin: '*' } });
global.io = io;
module.exports = { io };

const messages = [];
const notifications = []
io.on('connection', (socket) => {
  socket.emit('INIT_NOTIFICATIONS', notifications);

  socket.on('NEW_NOTIFICATION', (data) => {
    try {
      if (!data || !data.receiverId || !data.message) {
        throw new Error('Invalid notification data');
      }
      
      notifications.push(data);
      
      io.to(data.receiverId).emit('NEW_NOTIFICATION', data);
    } catch (error) {
      console.error('Error handling new notification:', error.message);
      socket.emit('ERROR_NOTIFICATION', { message: 'Failed to send notification' });
    }
  });

  socket.on('NEW_MESSAGE', (data) => {
    messages.push(data);
    io.emit('INIT_MESSAGES', messages);
  });

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
app.use('/notification', routers.notificationRoutes);
app.use('/public/avatars', express.static(`${__dirname}/public/images/avatar`));
app.use('/public/posts', express.static(`${__dirname}/public/images/post`));


server.listen(PORT, () => {
  console.log(`listen on port ${PORT}`);
  // db.sequelize.sync({ alter: true });
});

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  dialect:process.env.MYSQL_DIALECT
});


app.use((req, res, next) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting database connection:', err);
      return res.status(500).json({ error: 'Database connection error' });
    }

    req.dbConnection = connection;
    next();
  });
});

app.use((req, res, next) => {
  if (req.dbConnection) {
    req.dbConnection.release();
  }
  next();
});

