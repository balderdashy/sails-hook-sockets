/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var semver = require('semver');
var parseSdkMetadata = require('./parse-sdk-metadata');



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

    // TODO: double check we can omit the JSON-parsing bit

    // Grab the metadata for the SDK
    var sdk = parseSdkMetadata(options.socket.handshake);


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
      body    : _.extend({}, options.incomingSailsIOMsg.params || {}, options.incomingSailsIOMsg.data || {}),

      // Allow optional headers
      headers: _.defaults({

        host: app.config.host,

        // Default the cookie header to what was provided in the handshake
        // (or generate a new cookie if necessary)
        cookie: (function (){
          var _cookie;
          try {
            _cookie = options.socket.handshake.headers.cookie;
          }
          catch (e) {}
          return _cookie;
        })(),

      }, options.incomingSailsIOMsg.headers || {})

    };


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

        // If a cookie exists in the res headers, then save it on the handshake and remove
        // it from the headers (no need to send extra data over the wire since we're maintaining
        // a persistent connection on this side)
        // console.log('clientRes.headers:',clientRes.headers);
        //options.socket.handshake.headers.cookie =

        // If socket.io callback does not exist as a valid function, don't bother responding.
        if (!_.isFunction(options.socketIOClientCallback)) {
          return;
        }

        // Backwards compat. for the 0.9.0 version of the sails.io browser SDK
        if (!semver.satisfies(sdk.version, '>=0.10.0')) {

          // (sails.io client @0.9.x expects stringified JSON rather than relying on socket.io
          //  to take care of it)
          try {
            clientRes.body = JSON.stringify(clientRes.body);
          }
          catch (e) {
            var errMsg =
            'Error stringifying object or array in response to socket.io request (using legacy v0.9 sails.io.js client) ::' +
            util.inspect(clientRes.body, false, null);
            app.log.warn(errMsg);
            clientRes.body = errMsg;
          }

          // (triggers callback with ONLY the response body)
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
        if (app.config.sockets.sendResponseHeaders) {
          jwr.headers = clientRes.headers;
        }
        if (app.config.sockets.sendStatusCode) {
          jwr.statusCode = clientRes.statusCode;
        }


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

      var error = {
        message: 'Failed to parse incoming socket.io request.',
        details: detailedErrorMsg
      };

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









// /**
//  * Create a session transaction
//  *
//  * Load data from the session store using the `sessionID` as parsed from the cookie.
//  * Mix-in the session.save() method for persisting the data back to the session store.
//  *
//  * Functionality is roughly equivalent to that of Connect's sessionStore middleware.
//  */

// function loadSession (req, cb) {

//   // If no cookie was provided, we'll give up trying to load the session.
//   // Stub out a fake Session object so that its methods exist, etc.
//   if (!req.headers.cookie) {
//     req._sails.log.verbose('Could not load session for request, because no cookie was provided.');
//     req._sails.log.verbose('This will result in an empty session, i.e. (req.session === {})');
//     req.session = {};
//     return cb();
//   }

//   // If sid doesn't exit in socket, we have to do a little work first to get it
//   // (or generate a new one-- and therefore a new empty session as well)
//   if (!socket.handshake.sessionID && !socket.handshake.headers.cookie) {

//     // If no cookie exists, generate a random one (this will create a new session!)
//     var generatedCookie = req._sails.config.session.key + '=' + uuid.v1();
//     req.headers.cookie = generatedCookie;
//     req._sails.log.verbose('Could not fetch session, since connecting socket (', socket.id, ') has no cookie.');
//     req._sails.log.verbose('Is this a cross-origin socket..?)');
//     req._sails.log.verbose('Generated a one-time-use cookie:', generatedCookie);
//     req._sails.log.verbose('This will result in an empty session, i.e. (req.session === {})');


//     // Convert cookie into `sid` using session secret
//     // Maintain sid in socket so that the session can be queried before processing each incoming message
//     socket.handshake.cookie = cookie.parse(generatedCookie);
//     // Parse and decrypt cookie and save it in the socket.handshake
//     socket.handshake.sessionID = parseSignedCookie(socket.handshake.cookie[sails.config.session.key], sails.config.session.secret);

//     // Generate and persist a new session in the store
//     SessionHook.generate(socket.handshake, function(err, sessionData) {
//       if (err) return cb(err);
//       sails.log.silly('socket.handshake.sessionID is now :: ', socket.handshake.sessionID);

//       // Provide access to adapter-agnostic `.save()`
//       return cb(null, new RawSession({
//         sid: sessionData.id,
//         data: sessionData
//       }));
//     });
//     return;
//   }


//   try {
//     // Convert cookie into `sid` using session secret
//     // Maintain sid in socket so that the session can be queried before processing each incoming message
//     socket.handshake.cookie = cookie.parse(socket.handshake.headers.cookie);
//     // Parse and decrypt cookie and save it in the socket.handshake
//     socket.handshake.sessionID = parseSignedCookie(socket.handshake.cookie[sails.config.session.key], sails.config.session.secret);
//   } catch (e) {
//     sails.log.error('Could not load session for socket #' + socket.id);
//     sails.log.error('The socket\'s cookie could not be parsed into a sessionID.');
//     sails.log.error('Unless you\'re overriding the `authorization` function, make sure ' +
//       'you pass in a valid `' + sails.config.session.key + '` cookie');
//     sails.log.error('(or omit the cookie altogether to have a new session created and an ' +
//       'encrypted cookie sent in the response header to your socket.io upgrade request)');
//     return cb(e);
//   }

//   // If sid DOES exist, it's easy to look up in the socket
//   var sid = socket.handshake.sessionID;

//   // Cache the handshake in case it gets wiped out during the call to SessionHook.get
//   var handshake = socket.handshake;

//   // Retrieve session data from store
//   SessionHook.get(sid, function(err, sessionData) {

//     if (err) {
//       sails.log.error('Error retrieving session from socket.');
//       return cb(err);
//     }

//     // sid is not known-- the session secret probably changed
//     // Or maybe server restarted and it was:
//     // (a) using an auto-generated secret, or
//     // (b) using the session memory store
//     // and so it doesn't recognize the socket's session ID.
//     else if (!sessionData) {
//       sails.log.verbose('A socket (' + socket.id + ') is trying to connect with an invalid or expired session ID (' + sid + ').');
//       sails.log.verbose('Regnerating empty session...');

//       SessionHook.generate(handshake, function(err, sessionData) {
//         if (err) return cb(err);

//         // Provide access to adapter-agnostic `.save()`
//         return cb(null, new RawSession({
//           sid: sessionData.id,
//           data: sessionData
//         }));
//       });
//     }

//     // Otherwise session exists and everything is ok.

//     // Instantiate RawSession (provides .save() method)
//     // And extend it with session data
//     else return cb(null, new RawSession({
//       data: sessionData,
//       sid: sid
//     }));
//   });
// }





// /**
//  * Constructor for the connect session store wrapper used by the sockets hook.
//  * Includes a save() method to persist the session data.
//  */
// function RawSession(options) {
//   var sid = options.sid;
//   var data = options.data;


//   /**
//    * [save description]
//    * @param  {Function} cb [description]
//    * @return {[type]}      [description]
//    */
//   this.save = function(cb) {

//     if (!sid) {
//       return _.isFunction(cb) && cb((function (){
//         var err = new Error('Could not save session');
//         err.code = 'E_SESSION_SAVE';
//         err.details = 'Trying to save session, but could not determine session ID.\n'+
//         'This probably means a requesting socket from socket.io did not send a cookie.\n'+
//         'Usually, this happens when a socket from an old browser tab  tries to reconnect.\n'+
//         '(this can also occur when trying to connect a cross-origin socket.)';
//         return err;
//       })());
//     }

//     // Merge data directly into instance to allow easy access on `req.session` later
//     _.defaults(this, data);

//     // Persist session
//     SessionHook.set(sid, _.cloneDeep(this), function(err) {
//       if (err) {
//         return _.isFunction(cb) && cb((function (){
//           err.code = 'E_SESSION_SAVE';
//           return err;
//         })());
//       }
//       return _.isFunction(cb) && cb();
//     });
//   };

//   // Set the data on this object, since it will be used as req.session
//   util.extend(this, options.data);
// }








// /**
//  * [loadSession description]
//  * @param  {[type]}   req [description]
//  * @param  {Function} cb  [description]
//  * @return {[type]}       [description]
//  */
// function loadSession (req, cb){

//   if (!req._sails || !req._sails.config.session) {
//     req.session = {};
//     (req._sails && req._sails.log && req._sails.log.verbose || console.log)('Skipping session...');
//     return cb();
//   }

//   // Populate req.session using shared session store
//   sails.session.fromSocket(req.socket, function sessionReady (err, session) {
//     if (err) return cb(err);

//     // Provide access to session data as req.session
//     req.session = session || {};

//     return cb();
//   });

//   // console.log('About to try and parse cookie...');

//   // // Decrypt cookie into session id using session secret to get `sessionID`.
//   // //
//   // // (this allows us to query the session before processing each incoming message from this
//   // // socket in the future)
//   // var cookie;
//   // var sessionID;
//   // try {

//   //   if (!req.headers.cookie) {
//   //     return cb((function _buildError(){
//   //       var err = new Error('No cookie sent with request');
//   //       return err;
//   //     })());
//   //   }

//   //   cookie = Cookie.parse(req.headers.cookie);

//   //   if (!req._sails.config.session.key) {
//   //     return cb((function _buildError(){
//   //       var err = new Error('No session key configured (sails.config.session.key)');
//   //       return err;
//   //     })());
//   //   }
//   //   if (!req._sails.config.session.secret) {
//   //     return cb((function _buildError(){
//   //       var err = new Error('No session secret configured (sails.config.session.secret)');
//   //       return err;
//   //     }()));
//   //   }

//   //   sessionID = parseSignedCookie(cookie[req._sails.config.session.key], req._sails.config.session.secret);
//   // } catch (e) {
//   //   return cb((function _buildError(){
//   //     var err = new Error('Cannot load session. Cookie could not be parsed:\n'+util.inspect(e&&e.stack));
//   //     err.code = 'E_PARSE_COOKIE';
//   //     err.status = 400;
//   //     return err;
//   //   })());
//   // }

//   // // Look up this socket's session id in the Connect session store
//   // // and see if we already have a record of 'em.
//   // req._sails.session.get(sessionID, function(err, sessionData) {

//   //   // An error occurred, so refuse the connection
//   //   if (err) {
//   //     return cb('Error loading session during socket connection! \n' + util.inspect(err, false, null));
//   //   }

//   //   // Cookie is present (there is a session id), but it doesn't
//   //   // correspond to a known session in the session store.
//   //   // So generate a new, blank session.
//   //   if (!sessionData) {
//   //     var newSession = new ConnectSession({sessionID: sessionID}, {
//   //       cookie: {
//   //         // Prevent access from client-side javascript
//   //         httpOnly: true
//   //       }
//   //     });
//   //     req._sails.log.verbose("Generated new session for socket....", {sessionID: sessionID});
//   //     req.session = newSession;
//   //     return cb();
//   //   }

//   //   // Parsed cookie matches a known session- onward!
//   //   //
//   //   // Instantiate a session object, passing our just-acquired session handshake
//   //   var existingSession = new ConnectSession({sessionID: sessionID}, sessionData);
//   //   req._sails.log.verbose("Connected socket to existing session....");
//   //   req.session = existingSession;
//   //   cb();
//   // });
// }



// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// When err.code === E_PARSE_COOKIE
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// var TROUBLESHOOTING =
// 'Perhaps you have an old browser tab open?  In that case, you can ignore this warning.' + '\n' +
// 'Otherwise, are you are trying to access your Sails.js ' + '\n' +
// 'server from a socket.io javascript client hosted on a 3rd party domain?  ' + '\n' +
// ' *-> You can override the cookie for a user entirely by setting ?cookie=... in the querystring of ' + '\n' +
// 'your socket.io connection url on the client.' + '\n' +
// ' *-> You can send a JSONP request first from the javascript client on the other domain ' + '\n' +
// 'to the Sails.js server to get the cookie, then connect the socket.' + '\n';
// var socketSpecificMsg =
// 'Unable to parse the cookie that was transmitted for an incoming socket.io connect request.'+
// '\n' + TROUBLESHOOTING + '\n'+
// '';
