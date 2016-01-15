/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var _ = require('lodash');
var ERRORPACK = require('./errors');



module.exports = function (app){

  return function prepareDriver(adapterDef, cb){

    var adapterModuleName = adapterDef.moduleName;
    var pathToAdapterDependency = adapterDef.modulePath;
    var adapterConfig = adapterDef.config;

    // For redis:
    // ============================================================
    if (adapterModuleName === 'socket.io-redis') {

      // Create raw redis clients if necessary
      var rawClientsNecessary = adapterConfig.pass || adapterConfig.db || adapterDef.adminBus;
      if (!rawClientsNecessary) {
        return cb();
      }

      // Borrow access to the `redis` module from socket.io-redis
      var redis;
      try {
        redis = require(path.resolve(pathToAdapterDependency, 'node_modules/redis'));
      }
      catch (e) {
        try {
          redis = require('redis');
        } catch (e2) {
          return cb(e2);
        }
      }

      // Set up object that will be used for redis client options
      var redisClientOpts = {};

      // If `pass` was supplied, pass it in as `auth_pass`
      if (adapterConfig.pass) {

        redisClientOpts.auth_pass = adapterConfig.pass;
      }


      // Build Redis clients if necessary
      if (adapterConfig.pubClient) {
        app.log.verbose('adapterConfig.pubClient already specified!! (app running on port %d)', app.config.port);
      }
      if (adapterConfig.subClient) {
        app.log.verbose('adapterConfig.subClient already specified!! (app running on port %d)', app.config.port);
      }
      adapterConfig.pubClient = adapterConfig.pubClient || redis.createClient(adapterConfig.port || 6379, adapterConfig.host || '127.0.0.1', _.extend({}, redisClientOpts, {
        return_buffers: true
      }));
      adapterConfig.subClient = adapterConfig.subClient || redis.createClient(adapterConfig.port || 6379, adapterConfig.host || '127.0.0.1', _.extend({}, redisClientOpts,{
        return_buffers: true
      }));

      // Listen for connection errors from redis clients
      // (and handle the first one if necessary)
      (function ensureRedisClientsLoadedSuccessfully (done){
        var redisClientConnectionError;
        var pubReady;
        var subReady;
        adapterConfig.pubClient.once('ready', function (){
          if (pubReady) return;
          pubReady = true;
          app.log.silly('ad hoc redis client ready (pub) (%d)', app.config.port);
          if(!redisClientConnectionError && subReady) {
            done();
          }
        });
        adapterConfig.subClient.once('ready', function (){
          if (subReady) return;
          app.log.silly('ad hoc redis client ready (sub) (%d)', app.config.port);
          subReady = true;
          if (!redisClientConnectionError && pubReady) {
            done();
          }
        });
        adapterConfig.pubClient.on('error', function (err){
          app.log.error('Redis error from socket.io->redis client (pub):',err);
          // Only care about the first connection error
          if (redisClientConnectionError) { return; }
          redisClientConnectionError = err;
          // If `ready` already fired, just log the error
          if (pubReady && subReady) {
            return;
          }
          return done(err);
        });
        adapterConfig.subClient.on('error', function (err){
          app.log.error('Redis error from socket.io->redis client (sub):',err);
          // Only care about the first connection error
          if (redisClientConnectionError) { return; }
          redisClientConnectionError = err;
          // If `ready` already fired, just log the error
          if (pubReady && subReady) {
            return;
          }
          return done(err);
        });
      })(function (err){
        if (err){
          return cb(err);
        }

        if (!adapterConfig.db) {
          return cb();
        }

        // if `db` was supplied, call `select` on that redis database
        adapterConfig.pubClient.select(adapterConfig.db, function() {
          adapterConfig.subClient.select(adapterConfig.db, function (){
            return cb();
          });
        });
      });
      return;
    } // </socket.io-redis>

    // Otherwise we're good
    else {
      return cb();
    }

  };

};
