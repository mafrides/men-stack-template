'use strict';

var path = require('path');

exports.home = function home (req, res) {
  res.render(path.resolve('./app/views/public/home.view.html'));
};
