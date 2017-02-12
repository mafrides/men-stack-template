'use strict';

var path = require('path'),
  errorController = require(path.resolve('./app/controllers/error.controller'));

module.exports = function (app) {
  // 500 error
  app.route('/server-error').get(errorController.error500);

  // 404 for undefined api and static requests
  app.route('/:url(api|lib)/*').get(errorController.error404);
};
