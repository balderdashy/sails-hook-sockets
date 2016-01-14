/**
 * Module dependencies
 */

var util = require('util');
var assert = require('assert');
var _ = require('lodash');
var async = require('async');
var Sails = require('sails').Sails;
var SocketIORedisAdapter = require('socket.io-redis');

// TODO:
// figure out how to make this run on Travis
// (need a local redis)


describe('with redis', function (){

  // Common app config
  var appConfig = {
    log: { level: 'warn' },

    globals: false,

    hooks: {
      // Inject the sockets hook in this repo into this Sails app
      sockets: require('../')
    },

    loadHooks: ['moduleloader', 'userconfig', 'http', 'sockets'],

    // Configure the socket.io-redis adapter
    sockets: {
      adapter: 'socket.io-redis',
      adapterModule: SocketIORedisAdapter,

      // Configure port to match .travis.yml
      port: 6380,

      // Test advanced redis config: (will cause sockets hook to build raw redis clients):
      //
      // Configure password to match .travis.yml
      pass: 'secret',
      // db: 'sails'
    },

    routes: {
      // A test route which joins a room
      'PUT /testroom/join': function (req, res){
        req._sails.sockets.join(req, 'testroom', function() {
          res.send();
        });
      },

      // A test route which broadcasts a message to a room
      'POST /broadcast': function (req, res){
        var room = req.param('room') || 'testroom';
        var msg = req.param('msg') || 'HI! HI HI! HI HI!';
        var eventName = req.param('event') || 'message';
        req._sails.sockets.broadcast(room, eventName, {msg: msg});
        return res.send();
      },

      'PUT /testroom/joinPlayroom': function (req, res) {
        req._sails.sockets.addRoomMembersToRooms('testroom', 'playroom', function(err) {
          if (err) {return res.serverError(err);}
          return res.send();
        });
      },

      'PUT /testroom/leavePlayroom': function (req, res) {
        req._sails.sockets.removeRoomMembersFromRooms('testroom', 'playroom', function(err) {
          if (err) {return res.serverError(err);}
          return res.send();
        });
      },

      'PUT /leaveAllRooms': function (req, res) {
        req._sails.sockets.leaveAll('testroom', function(err) {
          if (err) {return res.serverError(err);}
          return res.send();
        });
      }


    }
  };

  // New up five instances of Sails which share the config above
  // and lift all of them (only difference is their port)
  var apps = [];
  var ports = [1600, 1601, 1602, 1603, 1604];
  before(function (done){
    async.each(ports, function (port, next){
      var app = Sails();
      apps.push(app);
      app.lift(_.extend(appConfig, {port: port}),next);
    }, done);
  });
  after(function (done){
    async.each(apps, function (app, next){
      app.lower(next);
    }, done);
  });

  describe('all apps', function (){

    describe('after each app has at least one socket connected', function (){

      var sockets = [];
      before(function (done){
        async.each(apps, function (app, next){
          var socket = io.sails.connect('http://localhost:'+app.config.port, {
            // This prevents multiple socket.io clients attempting to share
            // the same global socket (which would render this test meaningless)
            multiplex: false
          });
          sockets.push(socket);
          socket.on('connect', function(){ next(); });
        }, done);
      });
      after(function (done){
        async.each(sockets, function (socket, next){
          socket.on('disconnect', function (){ next(); });
          socket.disconnect();
        }, done);
      });

      //||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
      //
      // Note:
      //  In a multi-instance scenario, the load balancer should take care of
      //  connecting the socket to the appropriate Sails server.  This way,
      //  `beforeConnect` (and the legacy `onConnect` event handler) will only
      //  be triggered once.  This is difficult to test here w/o simulating a
      //  load balancer (which would be hand-wavy at best anyways).
      //
      //||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||



      describe('when all sockets join a room and listen for the `message` event', function (){

        before(function (done){
          async.each(sockets, function (socket, next){
            socket.on('message', function (event){
              socket._receivedMessageEvents = socket._receivedMessageEvents || [];
              socket._receivedMessageEvents.push(event);
            });
            socket.put('/testroom/join', function (data, jwr){
              if (jwr.error) return next(jwr.error);
              return next();
            });
          }, done);
        });

        describe('and then one socket broadcasts a message', function (){

          before(function (done){
            var oneSocket = sockets[0];
            oneSocket.post('/broadcast', function (data, jwr){
              if (jwr.error) return done(jwr.error);
              return done();
            });
          });

          it('all connected sockets should receive the message (even though they are connected to different instances)', function (){
            _.each(sockets, function (socket){
              assert(socket._receivedMessageEvents && socket._receivedMessageEvents.length == 1, util.format('Socket connected to app on port %d did not receive the message', socket.port));
            });
          });
        });

      });

      describe('when one socket uses `addRoomMembersToRoom` to join all members of `testroom` to `playroom`', function (){

        before(function (done) {
          sockets[0].put('/testroom/joinPlayroom', function (data, jwr) {
            if (jwr.error) {return done(jwr.error);}
            return done();
          });
        });

        describe('and all sockets listen for the `letsplay` event', function() {

          before(function (){
            _.each(sockets, function (socket){
              socket.on('letsplay', function (event){
                socket._receivedPlayEvents = socket._receivedPlayEvents || [];
                socket._receivedPlayEvents.push(event);
              });
            });
          });

          describe('and then one socket broadcasts a `letsplay` event', function (){

            before(function (done){
              var oneSocket = sockets[0];
              oneSocket.post('/broadcast', {room: 'playroom', event: 'letsplay', msg: 'PLAYTIME!'}, function (data, jwr){
                if (jwr.error) return done(jwr.error);
                return done();
              });
            });

            it('all connected sockets should receive the message (even though they are connected to different instances)', function (){
              _.each(sockets, function (socket){
                assert(socket._receivedPlayEvents && socket._receivedPlayEvents.length == 1, util.format('Socket connected to app on port %d did not receive the message', socket.port));
              });
            });
          });

        });

      });

      describe('when one socket uses `removeRoomMembersFromRoom` to remove all members of `testroom` from `playroom`', function (){

        before(function (done) {
          sockets[0].put('/testroom/leavePlayroom', function (data, jwr) {
            if (jwr.error) {return done(jwr.error);}
            return done();
          });
        });

        describe('and all sockets listen for the `letsplaymore` event', function() {

          before(function (){
            _.each(sockets, function (socket){
              socket.on('letsplaymore', function (event){
                socket._receivedPlayMoreEvents = socket._receivedPlayEvents || [];
                socket._receivedPlayMoreEvents.push(event);
              });
            });
          });

          describe('and then one socket broadcasts a `letsplaymore` event', function (){

            before(function (done){
              var oneSocket = sockets[0];
              oneSocket.post('/broadcast', {room: 'playroom', event: 'letsplaymore', msg: 'PLAYTIME!'}, function (data, jwr){
                if (jwr.error) return done(jwr.error);
                return done();
              });
            });

            it('connected sockets should not receive the message', function (){
              _.each(sockets, function (socket){
                assert(!socket._receivedPlayMoreEvents, util.format('Socket connected to app on port %d received the message', socket.port));
              });
            });
          });

        });

      });

      describe('when one socket uses `leaveAll` to remove all members of `testroom` from all rooms', function (){

        before(function (done) {
          sockets[0].put('/leaveAllRooms', function (data, jwr) {
            if (jwr.error) {return done(jwr.error);}
            return done();
          });
        });

        describe('and then one socket broadcasts a `message` event', function (){

          before(function (done){
            var oneSocket = sockets[0];
            oneSocket.post('/broadcast', function (data, jwr){
              if (jwr.error) return done(jwr.error);
              return done();
            });
          });

          it('connected sockets should not receive the message', function (){
            _.each(sockets, function (socket){
              assert(!(socket._receivedMessageEvents && socket._receivedMessageEvents.length == 2), util.format('Socket connected to app on port %d received the message', socket.port));
            });
          });
        });

      });

    });

  });


});





