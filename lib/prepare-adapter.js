/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
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

    (function async_if (async_if_cb){

      // Normally, the `adapter` configuration option is the string name of the module-
      // and this hook will require it for you automatically.
      if (typeof adapterModuleName === 'string') {
        return getAdapter(async_if_cb);
      }

      // However, you may also pass in the already-require-d adapter instance
      // (mainly useful for tests)
      return async_if_cb(null, adapterModuleName);

    })(function afterwards(err, SocketIOAdapter){
      if (err) return cb(err);

      // Build adapter config
      var adapterConfig = app.config.sockets;

      // Attach the adapter to socket.io.
      app.io.adapter(SocketIOAdapter(adapterConfig));


      // TODO: support redis dbs w/ passwords
      //
      // guillermo's example:
      //
      // var pub = redis.createClient(port, host, {auth_pass:"PASSWORD"});
      // var sub = redis.createClient(port, host, {detect_buffers: true, auth_pass:"PASSWORD"} );
      // io.adapter( redisAdapter({pubClient: pub, subClient: sub}) );


      // Old impl in sails 0.10:
      // ============================================================
      // var host = socketConfig.host || '127.0.0.1';
      // var port = socketConfig.port || 6379;

      // var pub = createRedisConnection(port, host);
      // var sub = createRedisConnection(port, host);
      // var client = createRedisConnection(port, host);

      // var storeConfig = {
      //   redisPub: pub,
      //   redisSub: sub,
      //   redisClient: client
      // };

      // // Add a pointer to the redis, required with Auth
      // if(socketConfig.pass) {
      //   storeConfig.redis = Redis;
      // }

      // io.set('store', new RedisStore(storeConfig));

      // /**
      //  * Creates a new Redis Connection if specified.
      //  *
      //  * Can be used to connect to remote server with authentication if
      //  * `pass` is declared in the socketConfig file.
      //  */

      // function createRedisConnection(port, host) {

      //   var socketConfig = sails.config.sockets;

      //   // Create a new client using the port, host and other options
      //   var client = Redis.createClient(port, host, socketConfig);

      //   // If a password is needed use client.auth to set it
      //   if (socketConfig.pass) {
      //     client.auth(socketConfig.pass, function(err) {
      //       if (err) throw err;
      //     });
      //   }

      //   // If a db is set select it on the client
      //   if (socketConfig.db) {
      //     client.select(socketConfig.db);
      //   }

      //   return client;
      // }
      // ============================================================

      return cb();
    });

  };


  /**
   * @return {SocketIOAdapter}
   * @api private
   */
  function _getAdapter(cb){

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
        'There is an issue with "'+adapterModuleName+'" the Socket.io adapter installed in your project\'s '+
        '`node_modules/` folder. Make sure you are using a stable, supported Socket.io '+
        'adapter compatible w/ Socket.io v1.2.\n'+
        'Error details:\n'+
        util.inspect(e.stack || e, false, null)
      ));
    }

    return cb(null, SocketIOAdapter);
  }


};
