const db = require('../models');
const Entity = require('./entity');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const sharp = require('sharp');
const mailer = require('../lib/nodemailer');
const fs = require('fs');
const mustache = require('mustache');
const path = require('path');

class Auth extends Entity {
  constructor(model) {
    super(model);
  }
login(req, res) {
    const { user, password } = req.body;
    db.User.findOne({
      where: {
        [db.Sequelize.Op.or]: {
          email: { [db.Sequelize.Op.like]: `%${user}%` },
          username: { [db.Sequelize.Op.like]: `%${user}%` },
          
          phone_number: { [db.Sequelize.Op.like]: `%${user}%` },
        },
      },

      //select * from users where email like '%%' or username like '%%' or phone_number like '%%'
    })
      .then(async (result) => {
        console.log(
          moment(result.dataValues.suspended_date).diff(moment().format()),
          'this'
        );
        if (
          moment(result.dataValues.suspended_date).diff(moment().format()) > 0
        )
          throw new Error(
            `your account has been suspended for ${
              moment(result.dataValues.suspended_date).diff(moment().format()) /
              1000
            } sec`

          );

        const isValid = await bcrypt.compare(
          password,
          result.dataValues.password
        );
        if (!isValid) {
          if (result.dataValues.login_attempt >= 2)
            db.User.update(
              {
                login_attempt: 0,
                suspended_date: moment()
                  .add(moment.duration(30, 'second'))
                  .format(),
              },
              {
                where: {
                  id: result.dataValues.id,
                },
              }
            );
          else
            db.User.update(
              { login_attempt: result.dataValues.login_attempt + 1 },
              {
                where: {
                  id: result.dataValues.id,
                },
              }
            );
          throw new Error('wrong password');
        }
        delete result.dataValues.password;

        const payload = {
          id: result.dataValues.id,
        };

        const token = jwt.sign(payload, process.env.jwt_secret, {
          expiresIn: '1h',
        });

        return res.send({ token, user: result });
      })
      .catch((err) => {
        res.status(500).send(err?.message);
      });
  }
async register(req, res) {
    try {
      const isUserExist = await db.User.findOne({
        where: {
          [db.Sequelize.Op.or]: {
            email: { [db.Sequelize.Op.like]: `%${req.body.email}` },
            username: { [db.Sequelize.Op.like]: `%${req.body.username}` },
            phone_number: {
              [db.Sequelize.Op.like]: `%${req.body.phone_number}`,
            },
          },
        },
      });

      if (isUserExist?.dataValues?.id) {
        throw new Error('user sudah terdaftar');
      }
      req.body.password = await bcrypt.hash(req.body.password, 10);

      //  this.create(req, res);
      await db.User.create({ ...req.body }).then((user) => {
        console.log(user);
      });
      res.send('success');
    } catch (err) {
      res.status(500).send(err?.message);
    }
  }
async keepLogin(req, res) {
  try {
    const { token } = req;
    const data = jwt.verify(token, process.env.jwt_secret);
    console.log(data);
    if (!data.id) throw new Error('invalid token');

    console.log(data);

    const payload = await db.User.findOne({
      where: {
        id: data.id,
      },
    });
    delete payload.dataValues.password;

    const newToken = jwt.sign(
      { id: data.id, is_verified: payload.dataValues.is_verified },
      process.env.jwt_secret,
      {
        expiresIn: '1h',
      }
    );

    return res.send({ token: newToken, user: payload });
  } catch (err) {
    res.status(500).send(err?.message);
  }
  console.log(this.keepLogin, 'login');
}
async editProfile(req, res) {
    try {
      console.log(req.body);
      const isUserExist = await db.User.findOne({
        where: {
          [db.Sequelize.Op.or]: {
            username: req.body.username,
          },
        },
      });

      if (req?.file?.filename) req.body.image_url = req.file.filename;
      else delete req.body.image_url;

      if (isUserExist?.dataValues?.id != req.params.id && isUserExist) {
        throw new Error('username sudah terdaftar');
      }
      this.updateById(req, res);
    } catch (err) {
      res.status(500).send(err?.message);
    }
  }
async blopUploader(req, res) {
 if (req.file) {
      req.body.image_blob = await sharp(req.file.buffer).png().toBuffer();
      req.body.image_url = req.file.originalname;
      db.User.update(req.body, {
        where: {
          id: req.body.id,
        },
      });
    }
    res.send('testing');
  }
  async renderImage(req, res) {
    const { username, image_name } = req.query;
    db.User.findOne({
      where: {
        username,
        image_url: image_name,
      },
    })
      .then((result) => {
        res.set('Content-type', 'image/png');
        res.send(result.dataValues.image_blob);
      })
      .catch((err) => {
        res.status(500).send(err?.message);
      });
  }

