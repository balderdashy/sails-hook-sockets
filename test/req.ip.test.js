/**
 * Module dependencies
 */

var assert = require('assert');
var util = require('util');

var _ = require('@sailshq/lodash');
var Sails = require('sails').Sails;

var lifecycle = require('./helpers/lifecycle.helper');


describe('req.ip', function (){

  describe('with no `x-forwarded-for` header', function () {

    before(lifecycle.setup);
    after(lifecycle.teardown);

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
        routes: {
          'GET /': function(req, res) { return res.send(req.ip); }
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

    it('should return the detected client IP for `req.ip`', function(done) {

      newSocket = io.sails.connect('http://localhost:'+1685, {
        multiplex: false
      });
      newSocket.on('connect', function (){
        newSocket.get('/', function(resp) {
          assert.equal(resp, '::ffff:127.0.0.1');
          return done();
        });
      });

    });

  });

  describe('with an `x-forwarded-for` header but no `trustProxy`', function () {

    before(lifecycle.setup);
    after(lifecycle.teardown);

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
        routes: {
          'GET /': function(req, res) { return res.send(req.ip); }
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

    it('should return the detected client IP for `req.ip`', function(done) {

      io.sails.initialConnectionHeaders = {
        'x-forwarded-for': '1.2.3.4,5.6.7.8'
      };
      newSocket = io.sails.connect('http://localhost:'+1685, {
        multiplex: false
      });
      newSocket.on('connect', function (){
        newSocket.get('/', function(resp) {
          assert.equal(resp, '::ffff:127.0.0.1');
          return done();
        });
      });

    });

  });

  describe('with an `x-forwarded-for` header and `trustProxy` set to `true`', function () {

    before(lifecycle.setup);
    after(lifecycle.teardown);

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
        http: {
          trustProxy: true
        },
        loadHooks: ['moduleloader', 'userconfig', 'http', 'sockets'],
        routes: {
          'GET /': function(req, res) { return res.send(req.ip); }
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

    it('should return the left-most IP in `x-forwarded-for` for `req.ip`', function(done) {

      io.sails.initialConnectionHeaders = {
        'x-forwarded-for': '1.2.3.4,5.6.7.8'
      };
      newSocket = io.sails.connect('http://localhost:'+1685, {
        multiplex: false
      });
      newSocket.on('connect', function (){
        newSocket.get('/', function(resp) {
          assert.equal(resp, '1.2.3.4');
          return done();
        });
      });

    });

  });

  describe('with an `x-forwarded-for` header and `trustProxy` set to 2', function () {

    before(lifecycle.setup);
    after(lifecycle.teardown);

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
        http: {
          trustProxy: 2
        },
        loadHooks: ['moduleloader', 'userconfig', 'http', 'sockets'],
        routes: {
          'GET /': function(req, res) { return res.send(req.ip); }
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

    it('should return the second-to-last IP in `x-forwarded-for` for `req.ip`', function(done) {

      io.sails.initialConnectionHeaders = {
        'x-forwarded-for': '1.2.3.4,5.6.7.8,12.34.56.78'
      };
      newSocket = io.sails.connect('http://localhost:'+1685, {
        multiplex: false
      });
      newSocket.on('connect', function (){
        newSocket.get('/', function(resp) {
          assert.equal(resp, '5.6.7.8');
          return done();
        });
      });

    });

  });

});
