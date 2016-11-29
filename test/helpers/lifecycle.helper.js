/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var Sails = require('sails').Sails;
var sailsioClient = require('sails.io.js');


// Use a weird port to avoid tests failing if we
// forget to shut down another Sails app
var TEST_SERVER_PORT = 1577;


/**
 * @type {Object}
 */

module.exports = {

  setup: function (config, done) {

    // New up an instance of Sails and lift it.
    var app = Sails();

    if (typeof config === 'function') {
      done = config;
      config = null;
    }

    if (typeof done !== 'function') {
      throw new Error('Did not supply a callback to the lifecycle setup!');
    }

    config = config || {};

    app.lift(_.extend({
      port: TEST_SERVER_PORT,
      globals: false,
      log: { level: 'warn' },
      hooks: {
        // Inject the sockets hook in this repo into this Sails app
        sockets: require('../..')
      },
      loadHooks: ['moduleloader', 'userconfig', 'http', 'session', 'sockets'],
    }, config),function (err, sails) {
      if (err) return done(err);

      global._sails = sails;

      // Instantiate socket client.
      delete require.cache[require.resolve('socket.io-client')];
      var socketioClient = require('socket.io-client');
      var client = sailsioClient(socketioClient);

      // Globalize sails.io client as `io`
      global.io = client;

      // Set some options.
      global.io.sails.url = 'http://localhost:'+TEST_SERVER_PORT;
      global.io.sails.reconnection = false;
      global.io.sails.environment = 'production'; //(to disable logging)
      global.io.sails.multiplex = false; // (to allow for clean testing of multiple connected sockets)

      return done(err);
    });

  },



  teardown: function (done) {

    // If the socket never connected, don't worry about disconnecting
    // TODO:
    // cancel the connection attempt if one exists-
    // or better yet, extend `disconnect()` to do this
    if (global.io && global.io.socket && global.io.socket.isConnected()) {
      io.socket.disconnect();
    }
    // Disconnect socket
    setTimeout(function ensureDisconnect () {
      // Ensure socket is actually disconnected
      var isActuallyDisconnected = (global.io && global.io.socket && global.io.socket.isConnected() === false);
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
