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

describe('with redis -- errors', function (){

  before(lifecycle.setup);
  after(lifecycle.teardown);

  it('Should fail to lift Sails when attempting to connect with a db value that is not a number', function(done) {

    Sails().lift({
      log: { level: 'silent' },

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

        // Should fail, because db needs to be a non-negative integer
        db: 'foobar',

        // Configure password to match .travis.yml
        pass: 'secret',

      }
    }, function(err) {

      if (err) {
        assert.equal(err.code, 'SAILS:HOOK:SOCKETS:CONFIG', 'Got wrong kind of error: ' + util.inspect(err,  {depth: null}));
        return done();
      }

      return done(new Error('Should have failed to lift!'));

    });

  });

  it('Should fail to lift Sails when attempting to connect with a db value that is not a non-negative integer', function(done) {

    Sails().lift({
      log: { level: 'silent' },

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

        // Should fail, because db needs to be a non-negative integer
        db: -5,

        // Configure password to match .travis.yml
        pass: 'secret',

      }
    }, function(err) {

      if (err) {
        assert.equal(err.code, 'SAILS:HOOK:SOCKETS:CONFIG', 'Got wrong kind of error: ' + util.inspect(err,  {depth: null}));
        return done();
      }

      return done(new Error('Should have failed to lift!'));

    });

  });

  it('Should fail to lift Sails when attempting to connect with a db value that is > than the # of databases on the Redis server', function(done) {

    Sails().lift({
      log: { level: 'silent' },

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

        // Should fail, because by default Redis only has 16 dbs
        db: 99,

        // Configure password to match .travis.yml
        pass: 'secret',

      }
    }, function(err) {

      if (err) {
        assert.equal(err.code, 'E_INVALID_DB_INDEX', 'Got wrong kind of error: ' + util.inspect(err,  {depth: null}));
        return done();
      }

      return done(new Error('Should have failed to lift!'));

    });

  });

});
