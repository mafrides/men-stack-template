'use strict';

var path = require('path'),
  adminController = require(path.resolve('./app/controllers/admin.controller'));

function isAdmin (req, res, next) {
  if (req.user.roles.indexOf('admin') === -1) return next('Unauthorized');
  next();
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

  app.route('/admin/dashboard').get(isAdmin, adminController.adminDashboardPage);

  app.route('/admin/users').get(isAdmin, adminController.listUsersPage);
  app.route('/admin/users/:userId/view').get(isAdmin, adminController.viewUserPage);
  app.route('/admin/users/:userId/edit').get(isAdmin, adminController.editUserPage);
};
