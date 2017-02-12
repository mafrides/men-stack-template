'use strict';

module.exports = {
  port: process.env.PORT || 8443,
  host: process.env.HOST || '0.0.0.0',
  db: process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb://localhost/admin'
};