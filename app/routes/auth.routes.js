'use strict';

var path = require('path'),
  authController = require(path.resolve('./app/controllers/auth.controller'));

module.exports = function (app) {
  app.route('/api/auth/signup').post(authController.signup);
  app.route('/api/auth/signin').post(authController.signin);
  app.route('/api/auth/signout').get(authController.signout);
  app.route('/api/auth/forgot').post(authController.forgotPassword);
  app.route('/api/auth/reset/:token').get(authController.validatePasswordResetToken);
  app.route('/api/auth/reset/:token').post(authController.resetPassword);

  app.route('/auth/signup').get(authController.signupPage);
  app.route('/auth/signin').get(authController.signinPage);
  app.route('/auth/password/forgot').get(authController.forgotPasswordPage);
  app.route('/auth/password/reset/invalid').get(authController.passwordResetInvalidPage);
  app.route('/auth/password/reset/:token').get(authController.passwordResetPage);
};
