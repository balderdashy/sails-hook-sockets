/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var _ = require('@sailshq/lodash');
var ensureRedisConnection = require('./ensure-redis-connection');
var flaverr = require('flaverr');


module.exports = function (app){

  return function prepareDriver(adapterDef, cb){

    var adapterConfig = adapterDef.config;

    // If we're not using socket.io-redis, then no need to continue.
    // Support for other adapters is up to the developer (they must
    // set up all connections et al before the hook initializes).
    if (adapterDef.moduleName !== 'socket.io-redis') {
      return cb();
    }

    // If a pub and sub client were provided, no need to prepare them here.
    // We will assume they're already connected and ready.
    if (adapterConfig.pubClient && adapterConfig.subClient) {
      return cb();
    }

    // Otherwise, we're using the socket.io-redis adapter, so
    // we've got to do a bit more setup.
    // ============================================================
    var pathToAdapterDependency = adapterDef.modulePath;

    // Borrow access to the `redis` module from socket.io-redis.
    // (this is mainly to ensure a compatible version of the `redis` client library)
    //
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Note that, to use a different Redis client library, you can create two redis client
    // instances using your client library of choice, then pass them in as the `pubClient`
    // and `subClient` options.
    //
    // For details on that, see:
    // https://github.com/balderdashy/sails-hook-sockets/pull/25#issuecomment-258054197
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    var redis;

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // TODO: instead of this auto-requiring stuff, try to extend
    // `socket.io-redis` so that it provides public access to its
    // internal `redis` client library instance.
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    // NPM 2.x.x
    try {
      redis = require(path.resolve(pathToAdapterDependency, 'node_modules/redis'));
    }
    catch (unused) {

      // NPM 3.x.x...?
      try {
        redis = require('redis');
      } catch (e) {
        return cb(e);
      }

    }//</catch>


    // Next, set up a dictionary that will be used for redis client options.
    var redisClientOpts = {};

    // If `pass` was supplied, pass it in as `auth_pass`
    if (adapterConfig.pass) {

      redisClientOpts.auth_pass = adapterConfig.pass;

    }//>-


    // Build Redis clients if necessary:

    // First the pubClient.
    if (adapterConfig.pubClient) {
      app.log.verbose('custom `pubClient` was provided for the Sails app running on port %d', app.config.port);
    }
    else {
      adapterConfig.pubClient = redis.createClient(adapterConfig.port || 6379, adapterConfig.host || '127.0.0.1', _.extend({}, redisClientOpts, {
        return_buffers: true
      }));
      // When the http server closes, kill this connection.
      // This prevents the process from hanging when Sails is loaded programmatically.
      app.hooks.http.server.on('close', function() {
        adapterConfig.pubClient.end(true);
      });
    }//>-

    // Then for the subClient.
    if (adapterConfig.subClient) {
      app.log.verbose('custom `subClient` was provided for the Sails app running on port %d', app.config.port);
    }
    else {
      adapterConfig.subClient = adapterConfig.subClient || redis.createClient(adapterConfig.port || 6379, adapterConfig.host || '127.0.0.1', _.extend({}, redisClientOpts,{
        return_buffers: true
      }));
      // When the http server closes, kill this connection.
      // This prevents the process from hanging when Sails is loaded programmatically.
      app.hooks.http.server.on('close', function() {
        adapterConfig.subClient.end(true);
      });
    }//>-

    // Now check that the pub and sub clients were able to connect successfully,
    // and set up event handlers for them.
    ensureRedisConnection(app, adapterConfig, function (err){
      if (err){ return cb(err); }

      // If the `db` option was not specified, then we're done (clients will connect to the default, db #0).
      if (!adapterConfig.db) {
        return cb();
      }//--•

      // Otherwise, `db` was supplied, so call `select` on that redis database
      // from each of our clients.
      adapterConfig.pubClient.select(adapterConfig.db, function() {
        // If there was an error connecting to the specified db, standardize it and pass it back so
        // that Sails fails to lift.
        if (err) {
          if (err.command === 'SELECT') {
            return cb(flaverr('E_INVALID_DB_INDEX', new Error('The provided Redis DB value (' + adapterConfig.db + ') was not valid for the specified Redis server.  Error from Redis:\n' + util.inspect(err, {depth: null}))));
          }
          return cb(err);
        }

        // Same thing for `subClient` -- detect errors connecting to the db and pass them back to the callback.
        adapterConfig.subClient.select(adapterConfig.db, function (err){
          if (err) {
            if (err.command === 'SELECT') {
              return cb(flaverr('E_INVALID_DB_INDEX', new Error('The provided Redis DB value (' + adapterConfig.db + ') was not valid for the specified Redis server.  Error from Redis:\n' + util.inspect(err, {depth: null}))));
            }
            return cb(err);
          }

          // No errors connecting to the specified dbs, so we can continue!
          return cb();

        });//</ subClient.select()>

      });//</ pubClient.select()>

    });//</ ensureRedisConnection()>

  };

};
