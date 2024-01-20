const express = require('express');
const authController = require('../controllers/authController');
const { userValidationRules, validate } = require('../middlewares/validator');
const { body } = require('express-validator');
const { fileUploader, blobUploader } = require('../middlewares/multer');
// const { body } = require('express-validator');
const route = express.Router();

route.get('/', authController.getAll.bind(authController));
route.get('/render', authController.renderImage.bind(authController));
route.get(
  '/username/:username',
  authController.getByUsername.bind(authController)
);
route.get('/token', authController.keepLogin.bind(authController)); ///keep login

route.get('/username2', authController.getLikeUsername.bind(authController));

route.get('/:id', authController.getById.bind(authController));

route.delete('/:id', authController.deleteById.bind(authController));
route.patch(
  '/:id',
  fileUploader({
    destinationFolder: 'avatar',
    prefix: 'AVATAR',
    filetype: 'image',
  }).single('image'),
  authController.editProfile.bind(authController)
);
//register2
route.post(
  '/v1',
  userValidationRules(),
  validate,
  authController.register.bind(authController)
); 
route.post('/v2', authController.login.bind(authController)); //login
route.post(
  '/test',
  blobUploader({
    filetype: 'image',
  }).single('image'),
  authController.test.bind(authController)
);

route.post(
  '/resend/:id',
  authController.resendVerification.bind(authController)
);
route.post('/reset/token', authController.forgotPassword.bind(authController));
route.post(
  '/reset/password',
  authController.resetPassword.bind(authController)
);

route.post('/verify/token', authController.verifyUser.bind(authController));

route.post('/v3', authController.loginWithGoogle.bind(authController));

module.exports = route;
