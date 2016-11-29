/**
 * Module dependencies
 */

var assert = require('assert');
var util = require('util');

var _ = require('@sailshq/lodash');
var Sails = require('sails').Sails;

var isProbablySocket = require('./helpers/is-probably-socket.helper');
var isProbablySession = require('./helpers/is-probably-session.helper');

var lifecycle = require('./helpers/lifecycle.helper');


describe('without session', function (){

  before(lifecycle.setup);
  after(lifecycle.teardown);

  // Used to check state below in tests
  var numTimesOnConnectTriggered = 0;
  var numTimesOnDisconnectTriggered = 0;
  var onConnectArgs = [];
  var onDisconnectArgs = [];


  var app;

  // Since we have to set up a separate app instance to test this,
  // we just do that inline here
  before(function (done){

    // New up an instance of Sails and lift it.
    app = Sails();
    app.lift({
      port: 1685,
      log: { level: 'warn' },
      globals: false,
      hooks: {
        // Inject the sockets hook in this repo into this Sails app
        sockets: require('../')
      },
      loadHooks: ['moduleloader', 'userconfig', 'http', 'sockets'],
      sockets: {
        beforeConnect: function (handshake, cb) {
          numTimesOnConnectTriggered++;
          onConnectArgs = Array.prototype.slice.call(arguments);
          return cb(null, true);
        },
        onDisconnect: function (session, socket) {
          numTimesOnDisconnectTriggered++;
          onDisconnectArgs = Array.prototype.slice.call(arguments);
        }
      }
    },function (err) {
      if (err) return done(err);

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

    it('should not crash', function (done){
      done();
    });

    it('should trigger onConnect lifecycle event', function (done){
      newSocket = io.sails.connect('http://localhost:'+1685, {
        multiplex: false
      });
      newSocket.on('connect', function (){
        if (numTimesOnConnectTriggered !== 1) {
          return done(new Error('`numTimesOnConnectTriggered` should be exactly 1, but is actually '+numTimesOnConnectTriggered));
        }
        return done();
      });
    });

    it('should stub out an empty object for the session argument', function (done){
      var arg = onConnectArgs[0];
      if (!isProbablySession(arg)) {
        return done(new Error('First argument to lifecycle callback should be a FAKE session object. Instead, got:'+ util.inspect(arg, false, null)));
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


    it('should not crash after flinging a bunch of requests at it', function (done){

      newSocket.get('/hello');
      newSocket.get('/hello', {});
      newSocket.get('/hello', function (data, jwr){});
      newSocket.get('/hello', {}, function (data, jwr){});

      newSocket.post('/hello');
      newSocket.post('/hello', {});
      newSocket.post('/hello', function (data, jwr){});
      newSocket.post('/hello', {}, function (data, jwr){});

      newSocket.put('/hello');
      newSocket.put('/hello', {});
      newSocket.put('/hello', function (data, jwr){});
      newSocket.put('/hello', {}, function (data, jwr){});

      newSocket.delete('/hello');
      newSocket.delete('/hello', {});
      newSocket.delete('/hello', function (data, jwr){});
      newSocket.delete('/hello', {}, function (data, jwr){});

      done();
    });


    it('should respond to requests as expected', function (done){

      app.router.bind('GET /friends', function (req, res){
        res.send('yes it worked');
      });
      app.router.bind('POST /friends', function (req, res){
        // Test that res.send(), when provided an object, passes it
        // back out to the client without stringifying.
        res.send({
          id: 7,
          firstName: 'Jimmy',
          lastName: 'Findingo'
        });
      });

      newSocket.get('/friends', function (data, jwr) {
        assert.equal(jwr.statusCode, 200, 'Expected 200 status code but got '+jwr.statusCode+'\nFull JWR:'+util.inspect(jwr, false, null));
        assert.deepEqual(data, 'yes it worked');

        newSocket.post('/friends', function (data, jwr) {
          assert.equal(jwr.statusCode, 200, 'Expected 200 status code but got '+jwr.statusCode+'\nFull JWR:'+util.inspect(jwr, false, null));
          assert.deepEqual(data, {
            id: 7,
            firstName: 'Jimmy',
            lastName: 'Findingo'
          });
          done();
        });
      });

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

    it('should stub out an empty object for the session argument', function (done){
      var arg = onDisconnectArgs[0];

      if (!isProbablySession(arg)) {
        return done(new Error('First argument to lifecycle callback should be a FAKE session object. Instead, got:'+ util.inspect(arg, false, null)));
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

});
