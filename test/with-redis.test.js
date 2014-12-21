/**
 * Module dependencies
 */

var util = require('util');
var assert = require('assert');
var _ = require('lodash');
var async = require('async');
var Sails = require('sails').Sails;
var socketioClient = require('socket.io-client');
var sailsioClient = require('sails.io.js');
// var SocketIORedisAdapter = require('socket.io-redis');

// TODO:
// figure out how to make this run on Travis
// (need a local redis)


describe('with redis', function (){

  // Common app config
  var appConfig = {
    log: { level: 'warn' },
    hooks: {
      // Inject the sockets hook in this repo into this Sails app
      sockets: require('../')
    },
    loadHooks: ['moduleloader', 'userconfig', 'http', 'sockets'],
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

  describe('all apps', function (){


    // Instantiate socket client.
    var client;
    before(function (){
      client = sailsioClient(socketioClient);
      client.sails.autoConnect = false;
      client.sails.environment = 'production'; // turn off sails.io client logs
    });

    describe('after each app has at least one socket connected', function (){

      var sockets = [];
      before(function (done){
        async.each(apps, function (app, next){
          var socket = client.sails.connect('http://localhost:'+app.config.port, {
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

        before(function (){
          async.each(sockets, function (socket, next){
            socket.on('message', function (event){
              socket._receivedMessageEvents = socket._receivedMessageEvents || [];
              socket._receivedMessageEvents.push(event);
            });
            socket.put('/testroom/join', function (data, jwr){
              if (jwr.error) return next(jwr.error);
              return next();
            });
          });
        });

        describe('and then one socket broadcasts a message', function (){

          before(function (done){
            var oneSocket = sockets[0];
            // console.log('broadcasting from socket on port %d', oneSocket.port);
            oneSocket.post('/testroom/broadcast', function (data, jwr){
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


    });

  });


});
