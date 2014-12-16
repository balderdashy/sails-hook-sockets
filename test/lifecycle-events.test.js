/**
 * Module dependencies
 */

var assert = require('assert');
var util = require('util');

var sails = require('sails');
var socketioClient = require('socket.io-client');
var sailsioClient = require('sails.io.js');


describe('lifecycle events', function (){

  // Used to check state below in tests
  var numTimesOnConnectTriggered = 0;
  var numTimesOnDisconnectTriggered = 0;
  var onConnectArgs;
  var onDisconnectArgs;

  // Since we have to set up a separate app instance and io instance to test this,
  // we just do that inline here
  var io;
  var app;

  before(function (done){

    // New up an instance of Sails and lift it.
    app = sails.Sails();

    app.lift({
      port: 1684,
      log: { level: 'error' },
      globals: false,
      hooks: {
        // Inject the sockets hook in this repo into this Sails app
        sockets: require('../')
      },
      loadHooks: ['moduleloader', 'userconfig', 'http', 'session', 'sockets'],
      sockets: {
        onConnect: function (session, socket) {
          numTimesOnConnectTriggered++;
          onConnectArgs = Array.prototype.slice.call(arguments);
        },
        onDisconnect: function (session, socket) {
          numTimesOnDisconnectTriggered++;
          onDisconnectArgs = Array.prototype.slice.call(arguments);
        }
      }
    },function (err) {
      if (err) return done(err);

      // Instantiate socket client.
      var client = sailsioClient(socketioClient);

      // Globalize sails.io client as `io`
      io = client;

      // Set some options.
      io.sails.url = 'http://localhost:'+1684;
      io.sails.environment = 'production'; //(to disable logging)

      return done(err);
    });
  });

  after(function (done){
    app.lower(function () {
      done();
    });
  });


  var newSocket;

  describe('when a new socket is connected', function (){

    it('should trigger onConnect lifecycle event', function (done){
      newSocket = io.sails.connect();
      newSocket.on('connect', function (){
        if (numTimesOnConnectTriggered !== 1) {
          return done(new Error('`numTimesOnConnectTriggered` should be exactly 1, but is actually '+numTimesOnConnectTriggered));
        }
        return done();
      });
    });

    it('should provide access to socket');

    it('should provide access to session');

  });

  describe('when a socket is disconnected', function (){
    it('should trigger onDisconnect lifecycle event', function (done){
      newSocket.disconnect();
      newSocket.on('disconnect', function (){
        if (numTimesOnDisconnectTriggered !== 1) {
          return done(new Error('`numTimesOnDisconnectTriggered` should be exactly 1, but is actually '+numTimesOnDisconnectTriggered));
        }
        return done();
      });
    });

    it('should provide access to socket');

    it('should provide access to session');
  });

});
