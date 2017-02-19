'use strict';

var path = require('path'),
  mongoose = require('mongoose'),
  async = require('async'),
  utils = require(path.resolve('./config/utils')),
  UserSchema = require(path.resolve('./app/models/user.model')),
  User = mongoose.model('User');

exports.getUser = function getUser (req, res) {
  User.findById(req.params.userId).select({
    salt: false,
    password: false
  }).lean().exec(function (err, user) {
    if (err || !user) {
      return res.status(400).send({
        message: utils.getErrorMessage(err ? err : new Error('Failed to load user ' + req.params.userId))
      });
    }

    res.json(user);
  });
};

exports.updateUser = function updateUser (req, res) {
  async.waterfall([
    function buildUpdate (next) {
      // For security purposes only merge these parameters
      next(null, [
        'firstName',
        'lastName',
        'roles'
      ].reduce(function updateParam (acc, param) {
        if (req.body[param] || req.body[param] === 0) {
          acc.$set[param] =
            param === 'roles' || !Array.isArray(req.body[param]) ? req.body[param].toString().split(',').map(function trim (role) { return role.trim(); }) :
            req.body[param];
        } else {
          if (param !== 'roles') acc.$unset[param] = true;
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

exports.deleteUser = function deleteUser (req, res) {
  mongoose.model('User').remove({ _id: req.params.userId }, function onRemove (err) {
    if (err) {
      return res.status(400).send({
        message: utils.getErrorMessage(err)
      });
    }

    res.json({ success: true });
  });
};

exports.listUsers = function listUsers (req, res) {
  User.find({}).select({
    salt: false,
    password: false
  }).lean().exec(function (err, users) {
    if (err) {
      return res.status(400).send({
        message: utils.getErrorMessage(err)
      });
    }

    res.json(users);
  });
};

exports.changeUserPassword = function changeUserPassword (req, res) {
  async.waterfall([
    function validateParams (next) {
      if (!req.body || !req.body.newPassword) return next('No new password sent');
      next();
    },
    function lookUpUser (next) {
      User.findOne({ _id: req.params.userId }, { password: true }).exec(next);
    },
    function saveUser (user, next) {
      if (!user) return next('User is not found');

      user.password = req.body.newPassword;
      user.save(function onSave (err) { next(err); });
    }
  ], function onChange (err) {
    if (err) {
      return res.status(400).send({
        message: utils.getErrorMessage(err)
      });
    }

    res.send('Password changed successfully');
  });
};

exports.listUsersPage = function listUsersPage (req, res) {

};

exports.createUserPage = function createUserPage (req, res) {

};

exports.viewUserPage = function viewUserPage (req, res) {

};

exports.editUserPage = function editUserPage (req, res) {

};
