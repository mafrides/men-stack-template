'use strict';

var path = require('path'),
  adminController = require(path.resolve('./app/controllers/admin.controller'));

function isAdmin (req, res, next) {
  return req.user.roles.indexOf('admin') !== -1;
}

module.exports = function (app) {
  app.route('/api/users')
    .get(isAdmin, adminController.listUsers);

  app.route('/api/users/:userId')
    .get(isAdmin, adminController.getUser)
    .put(isAdmin, adminController.updateUser)
    .delete(isAdmin, adminController.deleteUser);

  app.route('/api/users/:userId/changePassword')
    .put(isAdmin, adminController.changeUserPassword);
};
