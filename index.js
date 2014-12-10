/**
 * Module dependencies
 */

var SocketIO = require('socket.io');



/**
 *
 */

module.exports = function (app){
  return {


    initialize: function (done) {

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

        // Set up event listener for new connections
        io.on('connection', function(socket){
          console.log('a user connected');

          // Bind disconnect handler
          socket.on('disconnect', function(){
            console.log('user disconnected');
          });
        });
      });

      return done();

    }


  };
};




