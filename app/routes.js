'use strict';

var path = require('path');

module.exports = function (app) {
  require(path.resolve('./app/routes/public.routes'))(app);
  require(path.resolve('./app/routes/auth.routes'))(app);
  require(path.resolve('./app/routes/user.routes'))(app);
  require(path.resolve('./app/routes/admin.routes'))(app);
};
