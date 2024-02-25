'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Notification.belongsTo(models.User, {
        as: 'sender',
        foreignKey: 'user_sender_id'
    });
    Notification.belongsTo(models.User, {
        as: 'received',
        foreignKey: 'user_receiver_id'
    });
    Notification.belongsTo(models.Post, {
      as: 'post',
      foreignKey: 'post_id'
    });
    Notification.belongsTo(models.PostLike, {
      as: 'postLike',
      foreignKey: 'post_likes_id'
    });
  }
  }
  
  Notification.init(
    {
      type: {
        type: DataTypes.ENUM('like', 'comment', 'follow'),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Notification'
    }
  );
  
  return Notification;
};
