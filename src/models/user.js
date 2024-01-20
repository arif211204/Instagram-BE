'use strict';
const { Model } = require('sequelize');
const { Sequelize } = require('.');
module.exports = (sequelize, DataTypes) => {
 class User extends Model {
  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models) {
   // define association here
   User.hasMany(models.Post, {
    as: 'posts',
    foreignKey: 'user_id'
   });

   User.hasMany(models.Comment, {
    as: 'comments',
    foreignKey: 'user_id'
   });

   User.hasMany(models.Follow, {
    as: 'followed_users',
    foreignKey: 'followed_user_id'
   });
   User.hasMany(models.Follow, {
    as: 'following_users',
    foreignKey: 'following_user_id'
   });

   User.hasMany(models.Message, {
    as: 'message_senders',
    foreignKey: 'user_sender_id'
   });
   User.hasMany(models.Message, {
    as: 'message_recievers',
    foreignKey: 'user_reciever_id'
   });

   User.hasMany(models.PostLike, {
    as: 'post_likes',
    foreignKey: 'user_id'
   });
  }
 }
 User.init(
  {
   fullname: DataTypes.STRING,
   email: { type: DataTypes.STRING, unique: false, allowNull: false },
   username: { type: DataTypes.STRING, unique: false, allowNull: false },
   phone_number: { type: DataTypes.STRING, allowNull: true },
   password: DataTypes.STRING,
   image_url: DataTypes.TEXT('long'),
   uid_google: { type: DataTypes.STRING, unique: false },
   uid_facebook: { type: DataTypes.STRING, unique: false },
   bio: { type: DataTypes.STRING },
   is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
   login_attempt: DataTypes.INTEGER,
   suspended_date: {
    type: 'TIMESTAMP',
    defaultValue: sequelize.fn('NOW')
   },
   image_blob: DataTypes.BLOB('long'),
   forgot_token: { type: DataTypes.STRING, defaultValue: '' }
  },
  {
   sequelize,
   modelName: 'User',
   paranoid: true
  }
 );
 return User;
};
