/**
 * Module dependencies
 */

var SocketIO = require('socket.io');
var receiveIncomingSailsIOMsg = require('./receive-incoming-sails-io-msg');


/**
 * @param  {Sails} app
 * @return {Function}     [initialize]
 */
module.exports = function toInitialize(app) {

  /**
   * This function is triggered when the hook is loaded.
   *
   * @param  {Function} done
   */
  return function initialize (done) {

    if (!app.config.hooks.http) {
      return done(new Error('Cannot use `sockets` hook without the `http` hook.'));
    }

    // If http hook is enabled, wait until the http hook is loaded
    // before trying to attach the socket.io server to our underlying
    // HTTP server.
    app.after('hook:http:loaded', function () {

      // Get access to the http server instance in Sails
      var sailsHttpServer = app.hooks.http.server;

      // Now start socket.io
      var io = SocketIO(sailsHttpServer, {
        // opts:
        serveClient: false
      });


      // Set up socket middleware to authorize the socket
      // io.use(function(socket, next){
      //   if (socket.request.headers.cookie) return next();
      //   next(new Error('Authentication error'));
      // });

      // Set up event listeners each time a new socket connects
      io.on('connect', function(socket){
        console.log('a user-agent connected');

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
              eventName: eventName
            }, undefined, {
              log: app.log,
              app: app,
              socket: socket
            });
          });
        });

        // Bind disconnect handler
        socket.on('disconnect', function(){
          console.log('a user-agent disconnected');
        });
      });

    });

    return done();
  };
};
