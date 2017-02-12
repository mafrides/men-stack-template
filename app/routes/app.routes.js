'use strict';

var path = require('path'),
  appController = require(path.resolve('./app/controllers/app.controller'));

module.exports = function (app) {
  app.route('/').get(appController.index);
};
