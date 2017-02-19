'use strict';

var path = require('path'),
  async = require('async'),
  mongoose = require('mongoose'),
  config = global.config,
  utils = require(path.resolve('./config/utils')),
  UserSchema = require(path.resolve('./app/models/user.model')),
  User = mongoose.model('User');

// req.body = { currentPassword: String, verifyPassword: String, newPassword: String }
exports.changePassword = function changePassword (req, res, next) {
  async.waterfall([
    function validateParams (next) {
      if (!req.user) return next('User is not signed in');
      if (!req.body) return next('Please provide password data');
      if (!req.body.newPassword) return next('Please provide a new password');

      return next();
    },
    function lookUpUser (next) {
      // not .lean() to take advantage of presave password validators
      User.findById(req.user._id).select({
        email: true,
        password: true,
        salt: true
      }).exec(next);
    },
    function savePassword (user, next) {
      if (!user) return next('User not found');
      if (!UserSchema.statics.authenticate(req.body.currentPassword, user.password, user.salt)) return next('Current password is incorrect');
      if (req.body.newPassword !== req.body.verifyPassword) return next('Passwords do not match');

      user.password = req.body.newPassword;

      user.save(function onSave (err) { next(err, user); });
    },
    function login (user, next) {
      req.login(user, function (err) { next(err); });
    }
  ], function onChangePassword (err) {
    if (err) {
      return res.status(400).send({
        message: utils.getErrorMessage('Password changed successfully')
      });
    }

    res.send('Password changed successfully');
  });
};

// user self-update
// req.body = param list below (unsets empty fields; sets filled fields)
// does not return updated user object
exports.editProfile = function editProfile (req, res) {
  async.waterfall([
    function checkForUser (next) {
      if (!req.user) return next('User is not signed in');
      return next();
    },
    function buildUpdate (next) {
      // For security purposes only merge these parameters
      next(null, [
        'firstName',
        'lastName',
      ].reduce(function updateParam (acc, param) {
        if (req.body[param] || req.body[param] === 0) {
          acc.$set[param] = req.body.param;
        } else {
          acc.$unset[param] = true;
        }

        return acc;
      }, { $set: {}, $unset: {} }));
    },
    function updateUser (update, next) {
      var unsets = Object.keys(update.$unset).length,
        sets = Object.keys(update.$set).length;

      if (!sets && !unsets) return next();
      if (!unsets) delete update.$unset;

      User.update({ _id: req.user._id }, update).exec(next);
    }
  ], function onSave (err) {
    if (err) {
      return res.status(400).send({
        message: utils.getErrorMessage(err)
      });
    }

    res.json({ success: true });
  });
};

// get user info for user
exports.me = function me (req, res) {
  var user = req.user || {};

  res.json({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email
  });
};

exports.editProfilePage = function editProfilePage (req, res) {
  res.render(path.resolve('./app/views/user/edit-profile.view.html'));
};

exports.changePasswordPage = function changePasswordPage (req, res) {
  res.render(path.resolve('./app/views/user/change-password.view.html'));
};
