/**
 * Module dependencies
 */

var SocketIO = require('socket.io');
var parseSdkMetadata = require('./parse-sdk-metadata');
var ToHandleNewConnection = require('./on-connect');
var ToBuildSocketsMethods = require('./sails.sockets');
var ERRORPACK = require('./errors');


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

    // Attach `getSDKMetadata` fn to `app` (sails obj)
    // for compat w/ pubsub hook
    app.getSDKMetadata = parseSdkMetadata;


    (function waitForOtherHooks(next){

      if (!app.config.hooks.http) {
        return next(ERRORPACK.HOOK_DEPENDENCY('Cannot use `sockets` hook without the `http` hook.'));
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
      if (err) return done(err);

      app.log.verbose('Preparing socket.io...');

      // Get access to the http server instance in Sails
      var sailsHttpServer = app.hooks.http.server;

      // Now start socket.io
      var io = SocketIO(sailsHttpServer, {
        // opts:
        serveClient: false
      });

      // TODO: set up configuration so that a custom npm-install-ed adapter can be used (a la the session hook)

      // TODO: apply the configured socket.io adapter here
      // var io = require('socket.io')(3000);
      // var redis = require('socket.io-redis');
      // io.adapter(redis({ host: 'localhost', port: 6379 }));

      // Expose raw `io` object from Socket.io on the `app` object (i.e. `sails`)
      app.io = io;

      // Run a piece of pre-connection socket.io middleware to authorize the socket
      io.use(function(socket, next){
        // TODO: backwards compatibility for `authorize` lifecycle callback
        // if (socket.request.headers.cookie) return next();
        // next(new Error('Authentication error'));

        // Default to `authorization: false`
        return next();
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

  };
};