  async resendVerification(req, res) {
    const { id } = req.params;
    const user = await db.User.findOne({
      where: {
        id,
      },
    });
    const template = fs
      .readFileSync(__dirname + '/../template/verify.html')
      .toString();

    const token = jwt.sign(
      {
        id: user.dataValues.id,
        is_verified: user.dataValues.is_verified,
      },
      process.env.jwt_secret,
      {
        expiresIn: '5min',
      }
    );
    const rendered = mustache.render(template, {
      username: user.dataValues.username,
      fullname: user.dataValues.fullname,
      verify_url: process.env.verified_url + token,
    });

    await mailer({
      subject: 'User Verification',
      html: rendered,
      // to: 'nashrullah2344@gmail.com',
      to: user.dataValues.email,
    });
    res.send('verification has been sent');
  }

  async verifyUser(req, res) {
    try {
      const { token } = req.query;
      const payload = jwt.verify(token, process.env.jwt_secret);

      if (payload.is_verified) throw new Error('user already verified');
      await db.User.update(
        {
          is_verified: true,
        },
        {
          where: {
            id: payload.id,
          },
        }
      );
      res.send('user has been verified');
    } catch (err) {
      res.status(500).send(err?.message);
    }
  }

  getByUsername(req, res) {
    const { username } = req.params;
    db.User.findOne({
      attributes: { exclude: ['password'] },
      include: [
        { model: db.Post, as: 'posts' },
        {
          model: db.Follow,
          as: 'followed_users',
          require: false,
          include: {
            model: db.User,
            as: 'followed_users',
            attributes: { exclude: ['password'] },
            where: {
              username,
            },
          },
        },
        {
          model: db.Follow,
          as: 'following_users',
          require: false,
          include: {
            model: db.User,
            as: 'following_users',
            attributes: { exclude: ['password'] },
            where: {
              username,
            },
          },
        },
      ],
      where: {
        username,
      },
    })
      .then((result) => res.send(result))
      .catch((err) => res.status(500).send(err?.message));
  }
  getLikeUsername(req, res) {
    const { username } = req.query;
    db.User.findAll({
      where: {
        username: { [db.Sequelize.Op.like]: `%${username}%` },
      },
    })
      .then((result) => res.send(result))
      .catch((err) => res.status(500).send(err?.message));
  }
  async forgotPassword(req, res) {
    try {
      const { email } = req.query;
      const user = await db.User.findOne({
        where: {
          email,
        },
      });
      const token = jwt.sign(
        {
          email,
        },
        process.env.jwt_secret,
        {
          expiresIn: '2min',
        }
      );
      if (user) {
        db.User.update(
          {
            forgot_token: token,
          },
          {
            where: {
              id: user.dataValues.id,
            },
          }
        );
      } else {
        throw new Error('user not found');
      }

      const template = fs
        .readFileSync(__dirname + '/../template/forgot.html')
        .toString();

      const rendered = mustache.render(template, {
        username: user.dataValues.username,
        fullname: user.dataValues.fullname,
        forgot_password_url: process.env.reset_url + token,
      });

      mailer({
        subject: 'RESET PASSWORD',
        html: rendered,
        // to: 'nashrullah2344@gmail.com',
        to: user.dataValues.email,
      });

      res.send('check your email');
    } catch (err) {
      res.status(500).send(err?.message);
    }
  }
  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;
      console.log(password);
      const payload = jwt.verify(token, process.env.jwt_secret);
      const user = await db.User.findOne({
        where: {
          email: payload.email,
          forgot_token: token,
        },
      });
      if (user) {
        if (!user.dataValues.forgot_token) throw new Error('');
        const hashedpassword = await bcrypt.hash(password, 10);
        db.User.update(
          {
            forgot_token: '',
            password: hashedpassword,
          },
          {
            where: {
              id: user.dataValues.id,
            },
          }
        );
      } else {
        throw new Error('user not found');
      }

      res.send('success');
    } catch (err) {
      res.status(500).send(err?.message);
    }
  }
}

module.exports = Auth;
