'use strict';

exports.error500 = function error500 (req, res) {
  res.status(500).render('app/views/error/500', {
    error: 'Oops! Something went wrong...'
  });
};

exports.error404 = function error404 (req, res) {
  res.status(404).format({
    'text/html': function () {
      res.render('app/views/error/404', {
        url: req.originalUrl
      });
    },
    'application/json': function () {
      res.json({
        error: 'Path not found'
      });
    },
    'default': function () {
      res.send('Path not found');
    }
  });
};