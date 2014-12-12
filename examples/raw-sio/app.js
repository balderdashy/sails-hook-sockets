/**
 * Module dependencies
 */

var SocketIO = require('socket.io');
var Sails = require('sails').Sails;


//
// This is a low-level implementation of Socket.io 1.x on top of
// bare-bones Sails (i.e. w/o the current built-in socket support).
//
// This example exists in order to have a sane testing ground while
// working on SIO1.0 support in the `sockets` hook in Sails core.
//




// Load up a quick sails app to serve static files
// (and be our friendly neighborhood HTTP server)
var app = Sails();
app.load({
  globals: false,
  log: { level: 'silent' },
  paths: {
    public: __dirname
  },
  loadHooks: ['moduleloader', 'userconfig', 'http']
}, function (err){
  if (err) {
    console.error('Encountered error while trying to load Sails:', err);
    return;
  }

  console.log('Sails loaded successfully.');

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

    // Bind a dummy event listener
    socket.on('example', function (data, cb){
      console.log('Received `example` message w/ args: ',arguments);

      var dataToSendBack = {
        some_things: [{
          stuff: {
            more: 'stuff'
          }
        }]
      };
      cb(dataToSendBack);
    });


    // return sails.io.nsps['/'].adapter.rooms[roomName];

    // Bind disconnect handler
    socket.on('disconnect', function(){
      console.log('user disconnected');
    });
  });

  // Now tell sails to start listening on a port
  app.initialize(function (err){
    if (err) {
      console.error('Encountered error while trying to lift:', err);
      return;
    }

    console.log('Lifted successfully');
    console.log('View example at http://localhost:1337/sandbox.html');
  });


});

