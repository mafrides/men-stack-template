var path = require('path'),
  fs = require('fs'),
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
  mongoose = require('mongoose'),
  config = require(path.resolve('./config/config')),
  packageJSON = require(path.resolve('./package'));

// Load Models
fs.readdirSync(path.join(__dirname, 'app/models')).forEach(function loadModel (file) {
  require(path.resolve(path.join('./app/models', file)));
});

// Connect db
mongoose.connect(config.db);
var db = mongoose.connection;

// Local variables
app.locals.title = config.app.title;
app.locals.descriptions = config.app.description;
app.locals.keywords = config.app.keywords;

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
app.use('/', express.static(path.resolve('./public')));

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

// Routes (if ordering is needed, change this to use a master routes file)
fs.readdirSync(path.join(__dirname, 'app/routes')).forEach(function loadRoutes (file) {
  require(path.resolve(path.join('./app/routes', file)))(app);
});

// Errors
app.use(function (err, req, res, next) {
  if (!err) return next();

  console.error(err.stack);
  res.redirect('/server-error');
});

app.listen(config.port, config.host, function () {
  console.log('--');
  console.log(config.app.title);
  console.log(['Environment:', process.env.NODE_ENV || 'development'].join('\t\t\t'));
  console.log(['Port:', config.port].join('\t\t\t\t'));
  console.log(['Database:', config.db].join('\t\t\t'));
  console.log(['App version:', packageJSON.version].join('\t\t\t'));
});
