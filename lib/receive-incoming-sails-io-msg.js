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

    // Access to underlying SIO socket
    socket  : env.socket,

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

  env.app.log.verbose('Interpreting socket.io message as virtual request to "%s %s"...', requestContext.method, requestContext.url);





  var responseContext = {


    /**
     * This `_clientCallback` function we provide here will be used by Sails core as a final step
     * when trying to run methods like `res.send()`.
     *
     * Since Socket.io v1.x does not support streaming socket messages out of the box,
     * currently we'll just use this callback vs passing in a stream (so the client response
     * stream will just be buffered to build up clientRes.body)
     *
     * IMPORTANT:
     * The `clientRes` provided here is a Readable client response stream, not the same `res`
     * that is available in userland code.
     */

    _clientCallback: function _clientCallback(clientRes) {

      // If socket.io callback does not exist as a valid function, don't bother responding.
      if (!_.isFunction(options.socketIOClientCallback)) {
        return;
      }


      // TODO:
      // Try out http://socket.io/blog/introducing-socket-io-1-0/#socket.io-stream
      // to explore how we could make it work with Sails.
      // (the old way in 0.9 was streams1 style, just emitting `data` and `end` messages)

      // Backwards compat. for the 0.9.0 version of the sails.io browser SDK
      // (triggers callback with ONLY the response body)
      if (!semver.satisfies(sdk.version, '>=0.10.0')) {
        options.socketIOClientCallback(clientRes.body);
        return;
      }

      // Modern behavior
      // (builds a complete simulation of an HTTP response.)
      var jwr = {
        body: clientRes.body
      };

      // Allow headers and status code to be disabled to allow for squeezing
      // out a little more performance when relevant (and reducing bandwidth usage).
      // To achieve this, set `sails.config.sockets.sendResponseHeaders=false` and/or
      // `sails.config.sockets.sendStatusCode=false`.
      if (env.app.config.sockets.sendResponseHeaders) {
        jwr.headers = clientRes.headers;
      }
      if (env.app.config.sockets.sendStatusCode) {
        jwr.statusCode = clientRes.statusCode;
      }

      // Send down response.
      options.socketIOClientCallback(jwr);
      return;
    },

    /**
     * Access to underlying socket
     *
     * @api public
     */
    socket: env.socket,


    /**
     * Publish some data to a room
     *
     * @param {String} room
     * @param {Object} data
     *
     * @api public
     */

    broadcast: function broadcastMessage (room, data) {
      req.socket.broadcast.to(room).json.send(data);
      return res;
    }

    // TODO: add the other socket-specific methods

  };

  // Finally, lob a virtual request at the interpreter
  env.app.router.route(requestContext, responseContext);










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
      details: detailedErrorMsg
    };

    // Log parse error
    env.log.error(error);

    // If callback is invalid or non-existent:
    if ( !_.isFunction(options.socketIOClientCallback) ) {
      // Emit parse error
      env.socket.emit('sails:parseError', error);
      return;
    }

    // Otherwise just send the error directly to the callback...
    return options.socketIOClientCallback(error);
  }

};


