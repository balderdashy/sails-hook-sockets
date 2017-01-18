/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var _ = require('@sailshq/lodash');
var ERRORPACK = require('./errors');



module.exports = function (app){

  var prepareDriver = require('./prepare-driver')(app);
  var connectToAdminBus = require('./connect-to-admin-bus')(app);

  return function prepareAdapter(cb){

    var adapterModuleName = app.config.sockets.adapter;

    // If using the default memory adapter, we don't need to do anything else.
    if (!adapterModuleName) {
      return cb();
    }

    // ------------------------------------------------------------------------------------------
    // The adapter is installed in the node_modules directory of the actual app using
    // this instance of the sails runtime.  This allows a user to swap out adapters as
    // needed, installing new adapters and upgrading the version of existing adapters
    // without waiting for a new Sails release.
    //
    // NOTE THAT, AS OF SAILS V1, SOCKET.IO ADAPTERS SHOULD BE PASSED IN DIRECTLY VIA `sails.config.sockets.adapter`!
    // In other words, it will work exactly like adapterModule.  Support for passing it in as a string
    // will get a deprecation message, and will be eventually removed.  Same thing for code that passes in the
    // adapter module as `sails.config.sockets.adapterModule` (e.g. our tests) -- that code should
    // switch to using `sails.config.sockets.adapter` instead.
    //
    // TODO: implement that
    // ------------------------------------------------------------------------------------------


    (function _getAdapter(proceed){

      // ------------------------------------------------------------------------------------------
      // Normally, this hook will automatically require the adapter for you using the name supplied
      // in the `adapter` config setting.
      //
      // However, you may also pass in the already-require-d adapter instance as `adapterModule`
      // (mainly useful for tests), provided that you still set `adapter` so that the hook knows
      // what kind of adapter it is.
      // ------------------------------------------------------------------------------------------
      if (app.config.sockets.adapterModule) {
        return proceed(null, app.config.sockets.adapterModule, path.resolve(app.config.appPath, 'node_modules', adapterModuleName));
      }

      // Attempt to require the adapter.
      var SocketIOAdapter;
      try {
        SocketIOAdapter = require(path.resolve(app.config.appPath, 'node_modules', adapterModuleName));
      } catch (e) {
        return proceed(ERRORPACK.REQUIRE_SOCKETIO_ADAPTER(
          'There is an issue with "'+adapterModuleName+'", the Socket.io adapter installed in your project\'s '+
          '`node_modules/` folder. Make sure you are using a stable, supported Socket.io '+
          'adapter compatible w/ Socket.io v1.2.\n'+
          'Error details:\n'+
          util.inspect(e.stack || e, false, null)
        ));
      }

      return proceed(null, SocketIOAdapter, path.resolve(app.config.appPath, 'node_modules', adapterModuleName));

    })(function (err, SocketIOAdapter, pathToAdapterDependency){
      if (err) { return cb(err); }

      // Build adapter config
      var adapterConfig = _.clone(app.config.sockets.adapterOptions);

      //
      // Prepare the underlying driver for the socket.io adapter (e.g. Redis)
      // This may create Redis client connections and save them as `pubClient`
      // and `subClient` on the adapter config.  Then when we initialize
      // the adapter below, those values may be used instead of the adapter
      // creating clients for us.
      //
      prepareDriver({
        moduleName: adapterModuleName,
        modulePath: pathToAdapterDependency,
        config: adapterConfig
      }, function(err) {
        if (err) {
          return cb(err);
        }

        // Initialize the socket.io adapter (e.g. socket.io-redis)
        var sioAdapter = SocketIOAdapter(adapterConfig);
        // See https://github.com/Automattic/socket.io-redis/issues/21#issuecomment-60315678
        try {
          sioAdapter.prototype.on('error', function (e){
            app.log.verbose('Socket.io adapter emitted error event:',e);
          });
        }
        catch (e) {
          app.log.error('Error building socket.io adapter:',e);
        }

        // Attach the adapter to socket.io.
        app.io.adapter(sioAdapter);

        // Set up a connection to the admin bus.
        var adminAdapterConfig = _.defaults(_.clone(app.config.sockets.adminAdapterOptions), _.omit(app.config.sockets.adapterOptions, 'pubClient', 'subClient'));
        return connectToAdminBus({
          moduleName: adapterModuleName,
          modulePath: pathToAdapterDependency,
          config: adminAdapterConfig
        }, cb);

      });//</prepareDriver>

    });//</invoked self-calling function :: _getAdapter(<-)>

  };//</prepareAdapter>

};
