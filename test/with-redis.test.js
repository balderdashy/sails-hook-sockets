/**
 * Module dependencies
 */

var util = require('util');
var assert = require('assert');
var _ = require('@sailshq/lodash');
var async = require('async');
var Sails = require('sails').Sails;
var SocketIORedisAdapter = require('socket.io-redis');
var lifecycle = require('./helpers/lifecycle.helper');

// TODO:
// figure out how to make this run on Travis
// (need a local redis)


describe('with redis', function (){

  before(lifecycle.setup);
  after(lifecycle.teardown);

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
      db: 2
    },

    routes: {
      'GET /id': function(req, res) {
        res.send(req.socket.id);
      },
      // A test route which joins a room
      'PUT /testroom/join': function (req, res){
        req._sails.sockets.join(req, 'testroom', function() {
          // Add slight delay to allow all servers to react
          setTimeout(function(){res.send();}, 100);
        });
      },

      'PUT /funRoom/join': function (req, res){
        req._sails.sockets.join(req.param('socketId'), 'funRoom', function() {
          // Add slight delay to allow all servers to react
          setTimeout(function(){res.send();}, 100);
        });
      },

      'PUT /funRoom/leave': function (req, res){
        req._sails.sockets.leave(req.param('socketId'), 'funRoom', function() {
          // Add slight delay to allow all servers to react
          setTimeout(function(){res.send();}, 100);
        });
      },

      'PUT /awesomeRoom/joinByRoom': function (req, res){
        req._sails.sockets.addRoomMembersToRooms(req.param('socketId'), 'awesomeRoom', function() {
          // Add slight delay to allow all servers to react
          setTimeout(function(){res.send();}, 100);
        });
      },

      'PUT /awesomeRoom/leaveByRoom': function (req, res){
        req._sails.sockets.removeRoomMembersFromRooms(req.param('socketId'), 'awesomeRoom', function() {
          // Add slight delay to allow all servers to react
          setTimeout(function(){res.send();}, 100);
        });
      },

      // A test route which blasts a message
      'POST /blast': function (req, res){
        var msg = req.param('msg') || 'HI! HI HI! HI HI!';
        var eventName = req.param('event') || 'blasted';
        req._sails.sockets.blast(eventName, {msg: msg});
        return res.send();
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
          if (err) {return res.send(err);}
          // Add slight delay to allow all servers to react
          setTimeout(function(){res.send();}, 100);
        });
      },

      'PUT /testroom/leavePlayroom': function (req, res) {
        req._sails.sockets.removeRoomMembersFromRooms('testroom', 'playroom', function(err) {
          if (err) {return res.send(err);}
          // Add slight delay to allow all servers to react
          setTimeout(function(){res.send();}, 100);
        });
      },

      'PUT /leaveAllRooms': function (req, res) {
        req._sails.sockets.leaveAll('testroom', function(err) {
          if (err) {return res.send(err);}
          // Add slight delay to allow all servers to react
          setTimeout(function(){res.send();}, 100);
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
      var socketIds = [];
      before(function (done){
        async.eachSeries(apps, function (app, next){
          var socket = io.sails.connect('http://localhost:'+app.config.port, {
            // This prevents multiple socket.io clients attempting to share
            // the same global socket (which would render this test meaningless)
            multiplex: false
          });
          sockets.push(socket);
          socket.on('connect', function(){
            socket.get('/id', function(data) {
              socketIds.push(data);
              return next();
            });
          });
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

      describe('when all sockets listen for the `blasted` event', function (){

        before(function (done){
          async.each(sockets, function (socket, next){
            socket.on('blasted', function (event){
              socket._receivedBlastEvents = socket._receivedBlastEvents || [];
              socket._receivedBlastEvents.push(event);
            });
            return next();
          }, done);
        });

        describe('and then one socket blasts a message', function (){

          before(function (done){
            var oneSocket = sockets[0];
            oneSocket.post('/blast', function (data, jwr){
              if (jwr.error) return done(jwr.error);
              return setTimeout(done, 200);
            });
          });

          it('all connected sockets should receive the message (even though they are connected to different instances)', function (){
            _.each(sockets, function (socket){
              assert(socket._receivedBlastEvents && socket._receivedBlastEvents.length == 1, util.format('Socket connected to app on port %d did not receive the message', socket.port));
            });
          });
        });

      });

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
              return setTimeout(done, 200);
            });
          });

          it('all connected sockets should receive the message (even though they are connected to different instances)', function (){
            _.each(sockets, function (socket){
              assert(socket._receivedMessageEvents && socket._receivedMessageEvents.length == 1, util.format('Socket connected to app on port %d did not receive the message', socket.port));
            });
          });
        });

      });

      describe('when one socket uses `addRoomMembersToRooms` to join all members of `testroom` to `playroom`', function (){

        before(function (done) {
          sockets[0].put('/testroom/joinPlayroom', function (data, jwr) {
            if (jwr.error) {return done(jwr.error);}
            return setTimeout(done, 200);
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
                return setTimeout(done, 200);
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

      describe('when one socket uses `removeRoomMembersFromRooms` to remove all members of `testroom` from `playroom`', function (){

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
                return setTimeout(done, 200);
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
              return setTimeout(done, 200);
            });
          });

          it('connected sockets should not receive the message', function (){
            _.each(sockets, function (socket){
              assert(!(socket._receivedMessageEvents && socket._receivedMessageEvents.length == 2), util.format('Socket connected to app on port %d received the message', socket.port));
            });
          });
        });

      });

      describe('when one socket uses `join` to add a socket on another server to `funRoom`', function (){

        var funRoomSocket;
        before(function (done) {
          funRoomSocket = sockets[1];
          sockets[0].put('/funRoom/join/?socketId=' + socketIds[1], function (data, jwr) {
            if (jwr.error) {return done(jwr.error);}
            return setTimeout(done, 200);
          });
        });

        describe('and the other socket listens for the `funRoomMsg` event', function() {

          before(function (){
            funRoomSocket.on('funRoomMsg', function (event){
              funRoomSocket._receivedFunRoomEvents = funRoomSocket._receivedFunRoomEvents || [];
              funRoomSocket._receivedFunRoomEvents.push(event);
            });
          });

          describe('and then one socket broadcasts a `funRoomMsg` event', function (){

            before(function (done){
              var oneSocket = sockets[2];
              oneSocket.post('/broadcast', {room: 'funRoom', event: 'funRoomMsg', msg: 'PLAYTIME!'}, function (data, jwr){
                if (jwr.error) return done(jwr.error);
                return setTimeout(done, 200);
              });
            });

            it('the subscribed socket should receive the message', function (){
              assert(funRoomSocket._receivedFunRoomEvents && funRoomSocket._receivedFunRoomEvents.length == 1, 'Socket did not receive the fun room message!');
            });

            it('other sockets should not receive the message', function() {
              _.each(sockets, function (socket){
                if (socket == funRoomSocket) {return;}
                assert(!socket._receivedFunRoomEvents, util.format('Socket connected to app on port %d received the message', socket.port));
              });
            });

          });

        });

      });

      describe('when one socket uses `leave` to remove a socket on another server from `funRoom`', function (){

        var funRoomSocket;
        before(function (done) {
          funRoomSocket = sockets[1];
          sockets[0].put('/funRoom/leave/?socketId=' + socketIds[1], function (data, jwr) {
            if (jwr.error) {return done(jwr.error);}
            return setTimeout(done, 200);
          });
        });

        describe('and the other socket listens for the `noMoreFunRoomMsg` event', function() {

          before(function (){
            funRoomSocket.on('noMoreFunRoomMsg', function (event){
              funRoomSocket._receivedNoFunRoomEvents = funRoomSocket._receivedNoFunRoomEvents || [];
              funRoomSocket._receivedNoFunRoomEvents.push(event);
            });
          });

          describe('and then one socket broadcasts a `noMoreFunRoomMsg` event', function (){

            before(function (done){
              var oneSocket = sockets[2];
              oneSocket.post('/broadcast', {room: 'funRoom', event: 'noMoreFunRoomMsg', msg: 'PLAYTIME!'}, function (data, jwr){
                if (jwr.error) return done(jwr.error);
                return setTimeout(done, 200);
              });
            });

            it('no sockets should not receive the message', function() {
              _.each(sockets, function (socket){
                assert(!socket._receivedNoFunRoomEvents, util.format('Socket connected to app on port %d received the message', socket.port));
              });
            });

          });

        });

      });

      describe('when one socket uses `addRoomMembersToRooms` to add a single socket on the same server to `awesomeRoom`', function (){

        var adminMessagesReceived = 0;
        function rcvdAdminMessage() {adminMessagesReceived++;}
        before(function (done) {
          _.each(apps, function(app) {
            app.on('hook:sockets:adminMessage', rcvdAdminMessage);
          });
          sockets[0].put('/awesomeRoom/joinByRoom/?socketId=' + socketIds[0], function (data, jwr) {
            if (jwr.error) {return done(jwr.error);}
            return setTimeout(done, 200);
          });
        });

        after(function() {
          _.each(apps, function(app) {
            app.removeListener('hook:sockets:adminMessage', rcvdAdminMessage);
          });
        });

        describe('and the socket listens for the `awesomeRoomMsg` event', function() {

          before(function (){
            sockets[0].on('awesomeRoomMsg', function (event){
              sockets[0]._receivedAwesomeRoomEvents = sockets[0]._receivedAwesomeRoomEvents || [];
              sockets[0]._receivedAwesomeRoomEvents.push(event);
            });
          });

          describe('and then one socket broadcasts a `awesomeRoomMsg` event', function (){

            before(function (done){
              var oneSocket = sockets[2];
              oneSocket.post('/broadcast', {room: 'awesomeRoom', event: 'awesomeRoomMsg', msg: 'PLAYTIME!'}, function (data, jwr){
                if (jwr.error) return done(jwr.error);
                return setTimeout(done, 200);
              });
            });

            it('the subscribed socket should receive the message', function (){
              assert(sockets[0]._receivedAwesomeRoomEvents && sockets[0]._receivedAwesomeRoomEvents.length == 1, 'Socket did not receive the fun room message!');
            });

            it('other sockets should not receive the message', function() {
              _.each(sockets, function (socket){
                if (socket == sockets[0]) {return;}
                assert(!socket._receivedAwesomeRoomEvents, util.format('Socket connected to app on port %d received the message', socket.port));
              });
            });

            it('no app should have received an admin message', function() {
              assert.equal(adminMessagesReceived, 0);
            });

          });

        });

      });

      describe('when one socket uses `removeRoomMembersFromRooms` to remove a single socket on the same server from `awesomeRoom`', function (){

        var adminMessagesReceived = 0;
        function rcvdAdminMessage() {adminMessagesReceived++;}
        before(function (done) {
          _.each(apps, function(app) {
            app.on('hook:sockets:adminMessage', rcvdAdminMessage);
          });
          sockets[0].put('/awesomeRoom/leaveByRoom/?socketId=' + socketIds[0], function (data, jwr) {
            if (jwr.error) {return done(jwr.error);}
            return setTimeout(done, 200);
          });
        });

        after(function() {
          _.each(apps, function(app) {
            app.removeListener('hook:sockets:adminMessage', rcvdAdminMessage);
          });
        });

        describe('and the socket listens for the `awesomeNoMoreRoomMsg` event', function() {

          before(function (){
            sockets[0].on('awesomeNoMoreRoomMsg', function (event){
              sockets[0]._receivedAwesomeNoMoreRoomEvents = sockets[0]._receivedAwesomeNoMoreRoomEvents || [];
              sockets[0]._receivedAwesomeNoMoreRoomEvents.push(event);
            });
          });

          describe('and then one socket broadcasts a `awesomeNoMoreRoomMsg` event', function (){

            before(function (done){
              var oneSocket = sockets[2];
              oneSocket.post('/broadcast', {room: 'awesomeRoom', event: 'awesomeNoMoreRoomMsg', msg: 'PLAYTIME!'}, function (data, jwr){
                if (jwr.error) return done(jwr.error);
                return setTimeout(done, 200);
              });
            });

            it('no sockets should receive the message', function() {
              _.each(sockets, function (socket){
                assert(!socket._receivedAwesomeNoMoreRoomEvents, util.format('Socket connected to app on port %d received the message', socket.port));
              });
            });

            it('no app should have received an admin message', function() {
              assert.equal(adminMessagesReceived, 0);
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
