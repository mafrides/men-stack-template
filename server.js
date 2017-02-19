'use strict';

var path = require('path'),
  fs = require('fs'),
  config = require(path.resolve('./config/config')),
  mongoose = require('mongoose'),
  express = require('express'),
  app = express(),
  compress = require('compression'),
  morgan = require('morgan'),
  bowser = require('bowser'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  cookieParser = require('cookie-parser'),
  ejs = require('ejs'),
  helmet = require('helmet'),
  session = require('express-session'),
  MongoStore = require('connect-mongo')(session),
  passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  packageJSON = require(path.resolve('./package'));

// Global variables
global.config = config;

// Local variables
app.locals.title = config.app.title;
app.locals.description = config.app.description;
app.locals.keywords = config.app.keywords;

// Load Models
fs.readdirSync(path.join(__dirname, 'app/models')).forEach(function loadModel (file) {
  require(path.resolve(path.join('./app/models', file)));
});

// Connect db
mongoose.connect(config.db);
var db = mongoose.connection;

// Compression (above express static)
app.use(compress({
  filter: function (req, res) {
    return (/json|text|javascript|css|font|svg/).test(res.getHeader('Content-Type'));
  },
  level: 9
}));

// Server Logging
morgan.token('req-user', function (req, res) {
  return req.user && req.user.email || 'No User';
});

morgan.token('browser', function (req, res) {
  if (!req.headers || !req.headers['user-agent']) return 'Unknown User Agent';

  var browserObj = bowser._detect(req.headers['user-agent']),
    operatingSystem = browserObj.android ? 'Android' : browserObj.iosdevice ? 'iPhone/iPad' : browserObj.mac ? 'Mac' : browserObj.xbox ? 'xbox' : browserObj.windows ? 'Windows' : browserObj.linux ? 'Linux' : 'Unknown OS';
  return [browserObj.name, browserObj.version, 'on', operatingSystem, browserObj.mobile ? 'mobile' : '', browserObj.tablet ? 'tablet' : ''].join(' ');
});

var logger = morgan(':req-user - :method :url :status :response-time ms length(:res[content-length]) :browser'),
  excludeFromLogRegex = /(?:\.(?:png|jpg|gif|jpeg|js|json|css|less|html|woff|woff2|eot|ttf|map)|&|&amp;|%3E)$/i,
  filteredLogger = function filteredLogger (req, res, next) {
    return excludeFromLogRegex.test(req.path) ? next() : logger(req, res, next);
  };

app.use(filteredLogger);

// Parsing (body parser must be above methodOverride)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(methodOverride());
app.use(cookieParser());

// Views
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);

// Security
app.disable('x-powered-by');
app.use(helmet());

// Static files
app.use('/', express.static(path.resolve('./pages/public')));

// Session
app.use(session({
  saveUninitialized: true,
  resave: true,
  secret: config.sessionSecret,
  cookie: {
    maxAge: config.sessionCookie.maxAge,
    httpOnly: config.sessionCookie.httpOnly,
    secure: config.sessionCookie.secure && config.secure.ssl
  },
  key: config.sessionKey,
  store: new MongoStore({
    mongooseConnection: db,
    collection: config.sessionCollection
  })
}));

// Passport
var UserSchema = require(path.resolve('./app/models/user.model')),
  User = mongoose.model('User'),
  ObjectId = mongoose.Types.ObjectId;

passport.serializeUser(function (user, done) {
  done(null, user._id);
});

passport.deserializeUser(function (id, done) {
  User.findOne({ _id: id }).select({ password: false, salt: false }).lean().exec(function (err, user) {
    if (user) user._id = new ObjectId(user._id);
    done(err, user);
  });
});

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, function (email, password, done) {
  User.findOne({ email: email && email.toString().toLowerCase() }).lean().exec(function (err, user) {
    if (err) return done(err);

    if (!user || !UserSchema.statics.authenticate(password, user.password, user.salt)) {
      return done(null, false, {
        message: 'Invalid email or password'
      });
    }

    return done(null, user);
  });
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(function addLoggedInTokenToViews (req, res, next) {
  res.locals.loggedIn = !!req.user;
  next();
});

// Routes
require(path.resolve('./app/routes'))(app);

// Errors
app.use(function handle500 (err, req, res, next) {
  console.error(err.stack);

  res.status(500).render(path.resolve('./app/views/error/500'), {
    error: 'Oops! Something went wrong...'
  });
});

app.use(function handle404 (req, res, next) {
  res.status(404).format({
    'text/html': function () {
      res.render(path.resolve('./app/views/error/404.view.html'), {
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
});

app.listen(config.port, config.host, function () {
  console.log('--');
  console.log(config.app.title);
  console.log(['Environment:', process.env.NODE_ENV || 'development'].join('\t\t\t'));
  console.log(['Port:', config.port].join('\t\t\t\t'));
  console.log(['Database:', config.db].join('\t\t\t'));
  console.log(['App version:', packageJSON.version].join('\t\t\t'));
});
