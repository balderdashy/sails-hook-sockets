/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var semver = require('semver');
var parseSdkMetadata = require('./parse-sdk-metadata');


/**
 * Parse an incoming Socket.io message (usually from the sails.io.js client),
 * build up Socket.io-specific properties for the request object, then feed
 * that to the request interpreter in Sails core by calling `sails.request`.
 *
 * @required  {Object} options.incomingSailsIOMsg
 * @required  {Function} options.socketIOClientCallback
 * @required  {String} options.eventName
 *
 * @required  {Function+Object} env.log
 * @required  {Object} env.app
 * @required  {Object} env.socket
 */

module.exports = function receiveIncomingSailsIOMsg(options, unused, env){
  env.log.verbose('Receiving incoming message from Socket.io: ', options.incomingSailsIOMsg);

  // If invalid callback function specified, freak out
  // (it's ok to NOT include a callback, but if it exists, it should be a function)
  if (options.socketIOClientCallback && !_.isFunction(options.socketIOClientCallback)) {
    delete options.socketIOClientCallback;
    return respondWithParseError('Could not parse request- callback may be omitted... but if provided, it must be a function.');
  }

  // Check that URL is specified
  if (!options.incomingSailsIOMsg.url) {
    return respondWithParseError(util.format('No url provided in request: %s',options.incomingSailsIOMsg));
  }

  // Check that URL is valid
  if (!_.isString(options.incomingSailsIOMsg.url)) {
    return respondWithParseError(util.format('Invalid url provided: %s',options.incomingSailsIOMsg.url));
  }

  // TODO: double check we can omit the JSON-parsing bit

  // Grab the metadata for the SDK
  var sdk = parseSdkMetadata(env.socket.handshake);


  // Use heuristic to guess forwarded ip:port (using `x-forwarded-for` header if IIS)
  var ip;
  var port;
  try {
    var forwardedFor = env.socket.handshake.headers['x-forwarded-for'];
    forwardedFor = forwardedFor && forwardedFor.split(':') || [];
    ip = forwardedFor[0] || (env.socket.handshake.address && env.socket.handshake.address.address);
    port = forwardedFor[1] || (env.socket.handshake.address && env.socket.handshake.address.port);
  }
  catch (e) {
    env.log.silly('Unable to parse IP / port using x-forwarded-for header');
  }


  // Start building up the request options which we'll pass into the interpreter:
  var requestContext = {

    transport: 'socket.io', // TODO: consider if this is really helpful or just a waste of LoC

    protocol: 'ws', // TODO: consider if this is really helpful or just a waste of LoC

    isSocket: true,

    ip      : ip,

    port    : port,

    socket  : socket,

    url     : options.incomingSailsIOMsg.url,

    method  : options.eventName,

    // Attached data becomes simulated HTTP body (`req.body`)
    // (allow `params` or `data` to be specified for backwards/sideways-compatibility)
    body    : _.extend({}, options.incomingSailsIOMsg.params || {}, options.incomingSailsIOMsg.data || {}),

    // Allow optional headers
    headers: _.defaults({

      host: env.app.config.host

    }, options.incomingSailsIOMsg.headers || {}),


  };


  var responseContext = {

    // quick hack
    send: function sendSimpleResponse (body) {

      // Backwards compat. for the 0.9.0 version of the sails.io browser SDK
      // (triggers callback with ONLY the response body)
      if (!semver.satisfies(sdk.version, '>=0.10.0')) {
        options.socketIOClientCallback(body);
        return;
      }

      // Modern behavior
      // (builds a complete simulation of an HTTP response.)
      var responseData = {
        body: body
      };

      // Allow headers and status code to be disabled to allow for squeezing
      // out a little more performance when relevant (and reducing bandwidth usage).
      // To achieve this, set `sails.config.sockets.sendResponseHeaders=false` and/or
      // `sails.config.sockets.sendStatusCode=false`.
      if ( typeof env.app.config.sockets === 'object' ) {
        if (env.app.config.sockets.sendResponseHeaders) {
          responseData.headers = {}; /* TODO: get res.headers from core */
        }
        if (env.app.config.sockets.sendStatusCode) {
          responseData.statusCode = 200; /* TODO: get res.statusCode from core */
        }
      }

      // Send down response.
      options.socketIOClientCallback(responseData);
      return;
    }
    // )
  };


  // TODO: Load the session
  // (this could happen in core too)

  // TODO: add all the other methods in core, not here!

  // TODO: Streamify req/res in core, not here!



  // Finally, lob a virtual request at the interpreter
  sails.emit('router:request', requestContext, responseContext);

  // env.app.router.route(requestOps, {
  //   _cb: optoins.socketIOClientCallback
  // });


  // Finally, stream a virtual request through the interpreter
  // var __clientRes = env.app.request(incomingSailsIOMsg.url, incomingSailsIOMsg.data);
  // return __clientRes;










  /**
   * Send a parse error back over the socket.
   * If a callback was provided by the socket.io client, it will be used,
   * but otherwise a low-level event will be emitted (since otherwise there's
   * no way to communicate with the client)
   *
   * Relies on closure scope for `options` and `env`.
   */

  function respondWithParseError (detailedErrorMsg) {

    var error = {
      message: 'Failed to parse incoming socket.io request.',
      details: detailedErrorMsg,
      code: 'E_PARSE_SOCKETIO_MSG'
    };

    // Log parse error
    env.log.error(error);

    // If callback is invalid or non-existent:
    if ( !_.isFunction(options.socketIOClientCallback) ) {
      // Emit parse error
      env.socket.emit('_sails:error:4xx', error);
      return;
    }

    // Otherwise just send the error directly to the callback...
    return options.socketIOClientCallback(error);
  }

};


