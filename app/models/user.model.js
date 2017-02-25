'use strict';

var path = require('path'),
  mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  crypto = require('crypto'),
  validator = require('validator');

var UserSchema = new Schema({
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [
      function validateEmail (email) { return validator.isEmail(email, { require_tld: false }); },
      'Please fill a valid email address'
    ]
  },
  password: String,
  salt: String,
  roles: {
    type: [{ type: String, enum: ['user', 'admin'] }],
    default: ['user'],
  },
  created: { type: Date, default: Date.now },

  /* For reset password */
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

UserSchema.pre('save', function hashPasswordForSave (next) {
  if (this.password && this.isModified('password')) {
    this.salt = crypto.randomBytes(16).toString('base64');
    this.password = hashPassword(this.password, this.salt);
  }

  next();
});

var User = mongoose.model('User', UserSchema);

function hashPassword (password, salt) {
  return password && salt && crypto.pbkdf2Sync(password, new Buffer(salt, 'base64'), 10000, 64, 'sha1').toString('base64');
}

UserSchema.statics.authenticate = function (password, userPassword, userSalt) {
  return userPassword === hashPassword(password, userSalt);
};

module.exports = UserSchema;