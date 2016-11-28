/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var _ = require('lodash');
var ensureRedisConnection = require('./ensure-redis-connection');


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
    }//>-

    // Then for the subClient.
    if (adapterConfig.subClient) {
      app.log.verbose('custom `subClient` was provided for the Sails app running on port %d', app.config.port);
    }
    else {
      adapterConfig.subClient = adapterConfig.subClient || redis.createClient(adapterConfig.port || 6379, adapterConfig.host || '127.0.0.1', _.extend({}, redisClientOpts,{
        return_buffers: true
      }));
    }//>-

    // Now check that the pub and sub clients were able to connect successfully,
    // and set up event handlers for them.
    ensureRedisConnection(app, adapterConfig, function (err){
      if (err){ return cb(err); }

      // If the `db` option was not specified, then we're done.
      if (!adapterConfig.db) {
        return cb();
      }//--•

      // Otherwise, `db` was supplied, so call `select` on that redis database
      // from each of our clients.
      adapterConfig.pubClient.select(adapterConfig.db, function() {
        if (err) { return cb(err); }
        // ^^ if this causes problems, it's prbly because Mike added it on Nov 2 for Sails v1.
        // It didn't exist before, and there might have been a good reason.  But if so, then
        // we need to document said reason here (and please ping @mikermcneil about it.)

        adapterConfig.subClient.select(adapterConfig.db, function (err){
          if (err) { return cb(err); }
          // ^^ if this causes problems, it's prbly because Mike added it on Nov 2 for Sails v1.
          // It didn't exist before, and there might have been a good reason.  But if so, then
          // we need to document said reason here (and please ping @mikermcneil about it.)

          return cb();

        });//</ subClient.select()>

      });//</ pubClient.select()>

    });//</ ensureRedisConnection()>

  };

};
