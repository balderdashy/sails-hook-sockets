/**
 * Module dependencies
 */

var util = require('util');
var SocketIO = require('socket.io');
var _ = require('@sailshq/lodash');
var parseSdkMetadata = require('./parse-sdk-metadata');
var ToHandleNewConnection = require('./on-connect');
var ToBuildSocketsMethods = require('./sails.sockets');
var ToPrepareAdapter = require('./prepare-adapter');
var ERRORPACK = require('./errors');
var loadSessionFromSocket = require('./load-session-from-socket');

/**
 * @param  {Sails} app
 * @return {Function}     [initialize]
 */
module.exports = function ToInitialize(app) {

  /**
   * This function is triggered when the hook is loaded.
   *
   * @param  {Function} done
   */
  return function initialize (done) {

    // Set the environment for `onConnect`
    var onConnect = ToHandleNewConnection(app);

    // Set the environment for `prepareAdapter`
    var prepareAdapter = ToPrepareAdapter(app);

    // Attach `getSDKMetadata` fn to `app` (sails obj)
    // for compat w/ pubsub hook
    app.getSDKMetadata = parseSdkMetadata;


    (function waitForOtherHooks(next){

      if (!app.hooks.http) {
        return next(ERRORPACK.DEPENDS_ON_HOOK('Cannot use `sockets` hook without the `http` hook.'));
      }

      // If http hook is enabled, wait until the http hook is loaded
      // before trying to attach the socket.io server to our underlying
      // HTTP server.
      app.after('hook:http:loaded', function (){

        // Session hook is optional.
        if (app.hooks.session) {
          return app.after('hook:session:loaded', next);
        }
        return next();
      });
    })(function whenReady (err){
      if (err) { return done(err); }

      app.log.silly('Preparing socket.io...');

      // Get access to the http server instance in Sails
      var sailsHttpServer = app.hooks.http.server;

      // Now start socket.io
      var io = SocketIO(sailsHttpServer, (function _createOptsObj() {
        var opts = {
          path: app.config.sockets.path,
          wsEngine: 'ws'
        };
        if (typeof app.config.sockets.serveClient !== 'undefined') {
          opts.serveClient = app.config.sockets.serveClient;
        }
        if (app.config.sockets.beforeConnect) {
          opts.allowRequest = function(handshake, cb) {

            // Run the configured `beforeConnect` function (either synchronously or asynchronously)
            // and handle the result.
            (function (handleBeforeConnectResult) {
              // Run the custom authorization logic.
              try {
                // If the logic is a Node async function, attach a `.catch()` to handle rejections.
                if (app.config.sockets.beforeConnect.constructor.name === 'AsyncFunction') {
                  var promise = app.config.sockets.beforeConnect(handshake, handleBeforeConnectResult);
                  // If `beforeConnect` throws an error, we'll take that as a rejection of the connection.
                  // Although we'd much rather it just call its callback than throw an error!
                  promise.catch(function(err){
                    // Socket.io expects the first argument (if any) of the callback to be a string.
                    return cb(err.toString(), false);
                  });
                }
                // Otherwise just run the synchronous function.
                else {
                  app.config.sockets.beforeConnect(handshake, handleBeforeConnectResult);
                }
              } catch (e) {
                return cb(e.toString(), false);
              }
            })(function beforeConnectResultHandler(err, allow) {
              // If authorization fails, log a message to the console.
              if (!allow) {
                var logLevel = process.env.NODE_ENV === 'production' ? 'verbose' : 'debug';
                var msg = 'A socket was rejected via the `sails.config.sockets.beforeConnect` function.\n' +
                          'It attempted to connect with headers:\n' +
                          util.inspect(handshake.headers, {depth: null});
                if (err) {
                  msg += '\nDetails: ' + util.inspect(err, {depth: null});
                }
                app.log[logLevel](msg);
              }
              // Pass the result of `beforeConnect` on to socket.io so it can accept/reject
              // the socket connection accordingly.
              return cb(err, allow);
            });

            return;
          };
        }
        if (app.config.sockets.pingTimeout) {
          opts.pingTimeout = app.config.sockets.pingTimeout;
        }
        if (app.config.sockets.pingInterval) {
          opts.pingInterval = app.config.sockets.pingInterval;
        }
        if (app.config.sockets.maxBufferSize) {
          app.log.error('`sails.config.sockets.maxBufferSize is deprecated; please use `sails.config.sockets.maxHttpBufferSize` instead.');
          opts.maxHttpBufferSize = app.config.sockets.maxBufferSize;
        }
        if (app.config.sockets.maxHttpBufferSize) {
          opts.maxHttpBufferSize = app.config.sockets.maxHttpBufferSize;
        }
        if (app.config.sockets.transports) {
          opts.transports = app.config.sockets.transports;
        }
        if (app.config.sockets.allowUpgrades) {
          opts.allowUpgrades = app.config.sockets.allowUpgrades;
        }
        if (app.config.sockets.cookie) {
          opts.cookie = app.config.sockets.cookie;
        }
        if (app.config.sockets.onlyAllowOrigins) {
          opts.origins = function(origin, cb) {
            // If the socket's origin is in the `onlyAllowOrigins` array, allow the connection to continue.
            if (_.contains(app.config.sockets.onlyAllowOrigins, origin)) {
              return cb(null, true);
            }
            // Otherwise log a console message and reject the connection by returning `false` via the callback.
            var logLevel = process.env.NODE_ENV === 'production' ? 'verbose' : 'debug';
            var msg = 'A socket was rejected via the `sails.config.sockets.onlyAllowOrigins` array.\n' +
                      'It attempted to connect with origin: ' + origin;
            app.log[logLevel](msg);
            // Tell socket.io to reject the connection.
            return cb('Origin not allowed', false);
          };
        }
        return opts;
      })());

      // Expose raw `io` object from Socket.io on the `app` object (i.e. `sails`)
      app.io = io;

      // Allow a custom npm-install-ed adapter
      // to be used (a la the session hook)
      prepareAdapter(function (err){
        if (err) { return done(err); }

        // Use pre-connection socket.io middleware to ensure that connecting sockets
        // always have at least a generated cookie.
        io.use(function(socket, next){
          loadSessionFromSocket(socket.handshake, app, function (err) {
            // If an error occurred loading the session, log what happened
            if (err) {
              app.log.verbose('\nA socket is being allowed to connect, but the session could not be loaded.  Creating an empty, one-time session to use for the life of this socket connection.\n'+
              'This log often shows up because a client socket from a previous lift or another Sails app is trying to reconnect (e.g. from an open browser tab), but the session indicated by its cookie '+
              'no longer exists-- because either this app is not currently using a persistent session store like Redis, or the session entry has been removed from the session store (e.g. by a scheduled '+
              'job or because it expired naturally).\nDetails:\n-------------------------------------------------\n',err,'\n-------------------------------------------------');
            }
            return next();
          });
        });

        // Set up event listeners each time a new socket connects
        io.on('connect', onConnect);


        // Expose low-level, generic socket methods as `sails.sockets.*`
        // (these are mostly just wrappers- but it allows us to encapsulate any churn
        //  in the underlying socket.io implementation as versions change, etc.)
        app.sockets = ToBuildSocketsMethods(app);

        // Pass control back to Sails core.
        return done();

      });

    });

  };
};