describe('with redis', function (){

  // Common app config
  var appConfig = {
    log: { level: 'warn' },

    globals: false,

    hooks: {
      // Inject the sockets hook in this repo into this Sails app
      sockets: require('../')
    },

    loadHooks: ['moduleloader', 'userconfig', 'http', 'sockets'],

    // Configure the socket.io-redis adapter
    sockets: {
      adapter: 'socket.io-redis',
      adapterModule: SocketIORedisAdapter,

      // Configure port to match .travis.yml
      // port: 6379,

      // Test advanced redis config: (will cause sockets hook to build raw redis clients):
      url: 'redis://:secret@localhost:6380'
      // Configure password to match .travis.yml
      // pass: 'secret',
      // db: 'sails'
    },

    routes: {
      // A test route which joins a room
      'PUT /testroom/join': function (req, res){
        req._sails.sockets.join(req, 'testroom');
        return res.send();
      },

      // A test route which broadcasts a message to a room
      'POST /testroom/broadcast': function (req, res){
        req._sails.sockets.broadcast('testroom', {msg: 'HI! HI HI! HI HI!'});
        return res.send();
      }
    }
  };

  // New up five instances of Sails which share the config above
  // and lift all of them (only difference is their port)
  var apps = [];
  var ports = [1600, 1601, 1602, 1603, 1604];
  before(function (done){
    async.each(ports, function (port, next){
      var app = Sails();
      apps.push(app);
      app.lift(_.extend(appConfig, {port: port}),next);
    }, done);
  });
  after(function (done){
    async.each(apps, function (app, next){
      app.lower(next);
    }, done);
  });

  describe('with redis url', function (){
    it('should let you connect', function (){
      // ok.
    });
  });

});
