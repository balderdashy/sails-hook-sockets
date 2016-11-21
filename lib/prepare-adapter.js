/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var _ = require('lodash');
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
      // Normally, the `adapter` configuration option is the string name of the module-
      // and this hook will require it for you automatically.
      //
      // However, you may also pass in the already-require-d adapter instance
      // (mainly useful for tests)
      // ------------------------------------------------------------------------------------------
      //
      // ^^^TODO this is wrong and out of date, as far as sails v1-- but the implementation is not in place yet
      if (app.config.sockets.adapterModule) {
        return proceed(null, app.config.sockets.adapterModule, path.resolve(app.config.appPath, 'node_modules', adapterModuleName));
      }

      // Attempt to require the adapter.
      var SocketIOAdapter;
      try {
        SocketIOAdapter = require(app.config.sockets.adapter);
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
      var adapterConfig = _.cloneDeep(app.config.sockets.adapterOptions);

      //
      // Prepare the underlying driver for the socket.io adapter (e.g. Redis)
      //
      prepareDriver({
        moduleName: adapterModuleName,
        modulePath: pathToAdapterDependency,
        config: adapterConfig
      }, function(err) {
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

        // Set up a connection to the admin bus
        var adminAdapterConfig = _.cloneDeep(app.config.sockets.adapterOptions);

        return connectToAdminBus({
          moduleName: adapterModuleName,
          modulePath: pathToAdapterDependency,
          config: adminAdapterConfig
        }, cb);

      });//</prepareDriver>

    });//</invoked self-calling function :: _getAdapter(<-)>

  };//</prepareAdapter>

};
