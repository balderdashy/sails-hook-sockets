/**
 * Module dependencies
 */

var assert = require('assert');
var util = require('util');

var _ = require('@sailshq/lodash');
var sails = require('sails');

var lifecycle = require('./helpers/lifecycle.helper');
var isProbablySocket = require('./helpers/is-probably-socket.helper');
var isProbablySession = require('./helpers/is-probably-session.helper');

describe('lifecycle events', function (){

  before(lifecycle.setup);
  after(lifecycle.teardown);

  // Used to check state below in tests
  var numTimesOnConnectTriggered = 0;
  var numTimesOnDisconnectTriggered = 0;
  var onConnectArgs;
  var onDisconnectArgs;

  var app;

  // Since we have to set up a separate app instance to test this,
  // we just do that inline here
  before(function (done){

    // New up an instance of Sails and lift it.
    app = sails.Sails();

    app.lift({
      port: 1684,
      log: { level: 'warn' },
      globals: false,
      hooks: {
        // Inject the sockets hook in this repo into this Sails app
        sockets: require('../')
      },
      loadHooks: ['moduleloader', 'userconfig', 'http', 'session', 'sockets'],
      sockets: {
        beforeConnect: function (handshake, cb) {
          if (handshake._query.reject) {
            return cb('foo', false);
          }
          if (handshake._query.error) {
            throw new Error('errored!');
          }
          numTimesOnConnectTriggered++;
          onConnectArgs = Array.prototype.slice.call(arguments);
          return cb(null, true);
        },
        afterDisconnect: function (session, socket, cb) {
          numTimesOnDisconnectTriggered++;
          onDisconnectArgs = Array.prototype.slice.call(arguments);
          return cb();
        }
      }
    },function (err) {
      if (err) { return done(err); }
      return done(err);
    });
  });

  after(function (done){
    app.lower(function () {
      return done();
    });
  });


  var newSocket;

  describe('when a new socket is connected', function (){

    it('should trigger onConnect lifecycle event', function (done){
      newSocket = io.sails.connect('http://localhost:1684', {
        multiplex: false
      });
      newSocket.on('connect', function (){
        if (numTimesOnConnectTriggered !== 1) {
          return done(new Error('`numTimesOnConnectTriggered` should be exactly 1, but is actually '+numTimesOnConnectTriggered));
        }
        return done();
      });
    });

    it('should provide access to session', function (done){
      var arg = onConnectArgs[0];
      if (!isProbablySession(arg)) {
        return done(new Error('First argument to lifecycle callback should be a session object. Instead, got:'+ util.inspect(arg, false, null)));
      }
      return done();
    });

    it('should provide access to socket', function (done){
      var arg = onConnectArgs[1];
      if (!isProbablySocket(arg)) {
        return done(new Error('Second argument to lifecycle callback should be a socket object. Instead, got:'+ util.inspect(arg, false, null)));
      }
      return done();
    });

  });

  describe('when a socket is disconnected', function (){

    it('should trigger onDisconnect lifecycle event', function (done){
      newSocket.on('disconnect', function (){
        // Wait for a little while to make sure the server had time to actually
        // run the onDisconnect lifecycle event.
        setTimeout(function (){
          if (numTimesOnDisconnectTriggered !== 1) {
            return done(new Error('`numTimesOnDisconnectTriggered` should be exactly 1, but is actually '+numTimesOnDisconnectTriggered));
          }
          return done();
        }, 1000);
      });
      newSocket.disconnect();
    });

    it('should provide access to session', function (done){
      var arg = onDisconnectArgs[0];

      if (!isProbablySession(arg)) {
        return done(new Error('First argument to lifecycle callback should be a session object. Instead, got:'+ util.inspect(arg, false, null)));
      }
      return done();
    });

    it('should provide access to socket', function (done){
      var arg = onDisconnectArgs[1];

      if (!isProbablySocket(arg)) {
        return done(new Error('Second argument to lifecycle callback should be a socket object. Instead, got:'+ util.inspect(arg, false, null)));
      }
      return done();
    });
  });

  describe('when rejecting a socket connection', function() {
    it('should trigger connect_error event', function (done){
      newSocket = io.sails.connect('http://localhost:1684?reject=true', {
        multiplex: false
      });
      newSocket.on('connect', function (){
        return done(new Error('should not have connected!'));
      });
      newSocket.on('connect_error', function (err){
        return done();
      });
    });
  });

  describe('when throwing in the `beforeConnect`', function() {
    it('should trigger connect_error event', function (done){
      newSocket = io.sails.connect('http://localhost:1684?error=true', {
        multiplex: false
      });
      newSocket.on('connect', function (){
        return done(new Error('should not have connected!'));
      });
      newSocket.on('connect_error', function (err){
        return done();
      });
    });
  });

});

if (Number(process.version.match(/^v(\d+\.\d+)/)[1]) >= 7.6) {
  describe('lifecycle events (using async/await)', function (){

    before(lifecycle.setup);
    after(lifecycle.teardown);

    // Used to check state below in tests
    var numTimesOnConnectTriggered = 0;
    var numTimesOnDisconnectTriggered = 0;
    var onConnectArgs;
    var onDisconnectArgs;

    var app;

    // Since we have to set up a separate app instance to test this,
    // we just do that inline here
    before(function (done){

      // New up an instance of Sails and lift it.
      app = sails.Sails();

      app.lift({
        port: 1684,
        log: { level: 'warn' },
        globals: false,
        hooks: {
          // Inject the sockets hook in this repo into this Sails app
          sockets: require('../')
        },
        loadHooks: ['moduleloader', 'userconfig', 'http', 'session', 'sockets'],
        sockets: {
          beforeConnect: require('./helpers/async-beforeconnect'),
          afterDisconnect: require('./helpers/async-afterdisconnect')
        }
      },function (err) {
        if (err) { return done(err); }
        return done(err);
      });
    });

    after(function (done){
      app.lower(function () {
        return done();
      });
    });


    var newSocket;

    describe('when rejecting a socket connection', function() {
      it('should trigger connect_error event', function (done){
        newSocket = io.sails.connect('http://localhost:1684?status=reject', {
          multiplex: false
        });
        newSocket.on('connect', function (){
          return done(new Error('should not have connected!'));
        });
        newSocket.on('connect_error', function (err){
          return done();
        });
      });
    });

    describe('when throwing in the `beforeConnect` function', function() {
      it('should trigger connect_error event', function (done){
        newSocket = io.sails.connect('http://localhost:1684?status=error', {
          multiplex: false
        });
        newSocket.on('connect', function (){
          return done(new Error('should not have connected!'));
        });
        newSocket.on('connect_error', function (err){
          return done();
        });
      });
    });

    describe('when throwing in the `afterDisconnect` function', function() {
      it('should not crash (but should log disconnect error to console)', function (done){
        newSocket = io.sails.connect('http://localhost:1684?status=ok&disconnect=error', {
          multiplex: false
        });
        newSocket.on('connect', function (){
          newSocket.disconnect();
          return done();
        });
        newSocket.on('connect_error', function (err){
          return done(err);
        });

      });
    });

  });
}
