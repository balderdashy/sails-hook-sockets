/**
 * Module dependencies
 */

var util = require('util');
var assert = require('assert');
var _ = require('@sailshq/lodash');
var async = require('async');
var Sails = require('sails').Sails;
var SocketIORedisAdapter = require('socket.io-redis');
var ioredis = require('ioredis');
var redis = require('redis');
var lifecycle = require('./helpers/lifecycle.helper');

describe('with redis -- custom clients', function (){

  var appConfig;
  var pubClient, subClient, adminPubClient, adminSubClient;

  before(lifecycle.setup);
  after(lifecycle.teardown);

  before(function(done) {

    // Create two connections for the main pubsub functionality with ioredis
    pubClient = new ioredis({port: 6380, host: '127.0.0.1', password: 'secret'});
    subClient = new ioredis({port: 6380, host: '127.0.0.1', password: 'secret'});
    // Create two connections for the admin pubsub with regular redis
    adminPubClient = redis.createClient(6380, '127.0.0.1', {return_buffers: true, auth_pass: 'secret'});
    adminSubClient = redis.createClient(6380, '127.0.0.1', {auth_pass: 'secret'});

    appConfig = {
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
        subEvent: 'messageBuffer',
        pubClient: pubClient,
        subClient: subClient,
        adminPubClient: adminPubClient,
        adminSubClient: adminSubClient
      },

      routes: {
        // A test route which broadcasts a message to the bus
        'POST /testroom/adminBroadcast': function (req, res){
          req._sails.hooks.sockets.broadcastAdminMessage('broadcast', 123);
          return res.send();
        },
        // A test route which blasts a message to the bus
        'POST /testroom/adminBlast': function (req, res){
          req._sails.sockets.blast('foo', 'bar', {msg: 'baz'});
          req._sails.hooks.sockets.blastAdminMessage('blast', 123);
          return res.send();
        }

      }
    };

    // return done();
    setTimeout(done, 1000);

  });


  // New up five instances of Sails which share the config above
  // and lift all of them (only difference is their port)
  var apps = [];
  var ports = [1500, 1501, 1502, 1503, 1504];
  before(function (done){
    async.each(ports, function (port, next){
      var app = Sails();
      apps.push(app);
      app.lift(_.extend(appConfig, {port: port}),next);
    }, done);
  });
  after(function (done){
    pubClient.end(true);
    subClient.end(true);
    adminPubClient.send_command('client', ['kill', 'type', 'pubsub'], function(err) {
      if (err) { return done(err); }
      adminPubClient.send_command('client', ['kill', 'skipme', 'no'], function(err) {
        if (err) { return done(err); }
        async.each(apps, function (app, next){
          app.lower(next);
        }, done);
      });
    });
  });

  describe('all apps', function (){

    describe('after each app has at least one socket connected', function (){

      var sockets = [];
      before(function (done){
        async.auto({
          connectAdminSockets: function(next) {
            async.each(apps, function (app, next){
              app._receivedMessageEvents = {};
              app.on('hook:sockets:adminMessage', function (data){
                var event = data.event;
                var payload = data.payload;
                app._receivedMessageEvents[event] = app._receivedMessageEvents[event] || [];
                app._receivedMessageEvents[event].push(payload);
              });
              return next();
            }, next);
          },
          connectClientSockets: function(next) {
            async.each(apps, function (app, next){
              var socket = io.sails.connect('http://localhost:'+app.config.port, {
                // This prevents multiple socket.io clients attempting to share
                // the same global socket (which would render this test meaningless)
                multiplex: false
              });
              socket._receivedMessageEvents = {};
              sockets.push(socket);
              socket.on('connect', function(socket){ next(); });
              socket.on('message', function(data) {
                socket._receivedMessageEvents[data.event] = true;
              });
            }, next);
          }
        }, done);
      });
      after(function (done){
        async.each(sockets, function (socket, next){
          socket.on('disconnect', function (){ next(); });
          socket.disconnect();
        }, done);
      });

      describe('a message broadcast to the bus', function() {
        before(function(done) {
          var oneSocket = sockets[0];
          oneSocket.post('/testroom/adminBroadcast', function (data, jwr){
            if (jwr.error) {
              return done(jwr.error);
            }
            setTimeout(done, 200);
          });
        });

        it('should be received by all other connected apps', function (done){
          _.each(apps, function (app){
            if (parseInt(app.config.port) === parseInt(sockets[0].port)) {return;}
            assert(app._receivedMessageEvents['broadcast'] && app._receivedMessageEvents['broadcast'].length === 1, util.format('App connected on port %d did not receive the message', app.config.port));
          });
          return done();
        });

        it('should not be received by the sender', function (done){
          var app = _.find(apps, function(app) {return parseInt(app.config.port) === parseInt(sockets[0].port);});
          assert(!app._receivedMessageEvents['broadcast']);
          return done();
        });

        it('should not be received by any of the client sockets', function (){
          _.each(sockets, function (socket){
            assert(!socket._receivedMessageEvents['broadcast']);
          });
        });


      });

      describe('a message blasted to the bus', function() {
        before(function(done) {
          var oneSocket = sockets[0];
          oneSocket.post('/testroom/adminBlast', function (data, jwr){
            if (jwr.error) {
              return done(jwr.error);
            }
            setTimeout(done, 200);
          });
        });

        it('should be received by all connected apps', function (done){
          _.each(apps, function (app){
            assert(app._receivedMessageEvents['blast'] && app._receivedMessageEvents['blast'].length === 1, util.format('App connected on port %d did not receive the message', app.config.port));
          });
          return done();
        });

      });


    });


  });


});
