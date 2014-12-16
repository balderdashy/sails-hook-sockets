/**
 * Module dependencies
 */

var SocketIO = require('socket.io');
var ToReceiveIncomingSailsIOMsg = require('./receive-incoming-sails-io-msg');
var parseSdkMetadata = require('./parse-sdk-metadata');


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

    // Set the environment for `receiveIncomingSailsIOMsg`
    var receiveIncomingSailsIOMsg = ToReceiveIncomingSailsIOMsg(app);

    // Attach `getSDKMetadata` fn to `app` (sails obj)
    // for compat w/ pubsub hook
    app.getSDKMetadata = parseSdkMetadata;


    (function waitForOtherHooks(next){

      if (!app.config.hooks.http) {
        return next(new Error('Cannot use `sockets` hook without the `http` hook.'));
      }

      // If http hook is enabled, wait until the http hook is loaded
      // before trying to attach the socket.io server to our underlying
      // HTTP server.
      app.after('hook:http:loaded', function (){

        // Session hook is optional.
        if (app.config.hooks.session) {
          app.after('hook:session:loaded', next);
        }
        else {
          next();
        }
      });
    })(function whenReady (err){
      if (err) return done(err);

      // Get access to the http server instance in Sails
      var sailsHttpServer = app.hooks.http.server;

      // Now start socket.io
      var io = SocketIO(sailsHttpServer, {
        // opts:
        serveClient: false
      });

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
      io.on('connect', function onSocketConnect (socket){

        // Run `onConnect` lifecycle callback
        if (app.config.sockets.onConnect) {
          if (!app.session) {
            app.config.sockets.onConnect({}, socket);
          }
          else {

            // TODO: make this work again

            // app.session.fromSocket(socket, function sessionReady (err, session) {
            //   // If an error occurred loading the session, log what happened
            //   if (err) {
            //     app.log.error(err);
            //     return;
            //   }
            //   // But continue on to run event handler either way
            //   app.config.sockets.onConnect({}, socket);

            // });
          }
        }


        // Bind socket request handlers
        // (supports sails.io clients 0.9 and up)
        (function (bindSocketRequestHandler){
          bindSocketRequestHandler('get');
          bindSocketRequestHandler('post');
          bindSocketRequestHandler('put');
          bindSocketRequestHandler('delete');
          bindSocketRequestHandler('patch');
          bindSocketRequestHandler('options');
          bindSocketRequestHandler('head');
        })(function receiveMessage(eventName){
          socket.on(eventName, function (incomingSailsIOMsg, socketIOClientCallback){
            receiveIncomingSailsIOMsg({
              incomingSailsIOMsg: incomingSailsIOMsg,
              socketIOClientCallback: socketIOClientCallback,
              eventName: eventName,
              socket: socket
            });
          });
        });

        // Bind disconnect handler
        socket.on('disconnect', function onSocketDisconnect(){

          // Configurable custom onConnect logic here
          // (default: do nothing)
          if (app.config.sockets.onDisconnect) {
            if (!app.session) {
              app.config.sockets.onDisconnect({}, socket);
            }
            else {

              // TODO: make this work again

              // app.session.fromSocket(socket, function sessionReady (err, session) {
              //   // If an error occurred loading the session, log what happened
              //   if (err) {
              //     app.log.error(err);
              //     return;
              //   }
              //   // But continue on to run event handler either way
              //   app.config.sockets.onDisconnect({}, socket);

              // });
            }
          }
        }); //</onSocketDisconnect>
      }); //</onSocketConnect>

    });

    return done();
  };
};
