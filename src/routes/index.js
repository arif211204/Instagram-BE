const authRoutes = require('./auth');
const PostRoutes = require('./post');
const commentRoutes = require('./comment');
const postlikeRoutes = require('./postlike');
const followRoutes = require('./follow');
const messageRoutes = require('./message');
const videoRoutes = require("./video")
const videolikeRoutes = require ("./videolike")
const videocommentRoutes = require("./videocomment")
const notificationRoutes = require('./notification')

const routers = {
 authRoutes,
 PostRoutes,
 commentRoutes,
 postlikeRoutes,
 followRoutes,
 messageRoutes,
 videoRoutes,
 videolikeRoutes,
 videocommentRoutes,
 notificationRoutes

};

module.exports = routers;
