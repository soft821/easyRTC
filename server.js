/**
 * @file tuber-time web server.
 * @version 2.0.0
 */

'use strict';

var easyrtc = require('easyrtc');
var express = require('express');
var fs = require('fs');
var Handlebars = require('handlebars');
var io = require('socket.io');
var nconf = require('nconf');
// Web application setup (for setting up routes)
var app = express();

/******************************/
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var User = require('./models/user');
var bcrypt = require('bcrypt');

require('dotenv').config();

var index = require('./routes/index');
var join = require('./routes/join');
var host = require('./routes/host');
var meetingRoom = require('./routes/meetingRoom');
var auth = require('./routes/auth');

// Set public folder as root
app.use(express.static(path.join(__dirname, '/public')));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view options', { layout : 'layout/main' });
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 1000 * 60 * 30
    }
}));

app.use('/', index);
app.use('/auth', auth);
app.use('/join', join);
app.use('/host', host);
app.use('/meetingRoom', meetingRoom);

// Provide access to node_modules folder
app.use('/scripts', express.static(`${__dirname}/node_modules/`));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');        
    }
    next();
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
/*************************************/
var webServer = null;

// Try to find configuring files in the following places (in order)
//   1. Command-line arguments
//   2. Environment variables
//   3. settings.json file
nconf.argv()
     .env()
     .file({ file: 'settings.json' });



// Load index.html template
var indexSource = fs.readFileSync(__dirname + '/templates/index.html', 'utf8');
var indexTmpl = Handlebars.compile(indexSource);

// Set up web servers according to configuration file

// By default, debugMode is on. Deployment requires the existence of a settings.json
// configuration file
var debugMode = nconf.get('debug');
if (debugMode === undefined) {
    debugMode = true;
}

// By default, if debugMode is enabled, AudioMeter is enabled.
var enableAudioMeter = nconf.get('enableAudioMeter');
if (enableAudioMeter === undefined) {
    if (debugMode) {
        enableAudioMeter = true;
    } else {
        enableAudioMeter = false;
    }
}

// Set up routes for static resources
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/audio', express.static(__dirname + '/public/audio'));
app.use('/images', express.static(__dirname + '/public/images'));

// Add a route for telemetry scripts
if (debugMode) {
    app.use('/telemetry', express.static(__dirname + '/public/telemetry'));
}

// Set up main index page (this changes depending on whether or not debugging is enabled in settings.json).
app.get('/easyrtc', function(req, res) {
    var pageTitle = 'ableToMeet';
    var extraScripts = '';

    // If debug mode is enabled, load our debugging script (and add [debug] in the title)
    if (debugMode) {
        pageTitle += ' [debug]';
        extraScripts = '<script type="text/javascript"  src="/telemetry/debug.js"></script>';
    }

    if (enableAudioMeter) {
        pageTitle += '+am';
        extraScripts += '<script type="text/javascript" src="/js/audiometer.js"></script>';
    }

    res.send(indexTmpl({
        title: pageTitle,
        debugBody: extraScripts
    }));
});

// By default the listening server port is 8080 unless set by nconf or Heroku
var serverPort = process.env.PORT || nconf.get('port') || 8080;

// By default, HTTP is used
var ssl = nconf.get('ssl');

if (ssl !== undefined && ssl.key !== undefined && ssl.cert !== undefined) {
    webServer = require('https').createServer(
        {
            key: fs.readFileSync(ssl.key),
            cert: fs.readFileSync(ssl.cert)
        },
        app
    ).listen(serverPort);
} else {
    webServer = require('http')
        .createServer(app)
        .listen(serverPort);
}

// Set log level according to debugMode, on production, log level is on error only
var ioOpts;
if (debugMode) {
    ioOpts = { 'log level': 3 };
} else {
    ioOpts = { 'log level': 0 };
}

var socketServer = io.listen(webServer, ioOpts);

// Set up easyrtc specific options
easyrtc.setOption('demosEnable', false);
easyrtc.setOption('updateCheckEnable', false);

// If debugMode is enabled, make sure logging is set to debug
if (debugMode) {
    easyrtc.setOption('logLevel', 'debug');
}

// Use appIceServers from settings.json if provided. The format should be the same
// as that used by easyrtc (http://easyrtc.com/docs/guides/easyrtc_server_configuration.php)
var iceServers = nconf.get('appIceServers');
if (iceServers !== undefined) {
    easyrtc.setOption('appIceServers', iceServers);
} else {
    easyrtc.setOption('appIceServers', [
        {
            url: 'stun:stun.l.google.com:19302'
        },
        {
            url: 'stun:stun.sipgate.net'
        },
        {
            url: 'stun:217.10.68.152'
        },
        {
            url: 'stun:stun.sipgate.net:10000'
        },
        {
            url: 'stun:217.10.68.152:10000'
        }
    ]);
}

easyrtc.listen(app, socketServer);
