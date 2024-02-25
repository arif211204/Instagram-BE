const db = require('../models');
const Entity = require('./entity');
class Postlike extends Entity {
  constructor(model) {
    super(model);
  }

  getByUserId(req, res) {
    db.PostLike.findAll({
      include: {
        model: db.User,
        as: 'user',
        attributes: ['id', 'username', 'image_url']
      },
      where: {
        user_id: req.params.userid
      },
      order: [['createdAt', 'DESC']]
    })
      .then((result) => res.send(result))
      .catch((err) => res.status(500).send(err?.message));
  }

  getByPostId(req, res) {
    db.PostLike.findAll({
      include: {
        model: db.User,
        as: 'user',
        attributes: ['id', 'username', 'image_url']
      },
      where: {
        post_id: req.params.postid
      },
      order: [['createdAt', 'DESC']]
    })
      .then((result) => res.send(result))
      .catch((err) => res.status(500).send(err?.message));
  }

  async like(req, res) {
    try {
      const { post_id, user_id } = req.body;
    
      const post = await db.Post.findOne({ where: { id: post_id } });

      if (post) {
        const check = await db.PostLike.findOne({
          where: {
            post_id,
            user_id
          }
        });

        if (check) {
          await db.PostLike.destroy({
            where: {
              post_id,
              user_id
            }
          });
        } else {
          await db.PostLike.create(req.body);
        
          await db.Notification.create({
            user_sender_id: user_id,
            user_receiver_id: post.user_id,
            type: 'like'
          });
        }
        io.to(post.user_id).emit('NEW_NOTIFICATION',
        { message: 'Someone liked your post!' });

        req.params.postid = post_id;
        this.getByPostId(req, res);
      } else {
        res.status(404).send('Posts not found');
      }
    } catch (err) {
      res.status(500).send(err?.message);
    }
  }
}

module.exports = Postlike;
   