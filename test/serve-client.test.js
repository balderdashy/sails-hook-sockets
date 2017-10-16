/**
 * Module dependencies
 */

var assert = require('assert');
var _ = require('@sailshq/lodash');
var Sails = require('sails').Sails;
var Http = require('machinepack-http');
var lifecycle = require('./helpers/lifecycle.helper');

describe('with `serveClient` config enabled', function (){

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

    loadHooks: ['moduleloader', 'userconfig', 'http', 'session', 'sockets'],

  };


  // New up two instances of Sails which share the config above
  // and lift all of them (only difference is their port, and that
  // one has `serveClient` set to true)
  var app1, app2;

  before(function (done){
    app1 = Sails();
    app1.lift(_.extend({}, appConfig, {port: 1600}), function (err) {
      if (err) return done(err);

      // Configure `serveClient` for the second app
      app2 = Sails();
      app2.lift(_.merge({}, appConfig, {port: 1601, sockets: {serveClient: true}}), done);
    });
  });
  after(function (done){
    app1.lower(function (err){
      if (err) return done(err);
      app2.lower(done);
    });
  });



  describe('after sending an http request to `http://localhost:1600/socket.io/socket.io.js`', function (){
    it('should return a 400 status code', function (done){

      // Send an HTTP request and receive the response.
      Http.sendHttpRequest({
        url: '/socket.io/socket.io.js',
        baseUrl: 'http://localhost:1600',
        method: 'get'
      }).exec({
        // An unexpected error occurred.
        error: function(err) {
          return done(err);
        },
        // 400 status code returned from server
        non200Response: function(result) {
          assert.equal(result.statusCode, 400);
          return done();
        },
        // OK.
        success: function(result) {
          return done(new Error('Expecting 404- the socket.io.js client should not be served automatically unless `serveClient` is explicitly enabled!'));
        }
      });
    });
  });

  describe('after sending an http request to `http://localhost:1601/socket.io/socket.io.js`', function (){
    it('should return a 200 status code and a string response body with crunch, nougaty HTML inside', function (done){

      // Send an HTTP request and receive the response.
      Http.sendHttpRequest({
        url: '/socket.io/socket.io.js',
        baseUrl: 'http://localhost:1601',
        method: 'get'
      }).exec({
        // An unexpected error occurred.
        error: function(err) {
          return done(err);
        },
        non200Response: function(err) {
          return done(err);
        },
        // OK.
        success: function(result) {
          return done();
        }
      });
    });
  });


});
