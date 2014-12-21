/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var ERRORPACK = require('./errors');

module.exports = function (app){

  return function prepareAdapter(options, cb){

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
        'npm install '+adapterModuleName+' --save'+'\n'+
        'Error details:\n'+e.message
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


    // Build adapter config
    var adapterConfig = {};

    // Attach the adapter to socket.io.
    app.io.adapter(SocketIOAdapter(adapterConfig));

    return cb();

    // var pub = redis.createClient(port, host, {auth_pass:"PASSWORD"});
    // var sub = redis.createClient(port, host, {detect_buffers: true, auth_pass:"PASSWORD"} );
    // io.adapter( redisAdapter({pubClient: pub, subClient: sub}) );

  };
};
