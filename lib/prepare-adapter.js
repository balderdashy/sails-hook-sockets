/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var _ = require('lodash');
var ERRORPACK = require('./errors');



module.exports = function (app){

  return function prepareAdapter(cb){

    var adapterModuleName = app.config.sockets.adapter;

    // If using the default memory adapter, we don't need to do anything else.
    if (!adapterModuleName) {
      return cb();
    }

    //
    // The adapter is installed in the node_modules directory of the actual app using
    // this instance of the sails runtime.  This allows a user to swap out adapters as
    // needed, installing new adapters and upgrading the version of existing adapters
    // without waiting for a new Sails release.
    //

    _getAdapter(adapterModuleName, function (err, SocketIOAdapter, pathToAdapterDependency){
      if (err) return cb(err);

      // Build adapter config
      var adapterConfig = _.cloneDeep(app.config.sockets.adapterOptions);

      //
      // Handle special cases:
      //

      (function handleSpecialCases(cb){
        // For redis:
        // ============================================================
        if (adapterModuleName === 'socket.io-redis') {

          // Create raw redis clients if necessary
          var rawClientsNecessary = adapterConfig.pass || adapterConfig.db;
          if (!rawClientsNecessary) {
            return cb();
          }

          // Borrow access to the `redis` module from socket.io-redis
          var redis;
          try {
            redis = require(path.resolve(pathToAdapterDependency, 'node_modules/redis'));
          }
          catch (e){
            return cb(e);
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
            detect_buffers: true,
            return_buffers: true
          }));
          adapterConfig.subClient = adapterConfig.subClient || redis.createClient(adapterConfig.port || 6379, adapterConfig.host || '127.0.0.1', _.extend({}, redisClientOpts,{
            detect_buffers: true,
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

      })(function (err){
        if (err) {
          return cb(err);
        }

        var sioAdapter = SocketIOAdapter(adapterConfig);
        // See https://github.com/Automattic/socket.io-redis/issues/21#issuecomment-60315678
        try {
          sioAdapter.prototype.on('error', function (e){
            app.log.error('Socket.io adapter emitted error event:',e);
          });
        }
        catch (e) {
          app.log.error('Error building socket.io addapter:',e);
        }

        // Attach the adapter to socket.io.
        app.io.adapter(sioAdapter);

        return cb();
      });

    });

  };


  /**
   * @return {SocketIOAdapter}
   * @api private
   */
  function _getAdapter(adapterModuleName, cb){

    // Normally, the `adapter` configuration option is the string name of the module-
    // and this hook will require it for you automatically.
    //
    // However, you may also pass in the already-require-d adapter instance
    // (mainly useful for tests)
    if (app.config.sockets.adapterModule) {
      return cb(null, app.config.sockets.adapterModule, path.resolve(app.config.appPath, 'node_modules', adapterModuleName));
    }


    // Determine the path to the adapter's package.json file.
    var pathToAdapterPackageJson = path.resolve(app.config.appPath, 'node_modules', adapterModuleName ,'package.json');

    // Attempt to require the adapter's package.json file.
    var adapterPackageJson;
    try {
      adapterPackageJson = require(pathToAdapterPackageJson);
    }
    catch (e) {
      // Negotiate error
      //
      // Look for MODULE_NOT_FOUND error from Node core- but make sure it's a require error
      // from the actual module itself, and not one of its dependencies! To accomplish that-
      // check that the error message string ends in `/package.json'` (note the trailing apostrophe)
      if (e.code === 'MODULE_NOT_FOUND' && typeof e.message==='string' && e.message.match(/\/package\.json\'$/)) {
        return cb(ERRORPACK.SIO_ADAPTER_MODULE_NOT_FOUND(
        'Expected the configured socket.io adapter ("'+adapterModuleName+'") to be installed '+
        'in your app\'s `node_modules/` folder.'+'\n'+
        'Do you have this module installed in your project as a dependency?'+'\n'+
        'If not, try running:\n'+
        'npm install '+adapterModuleName+' --save'+'\n'
        // 'Error details:\n'+e.message
        ));
      }
      return cb(ERRORPACK.REQUIRE_SOCKETIO_ADAPTER(
        'Unexpected error requiring the configured socket.io adapter ("'+adapterModuleName+'").\n'+
        'Error details:\n'+
        (e.stack || util.inspect(e))
      ));
    }

    // Use the "main" described in its package.json file to determine the adapter's main module.
    // (if not defined, try `index.js`)
    var pathToAdapterDependency;
    pathToAdapterDependency = path.resolve(app.config.appPath, 'node_modules', adapterModuleName, adapterPackageJson.main||'index.js');

    // Now attempt to require the adapter module itself.
    var SocketIOAdapter;
    try {
      SocketIOAdapter = require(pathToAdapterDependency);
    } catch (e) {
      return cb(ERRORPACK.REQUIRE_SOCKETIO_ADAPTER(
        'There is an issue with "'+adapterModuleName+'", the Socket.io adapter installed in your project\'s '+
        '`node_modules/` folder. Make sure you are using a stable, supported Socket.io '+
        'adapter compatible w/ Socket.io v1.2.\n'+
        'Error details:\n'+
        util.inspect(e.stack || e, false, null)
      ));
    }

    return cb(null, SocketIOAdapter, path.resolve(app.config.appPath, 'node_modules', adapterModuleName));
  }


};
