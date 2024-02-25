const db = require('../models');
const Entity = require('./entity');

class Notification extends Entity {
    constructor(model) {
        super(model);
    }
   
    async getAllByReceiverId(req, res) {
      try {
        const receiverId = req.params.receiverId;
        const notifications = await db.Notification.findAll({
          where: { user_receiver_id: receiverId },
          include: [
            {
              model: db.User,
              as: 'sender',
              attributes: ['id', 'username', 'image_url']
            },
            {
              model: db.PostLike,
              as: 'postLike',
              attributes: ['post_id']
            },
            {
              model: db.Post,
              as: 'post',
              attributes: [ 'image_url']
            }
          ]
        });
    
        const formattedNotifications = notifications.map(notification => {
          const senderId = notification.sender ? notification.sender.id : null;
          const senderUsername = notification.sender ? notification.sender.username : 'Unknown';
          const senderImageUrl = notification.sender ? notification.sender.image_url : null;
          const likedPostId = notification.postLike ? notification.postLike.post_id : null;
          const likedPostImageUrl = notification.post ? notification.post.image_url : null;
          let message = `${senderUsername} liked your post`;
    
          if (notification.type === 'comment') {
            message = `${senderUsername} commented on your post`;
          }
          const postInfo = notification.type === 'like' || notification.type === 'comment' ? { id: likedPostId, image_url: likedPostImageUrl } : null;

    
          return {
            id: notification.id,
            type: notification.type,
            createdAt: notification.createdAt,
            sender: { id: senderId, username: senderUsername, image_url: senderImageUrl },
            post: postInfo,
            message: message
          };
        });
    
        res.json(formattedNotifications);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }    
}

module.exports = Notification;
