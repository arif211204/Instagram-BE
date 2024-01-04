'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'production';

// Load your environment variables here
const database = process.env.db_database;
const username = process.env.db_username;
const password = process.env.db_password;
const host = process.env.db_host;
const port = process.env.db_port;

const config = {
  database,
  username,
  password,
  host,
  port,
  dialect: 'mysql',
};

const db = {};

const sequelize = new Sequelize(config);

fs.readdirSync(__dirname)
  .filter(
    (file) =>
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
  )
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.Video = require("./video")(sequelize, Sequelize)
db.VideLike = require("./videolike")(sequelize, Sequelize)
db.VideoComment = require("./videocomment")(sequelize, Sequelize)

module.exports = db;
