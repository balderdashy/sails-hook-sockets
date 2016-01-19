/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var semver = require('semver');
var parseSdkMetadata = require('./parse-sdk-metadata');
var ERRORPACK = require('./errors');

/**
 * @required  {Object} app
 *
 * @return {Function}     [initialize]
 */
module.exports = function ToReceiveIncomingSailsIOMsg(app) {

  /**
   * Parse an incoming Socket.io message (usually from the sails.io.js client),
   * build up Socket.io-specific properties for the request object, then feed
   * that to the request interpreter in Sails core by calling `sails.request`.
   *
   * @required  {Object} options.incomingSailsIOMsg
   * @required  {Function} options.socketIOClientCallback
   * @required  {String} options.eventName
   * @required  {Object} options.socket
   */

  return function receiveIncomingSailsIOMsg(options) {
    app.log.verbose('Receiving incoming message from Socket.io: ', options.incomingSailsIOMsg);

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

    // Grab the metadata for the SDK
    var sdk = parseSdkMetadata(options.socket.handshake);

    // No more backwards-compatibility for clients < v0.11.0
    if (!semver.satisfies(sdk.version, '>=0.11.0')) {
      return respondWithParseError(util.format('Sails v0.11.x is not compatible with the socket.io/sails.io.js client SDK version you are using (%s). Please see the v0.11 migration guide on http://sailsjs.org for more information.',sdk.version));
    }


    // Use heuristic to guess forwarded ip:port (using `x-forwarded-for` header if IIS)
    var ip;
    var port;
    try {
      var forwardedFor = options.socket.handshake.headers['x-forwarded-for'];
      forwardedFor = forwardedFor && forwardedFor.split(':') || [];
      ip = forwardedFor[0] || (options.socket.handshake.address && options.socket.handshake.address.address);
      port = forwardedFor[1] || (options.socket.handshake.address && options.socket.handshake.address.port);
    }
    catch (e) {
      app.log.silly('Unable to parse IP / port using x-forwarded-for header');
    }


    // Start building up the request context which we'll pass into the interpreter in Sails core:
    var requestContext = {

      transport: 'socket.io', // TODO: consider if this is really helpful or just a waste of LoC

      protocol: 'ws', // TODO: consider if this is really helpful or just a waste of LoC

      isSocket: true,

      ip      : ip,

      port    : port,

      // Access to underlying SIO socket
      socket  : options.socket,

      url     : options.incomingSailsIOMsg.url,

      method  : options.eventName,

      // Attached data becomes simulated HTTP body (`req.body`)
      // (allow `params` or `data` to be specified for backwards/sideways-compatibility)
      body    : _.isArray(options.incomingSailsIOMsg.data) ? options.incomingSailsIOMsg.data : _.extend({}, options.incomingSailsIOMsg.params || {}, options.incomingSailsIOMsg.data || {}),

      // Allow optional headers
      headers: _.defaults({

        host: app.config.host,

        // Default the "cookie" request header to what was provided in the handshake.
        cookie: (function (){
          var _cookie;
          try {
            _cookie = options.socket.handshake.headers.cookie;
          }
          catch (e) {}
          // console.log('REQUEST to "%s %s" IS USING COOKIE:', options.eventName, options.incomingSailsIOMsg.url, _cookie);
          return _cookie;
        })(),

        nosession: options.socket.handshake.headers.nosession ? true : undefined,

      }, options.incomingSailsIOMsg.headers || {})

    };

    // app.log.verbose('Interpreting socket.io message as virtual request to "%s %s"...', requestContext.method, requestContext.url);
    // app.log.verbose('(cookie: %s)', requestContext.headers.cookie);

    // Set the `origin` header to what was provided in the handshake
    // (the origin header CANNOT BE OVERRIDDEN by sockets at virtual request-time-- only
    //  upon first connection.)
    if (requestContext.headers.origin){
      // TODO:
      // Document security reasons why `origin` may not be passed manually at virtual request-time.
      // Has to do w/ xdomain security concerns.
      app.log.verbose('Igoring provided `origin` header in virtual request from socket.io: It would not be safe to change `origin` for this socket now!');
    }
    requestContext.headers.origin = (function (){
      var _origin;
      try {
        _origin = options.socket.handshake.headers.origin;
      }
      catch (e){}
      return _origin;
    })();


    // console.log('handshake:',options.socket.handshake);
    app.log.verbose('Interpreting socket.io message as virtual request to "%s %s"...', requestContext.method, requestContext.url);



    // Start building up the response context which we'll pass into the interpreter in Sails core:
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

        // If no cookie was sent initially on the handshake, and a 'set-cookie' exists in response
        // headers, then save the cookie on the handshake (no need to send extra data over the wire
        // since we're maintaining a persistent connection on this side, plus this prevents client-side
        // js from accessing the cookie)
        //
        // This allows for anything relying on cookies (e.g. default `req.session` support)
        // to last as long as the socket connection (i.e. until the browser tab is closed)
        //
        // Note that we **STILL GENERATE A COOKIE** using socket.io middleware when the socket
        // initially connects.  This is so that by the time we run the `onConnect` lifecycle event,
        // it has access to the real session.  So in general, this should never fire.
        //
        // In the future, we may want to always reset the handshake's cookie based on the `set-cookie`
        // response header to allow for custom HTTP cookies to work completely via sockets, but that
        // should be evaluated carefully to avoid unexpected race conditions.
        try {
          if (!options.socket.handshake.headers.cookie && clientRes.headers['set-cookie']){
              options.socket.handshake.headers.cookie = clientRes.headers['set-cookie'][0];
          }
        }
        catch (e) {
          app.log.warn('Could not persist res.headers["set-cookie"] into the socket handshake:',e);
        }

        // If socket.io callback does not exist as a valid function, don't bother responding.
        if (!_.isFunction(options.socketIOClientCallback)) {
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
        if (app.config.sockets.sendResponseHeaders) {
          jwr.headers = clientRes.headers;
        }
        if (app.config.sockets.sendStatusCode) {
          jwr.statusCode = clientRes.statusCode;
        }

        // Remove 'set-cookie' header
        // (to prevent cookie from reaching client-side js)
        delete jwr.headers['set-cookie'];

        // TODO:
        // Try out http://socket.io/blog/introducing-socket-io-1-0/#socket.io-stream
        // to explore how we could make it work with Sails.
        // (the old way in 0.9 was streams1 style, just emitting `data` and `end` messages)

        // Send down response.
        options.socketIOClientCallback(jwr);
        return;
      }

    };


    // Finally, lob a virtual request at the interpreter
    app.router.route(requestContext, responseContext);










    /**
     * Send a parse error back over the socket.
     * If a callback was provided by the socket.io client, it will be used,
     * but otherwise a low-level event will be emitted (since otherwise there's
     * no way to communicate with the client)
     *
     * Relies on closure scope for `options` and `app`.
     */

    function respondWithParseError (detailedErrorMsg) {

      var error = ERRORPACK.PARSE_VIRTUAL_REQ('Failed to parse incoming socket.io request.');
      error.details = detailedErrorMsg;

      // Log parse error
      app.log.error(error);

      // If callback is invalid or non-existent:
      if ( !_.isFunction(options.socketIOClientCallback) ) {
        // Emit parse error
        options.socket.emit('sails:parseError', error);
        return;
      }

      // Otherwise just send the error directly to the callback...
      return options.socketIOClientCallback(error);
    }

  };


};
