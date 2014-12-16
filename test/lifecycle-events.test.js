/**
 * Module dependencies
 */

var assert = require('assert');
var util = require('util');


describe('lifecycle events', function (){

  var numTimesOnConnectTriggered = 0;
  var numTimesOnDisconnectTriggered = 0;
  var onConnectArgs;
  var onDisconnectArgs;

  before(function (){

    sails.config.sockets.onConnect = function (session, socket) {
      numTimesOnConnectTriggered++;
      onConnectArgs = Array.prototype.slice.call(arguments);
    };
    sails.config.sockets.onDisconnect = function (session, socket) {
      numTimesOnDisconnectTriggered++;
      onDisconnectArgs = Array.prototype.slice.call(arguments);
    };
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
