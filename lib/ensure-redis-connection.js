/**
 * Module dependencies
 */

var flaverr = require('flaverr');
var async = require('async');
var _ = require('@sailshq/lodash');

/**
 * ensureRedisConnection()
 *
 * Ensure that a connection has been made to the Redis server specified in the session
 * config, or else return an error that will cause the hook (and Sails lift) to fail.
 *
 * @param  {sailsApp}   app The current Sails app
 * @param  {Object}   adapterConfig Configuration for the adapter to ensure Redis connections for
 * @param  {Function} cb  Callback to call when the connection is established, or determined to have failed.
 */

module.exports = function ensureRedisClientsLoadedSuccessfully (app, adapterConfig, done){

  var redisConnectionError;
  var onPubPreConnectionEnd;
  var onSubPreConnectionEnd;
  var pubReady;
  var subReady;

  // A pre-connection error handler for the pub and sub connections to share.
  function onPreConnectionError (err){
    redisConnectionError = err;
    adapterConfig.pubClient.removeListener('error', onPreConnectionError);
    adapterConfig.subClient.removeListener('error', onPreConnectionError);
  }

  // A generator for a pre-connection "end" handler.
  // This returns an event handler whose error message is customized for the
  // specific client connection that the error was triggered on.
  function onPreConnectionEnd(pubOrSub){

    return function() {
      // Remove all pre-connection handlers from both the pub and sub clients.
      adapterConfig.pubClient.removeListener('end', onPubPreConnectionEnd);
      adapterConfig.pubClient.removeListener('error', onPreConnectionError);
      adapterConfig.subClient.removeListener('end', onSubPreConnectionEnd);
      adapterConfig.subClient.removeListener('error', onPreConnectionError);

      // Prevent automatic reconnection attempts.
      adapterConfig.pubClient.end(true);
      adapterConfig.subClient.end(true);

      // Use the error we got in the pre-connection error handler (if any), otherwise
      // create a new error.
      var redisError = redisConnectionError || new Error('Redis ' + pubOrSub + 'client fired "end" event before it finished connecting.');

      // Throw the error to prevent the app from lifting.
      return done(flaverr('E_REDIS_CONNECTION_FAILED', new Error('Sails could not connect to the specified Redis socket "' + pubOrSub + '" server.\n' + redisError.stack)));
    };
  }

  // Create pre-connection "end" event handlers for the pub and sub clients.
  onPubPreConnectionEnd = onPreConnectionEnd('pub');
  onSubPreConnectionEnd = onPreConnectionEnd('sub');

  // Attach "error" and "end" handlers to the pub and sub clients.
  adapterConfig.pubClient.on('error', onPreConnectionError);
  adapterConfig.subClient.on('error', onPreConnectionError);
  adapterConfig.pubClient.on('end', onPubPreConnectionEnd);
  adapterConfig.subClient.on('end', onSubPreConnectionEnd);

  // Set up one-time 'ready' handlers for the pub and sub clients,
  // and return when both fire.
  async.auto({
    pubReady: function(cb) {
      adapterConfig.pubClient.once('ready', function (){

        // Remove the pre-connection listeners.
        adapterConfig.pubClient.removeListener('end', onPubPreConnectionEnd);
        adapterConfig.pubClient.removeListener('error', onPreConnectionError);

        // Add an "end" event listener.
        adapterConfig.pubClient.on('end', function(){

          // If Sails is exiting, ensure that this client won't try to reconnect, then return.
          if (app._exiting) {
            adapterConfig.pubClient.end(true);
            return;
          }

          // If a `sails.hooks.sockets.onRedisDisconnect()` method is supplied, run it.
          if (_.isFunction(adapterConfig.onRedisDisconnect)) {
            adapterConfig.onRedisDisconnect();
          }
          // Otherwise just log a message about the client being disconnected.
          else {
            app.log.error('Redis socket "'+ (adapterConfig.pubClientName || 'pub') +'" server went off-line...');
          }
        });

        // Log "error" messages as verbose, because when they come, they tend to fill up the logs (e.g. reconnection attempt errors).
        adapterConfig.pubClient.on('error', function(err){app.log.verbose('Redis session "'+ (adapterConfig.pubClientName || 'pub') +'" server reported error: ', err.stack);});

        // Log the "reconnect" message.
        adapterConfig.pubClient.on('ready', function(){
          // If a `sails.hooks.sockets.onRedisReconnect()` method is supplied, run it.
          if (_.isFunction(adapterConfig.onRedisReconnect)) {
            adapterConfig.onRedisReconnect();
          }
          // Otherwise just log a message about the client reconnecting.
          else {
            app.log.error('Redis session "'+ (adapterConfig.pubClientName || 'pub') +'" server came back on-line...');
          }
        });

        // Log a message in silly mode indicating that the client connected.
        app.log.silly('ad hoc redis client ready ('+ (adapterConfig.pubClientName || 'pub') +') (%d)', app.config.port);

        return cb();
      });
    },
    subReady: function(cb) {
      adapterConfig.subClient.once('ready', function (){

        // Remove the pre-connection listeners.
        adapterConfig.subClient.removeListener('end', onSubPreConnectionEnd);
        adapterConfig.subClient.removeListener('error', onPreConnectionError);

        // Add an "end" event listener.
        adapterConfig.subClient.on('end', function(){

          // If Sails is exiting, ensure that this client won't try to reconnect, then return.
          if (app._exiting) {
            adapterConfig.subClient.end(true);
            return;
          }

          // If a `sails.hooks.sockets.onRedisDisconnect()` method is supplied, run it.
          if (_.isFunction(adapterConfig.onRedisDisconnect)) {
            adapterConfig.onRedisDisconnect();
          }
          // Otherwise just log a message about the client being disconnected.
          else {
            app.log.error('Redis socket "'+ (adapterConfig.subClientName || 'sub') +'" server went off-line...');
          }
        });

        // Log "error" messages as verbose, because when they come, they tend to fill up the logs (e.g. reconnection attempt errors).
        adapterConfig.subClient.on('error', function(err){app.log.verbose('Redis session "'+ (adapterConfig.subClientName || 'sub') +'" server reported error: ', err.stack);});

        // Log the "reconnect" message.
        adapterConfig.subClient.on('ready', function(){

          // If a `sails.hooks.sockets.onRedisReconnect()` method is supplied, run it.
          if (_.isFunction(adapterConfig.onRedisReconnect)) {
            adapterConfig.onRedisReconnect();
          }
          // Otherwise just log a message about the client reconnecting.
          else {
            app.log.error('Redis session "'+ (adapterConfig.subClientName || 'sub') +'" server came back on-line...');
          }
        });

        // Log a message in silly mode indicating that the client connected.
        app.log.silly('ad hoc redis client ready ('+ (adapterConfig.subClientName || 'sub') +') (%d)', app.config.port);

        return cb();
      });
    }
  }, done);


};
