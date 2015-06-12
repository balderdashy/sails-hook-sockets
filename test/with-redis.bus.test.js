/**
 * Module dependencies
 */

var util = require('util');
var assert = require('assert');
var _ = require('lodash');
var async = require('async');
var Sails = require('sails').Sails;
var SocketIORedisAdapter = require('socket.io-redis');

describe('with redis -- bus', function (){

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
      port: 6380
    },

    routes: {
      // A test route which broadcasts a message to a room
      'POST /testroom/adminBroadcast': function (req, res){
        req._sails.hooks.sockets.broadcastAdminMessage('testingtesting', 123);
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

    describe('after each app has at least one socket connected', function (){

      var sockets = [];
      before(function (done){
        async.auto({
          connectAdminSockets: function(next) {
            async.each(apps, function (app, next){
              app.on('hook:sockets:adminMessage', function (event){
                app._receivedMessageEvents = app._receivedMessageEvents || [];
                app._receivedMessageEvents.push(event);
              });
              app.hooks.sockets.adminSocket.on('connect', next);
            }, next);
          },
          connectClientSockets: function(next) {
            async.each(apps, function (app, next){
              var socket = io.sails.connect('http://localhost:'+app.config.port, {
                // This prevents multiple socket.io clients attempting to share
                // the same global socket (which would render this test meaningless)
                multiplex: false
              });
              sockets.push(socket);
              socket.on('connect', function(socket){ next(); });
            }, next);
          }
        }, function() {
          var oneSocket = sockets[0];
          oneSocket.post('/testroom/adminBroadcast', function (data, jwr){
            if (jwr.error) return done(jwr.error);
            return done();
          });
        });
      });
      after(function (done){
        async.each(sockets, function (socket, next){
          socket.on('disconnect', function (){ next(); });
          socket.disconnect();
        }, done);
      });

      it('all other connected apps should receive the message', function (done){
        _.each(apps, function (app){
          if (app.config.port == sockets[0].port) {return;}
          assert(app._receivedMessageEvents && app._receivedMessageEvents.length == 1, util.format('App connected on port %d did not receive the message', app.config.port));
        });
        return done();
      });

    });


  });


});
