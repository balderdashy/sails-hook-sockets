/**
 * Module dependencies
 */

var Sails = require('sails').Sails;
var socketioClient = require('socket.io-client');
var sailsioClient = require('sails.io.js');


// Use a weird port to avoid tests failing if we
// forget to shut down another Sails app
var TEST_SERVER_PORT = 1577;


/**
 * @type {Object}
 */

module.exports = {

  setup: function (done) {

    // New up an instance of Sails and lift it.
    var app = Sails();

    app.lift({
      port: TEST_SERVER_PORT,
      globals: false,
      log: { level: 'warn' },
      hooks: {
        // Inject the sockets hook in this repo into this Sails app
        sockets: require('../..')
      },
      loadHooks: ['moduleloader', 'userconfig', 'http', 'session', 'sockets']
    },function (err, sails) {
      if (err) return done(err);

      global._sails = sails;

      // Instantiate socket client.
      var client = sailsioClient(socketioClient);

      // Globalize sails.io client as `io`
      global.io = client;

      // Set some options.
      global.io.sails.url = 'http://localhost:'+TEST_SERVER_PORT;
      global.io.sails.environment = 'production'; //(to disable logging)
      global.io.sails.multiplex = false; // (to allow for clean testing of multiple connected sockets)

      // (Our app is already globalized as `sails` since we didn't disable
      //  globals in the options above.)

      return done(err);
    });

  },



  teardown: function (done) {

    // If the socket never connected, don't worry about disconnecting
    // TODO:
    // cancel the connection attempt if one exists-
    // or better yet, extend `disconnect()` to do this
    if (!global.io || !global.io.socket || !global.io.socket.isConnected()) {
      return done();
    }

    // Disconnect socket
    io.socket.disconnect();
    setTimeout(function ensureDisconnect () {

      // Ensure socket is actually disconnected
      var isActuallyDisconnected = (global.io.socket.isConnected() === false);

      // Tear down sails server
      global._sails.lower(function (){

        // Delete globals (just in case-- shouldn't matter)
        delete global.sails;
        delete global.io;
        return done();
      });

    }, 0);
  }
};
