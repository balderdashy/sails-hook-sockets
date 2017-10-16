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

    //
    // The adapter is installed in the node_modules directory of the actual app using
    // this instance of the sails runtime.  This allows a user to swap out adapters as
    // needed, installing new adapters and upgrading the version of existing adapters
    // without waiting for a new Sails release.
    //

    _getAdapter(adapterModuleName, function (err, SocketIOAdapter, pathToAdapterDependency){
      if (err) return cb(err);

      // Build adapter config
      var adapterConfig = _.clone(app.config.sockets.adapterOptions);

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
        var adminAdapterConfig = _.clone(app.config.sockets.adapterOptions);
        adminAdapterConfig.pubClient = adminAdapterConfig.adminPubClient;
        adminAdapterConfig.subClient = adminAdapterConfig.adminSubClient;

        return connectToAdminBus({
          moduleName: adapterModuleName,
          modulePath: pathToAdapterDependency,
          config: adminAdapterConfig
        }, cb);

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
