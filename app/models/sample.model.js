'use strict';

var path = require('path'),
  mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var TestSchema = new Schema({

});

var Test = mongoose.model('Test', TestSchema);

module.exports = TestSchema;