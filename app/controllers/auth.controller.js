'use strict';

var path = require('path'),
  async = require('async'),
  mongoose = require('mongoose'),
  nodemailer = require('nodemailer'),
  crypto = require('crypto'),
  passport = require('passport'),
  config = global.config,
  utils = require(path.resolve('./config/utils')),
  smtpTransport = nodemailer.createTransport(config.mailer.options),
  User = mongoose.model('User');

exports.signup = function signup (req, res) {
  // delete roles for security, so roles can't be self-assignedd
  if (req.body.roles) delete req.body.roles;

  async.waterfall([
    function validateParams (next) {
      if (!req.body.email) return next('Email required');
      if (!req.body.password) return next('Password required');

      next();
    },
    function createUser (next) {
      var user = new User(req.body);

      user.save(function onSave (err, newUser) {
        next(err, newUser);
      });
    },
    function login (user, next) {
      // delete for security
      user.password = undefined;
      user.salt = undefined;

      req.login(user, function (err) { return next(err, user); });
    }
  ], function (err, user) {
    if (err) {
      return res.status(400).send({
        message: utils.getErrorMessage(err)
      });
    }

    res.json(user);
  });
};

exports.signin = function signin (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    async.series([
      function login (next) {
        if (err || !user) return next(info);

        user.password = undefined;
        user.salt = undefined;

        req.login(user, next);
      }
    ], function onLogin (err) {
      if (err) {
        return res.status(400).send({
          message: utils.getErrorMessage(err)
        });
      }

      res.json(user);
    });
  })(req, res, next);
};

exports.signout = function signout (req, res) {
  req.logOut();

  req.session.destroy(function onDestroy (err) {
    if (err) utils.getErrorMessage(err);

    if (config.sessionKey) res.clearCookie(config.sessionKey);

    res.redirect('/');
  });
};

var MS_IN_HOUR = 60 * 60 * 1000;

// @param req.body.email String
exports.forgotPassword = function forgotPassword (req, res) {
  async.waterfall([
    function generateRandomToken (next) {
      crypto.randomBytes(20, function (err, buffer) {
        next(err, buffer.toString('hex'));
      });
    },
    function lookUpUserEmail (token, next) {
      if (!req.body.email) return next('Email is required');

      User.findOne({ email: req.body.email.toLowerCase() }).select({
        salt: false,
        password: false
      }).exec(function (err, user) {
        if (!user) return next('No account with that email has been found');

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + MS_IN_HOUR;

        user.save(function (err) {
          next(err, token, user);
        });
      });
    },
    function renderEmail (token, user, next) {
      var transport = config.mailer.secure ? 'https://' : 'http://';

      res.render(path.resolve('./app/email-templates/reset-password.email.html'), {
        name: user.firstName,
        appName: config.app.title,
        url: [transport + req.headers.host, 'api/auth/reset', token].join('/')
      }, function (err, emailHTML) {
        next(err, emailHTML, user);
      });
    },
    function sendResetEmail (emailHTML, user, next) {
      var mailOptions = {
        to: user.email,
        from: config.mailer.from,
        subject: 'Password Reset',
        html: emailHTML
      };

      if (config.mailer.active) {
        return smtpTransport.sendMail(mailOptions, function (err) {
          if (err) return next(err);
          next();
        });
      }
      next('Could not send mail. Mailer is not active');
    }
  ], function (err) {
    if (err) {
      return res.status(400).send({
        message: utils.getErrorMessage(err)
      });
    }

    res.json({ message: 'An email has been sent to the provided email with further instructions.' });
  });
};

// director for get request coming from password reset email
// goes to password reset page, or password invalid page
exports.validatePasswordResetToken = function validatePasswordResetToken (req, res) {
  User.count({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  }).exec(function (err, userExists) {
    if (!userExists) return res.redirect('/password/reset/invalid');

    res.redirect('/password/reset/' + req.params.token);
  });
};

// Reset password api POST route
// @params req.body { newPassword: String, verifyPassword: String }
exports.resetPassword = function resetPassword (req, res, next) {
  async.waterfall([
    function (done) {
      User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
      }).exec(function (err, user) {
        if (err || !user) {
          return res.status(400).send({
            message: utils.getErrorMessage('Password reset token is invalid or has expired.')
          });
        }

        if (req.body.newPassword !== req.body.verifyPassword) {
          return res.status(400).send({
            message: utils.getErrorMessage('Passwords do not match')
          });
        }

        user.password = req.body.newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function (err) {
          if (err) {
            return res.status(400).send({
              message: utils.getErrorMessage(err)
            });
          }

          req.login(user, function (err) {
            if (err) return res.status(400).send(err);

            // Remove sensitive data before return authenticated user
            user.password = undefined;
            user.salt = undefined;

            // TODO: this looks like an error, to have both res.json and done
            // check it out later
            res.json(user);

            done(err, user);
          });
        });
      });
    },
    function (user, done) {
      res.render(path.resolve('./app/email-templates/reset-password-confirm.email.html'), {
        name: user.firstName,
        appName: config.app.title
      }, function (err, emailHTML) {
        done(err, emailHTML, user);
      });
    },
    function sendResetEmail (emailHTML, user, done) {
      var mailOptions = {
        to: user.email,
        from: config.mailer.from,
        subject: 'Your password has been changed',
        html: emailHTML
      };

      if (config.mailer.active) {
        return smtpTransport.sendMail(mailOptions, function (err) {
          done(err, 'done');
        });
      }

      done('Could not send mail. Mailer is not active');
    }
  ], function (err) {
    if (err) return next(err);
  });
};

exports.signupPage = function signupPage (req, res) {
  res.render(path.resolve('./app/views/auth/signup.view.html'));
};

exports.signinPage = function signinPage (req, res) {
  res.render(path.resolve('./app/views/auth/signin.view.html'));
};

exports.forgotPasswordPage = function forgotPasswordPage (req, res) {
  res.render(path.resolve('./app/views/auth/forgot-password.view.html'));
};

exports.passwordResetInvalidPage = function passwordResetInvalidPage (req, res) {
  res.render(path.resolve('./app/views/auth/password-reset-invalid.view.html'));
};

exports.passwordResetPage = function passwordResetPage (req, res) {
  res.render(path.resolve('./app/views/auth/password-reset.view.html'));
};
