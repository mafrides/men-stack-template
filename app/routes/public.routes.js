'use strict';

var path = require('path'),
  publicController = require(path.resolve('./app/controllers/public.controller'));

module.exports = function (app) {
  app.route('/').get(publicController.home);
};
