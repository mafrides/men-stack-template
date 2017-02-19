'use strict';

var path = require('path'),
  userController = require(path.resolve('./app/controllers/user.controller'));

function isUser (req, res, next) {
  return req.user.roles.indexOf('user') !== -1;
}

module.exports = function (app) {
  app.route('/api/users/me').get(isUser, userController.me);
  app.route('/api/users').put(isUser, userController.editProfile);
  app.route('/api/users/password').post(isUser, userController.changePassword);

  app.route('/users/edit-profile').get(isUser, userController.editProfilePage);
  app.route('/users/change-password').get(isUser, userController.changePasswordPage);
};
