/**
 * Module dependencies
 */

var SocketIO = require('socket.io');



/**
 * Simple stub hook to implement extremely basic socket.io functionality.
 */

module.exports = function (app){
  return {


    initialize: function (done) {

      console.log('Loading stubsockets hook...');

      if (!app.config.hooks.http) {
        return done(new Error('Cannot use `stubsockets` hook without the `http` hook.'));
      }

      // If http hook is enabled, wait until the http server is configured
      // before linking the socket server to it
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




