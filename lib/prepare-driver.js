/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var async = require('async');
var _ = require('@sailshq/lodash');
var Redis = require('machinepack-redis');
var ensureRedisConnection = require('./ensure-redis-connection');
var flaverr = require('flaverr');


module.exports = function (app){

  return function prepareDriver(adapterDef, cb){

    var adapterConfig = adapterDef.config;

    // If we're not using Redis, then no need to continue.
    // Support for other adapters is up to the developer (they must
    // set up all connections et al before the hook initializes).
    if (adapterDef.moduleName !== 'socket.io-redis' && adapterDef.moduleName !== '@sailshq/socket.io-redis') {
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

    // Create a Redis connection manager
    var url = adapterConfig.url || Redis.createConnectionUrl(_.pick(adapterConfig, ['host', 'port', 'pass', 'db'])).execSync();

    // Create a Redis connection manager.
    Redis.createManager({
      connectionString: url,
      meta: _.extend({return_buffers: true}, _.omit(adapterConfig, ['host', 'port', 'pass', 'db', 'url'])),
      // Handle failures on the connection.
      onUnexpectedFailure: function(err) {
        // If Sails is already on the way out, ignore the Redis issue.
        if (app._exiting) {
          return;
        }
        // If the Redis client disconnected, say something and run any custom logic
        // that was provided for this occasion.
        if (err.failureType === 'end') {
          if (_.isFunction(adapterConfig.onRedisDisconnect)) {
            adapterConfig.onRedisDisconnect();
          }
          // If a disconnected client comes back, say something and run any custom logic
          // that was provided for this occasion.
          app.log.error('Redis socket "'+ (err.connection.name) +'" server went offline...');
          err.connection.once('ready', function() {
            if (_.isFunction(adapterConfig.onRedisReconnect)) {
              adapterConfig.onRedisReconnect();
            }
            app.log.error('Redis socket "'+ (err.connection.name) +'" server came back online...');
          });
        }
      }
    }).exec(function(err, createManagerResult) {

      if (err) { return cb(err); }

      async.each(['pub', 'sub'], function (clientName, next) {

        // If this client was preconfigured, skip creating it.
        if (adapterConfig[clientName + 'Client']) { return next(); }

        // Use the manager to create a new Redis connection.
        Redis.getConnection({
          manager: createManagerResult.manager,
          meta: (adapterConfig[clientName + 'ClientName'] || clientName) + ' ' + app.config.port
        }).exec({
          failed: function(err) { return next(err.error); },
          error: next,
          success: function(result) {
            // Save the connected client into the session config so that it can be used
            // by the connect-redis module.
            adapterConfig[clientName + 'Client'] = result.connection;
            result.connection.name = adapterConfig[clientName + 'ClientName'] || clientName;

            // When the http server closes, kill this connection.
            // This prevents the process from hanging when Sails is loaded programmatically.
            app.hooks.http.server.on('close', function() {
              result.connection.end(true);
            });


            // If no custom db index was given, we're done.
            if (!adapterConfig.db) {
              return next();
            }//--•

            // Otherwise, `db` was supplied, so call `select` on that redis database
            // from each of our clients.
            result.connection.select(adapterConfig.db, function() {
              // If there was an error connecting to the specified db, standardize it and pass it back so
              // that Sails fails to lift.
              if (err) {
                if (err.command === 'SELECT') {
                  return next(flaverr('E_INVALID_DB_INDEX', new Error('The provided Redis DB value (' + adapterConfig.db + ') was not valid for the specified Redis server.  Error from Redis:\n' + util.inspect(err, {depth: null}))));
                }
                return next(err);
              }
              return next();
            });
          }
        });


      }, cb);

    });
  };

};
