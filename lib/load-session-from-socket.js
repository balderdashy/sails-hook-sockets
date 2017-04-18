/**
 * Try to get a session instance for the provided socket handshake
 * @param  {Object} socketHandshake
 * @param  {Sails} app
 * @param  {Function} cb
 */

module.exports = function loadSessionFromSocket(socketHandshake, app, cb) {

  // console.log('--------- Attempting to load session using cookie in handshake.');
  // console.log('Here are all of the things in the handshake:',socketHandshake);
  // console.log('Here are all of the headers in the handshake:',socketHandshake.headers);
  // console.log('------------^^-------------^^----------^^------------^^--------');
  // app.log.silly('Stack trace:', (new Error('Called from here')).stack);

  // Session hook not enabled or disabled for this request, trigger the lifecycle callback with
  // a fake session object, but omit the third `sid` argument to the callback
  // to signal that it's not a real session.
  //
  // Note: `nosession` cannot currently be relied upon AS A HEADER with browser (e.g. Google Chrome)
  // or browser-based (e.g. React Native) clients.  (So note that we also look for it in the querystring.)
  //
  // See:
  // • https://github.com/socketio/engine.io-client/issues/554
  // • https://trello.com/c/7oqnpaxT/88-verify-that-extraheaders-is-actually-still-100-fixed-for-browser-usage-in-socket-io-client-engine-io-client-and-if-so-1-update-t
  if (!app.session || socketHandshake.headers.nosession || socketHandshake.query.nosession) {
    return cb(null, {}, undefined);
  }


  // If no cookie exists, generate one and set it on the handshake
  var hadToGenerateCookie;
  if (!socketHandshake.headers.cookie){
    socketHandshake.headers.cookie = app.session.generateNewSidCookie();
    hadToGenerateCookie = true;
    // Display a warning in verbose mode if a connection was made without a cookie.
    app.log.verbose(
      'Could not fetch session, since connecting socket has no cookie in its handshake.'+'\n'+
      'Generated a one-time-use cookie:\n'+
      socketHandshake.headers.cookie+'\n'+
      'and saved it on the socket handshake.\n'+
      '\n'+
      '> This means the socket started off with an empty session, i.e. (req.session === {})'+'\n'+
      '> That "anonymous" session will only last until the socket is disconnected.  To work around this,\n'+
      '> make sure the socket sends a `cookie` header or query param when it initially connects.\n'+
      '> (This usually arises due to using a non-browser client such as a native iOS/Android app,\n'+
      '> React Native, a Node.js script, or some other connected device.  It can also arise when\n'+
      '> attempting to connect a cross-origin socket in the browser, particularly for Safari users.\n'+
      '> To work around this, either supply a cookie manually, or ignore this message and use an\n'+
      '> approach other than sessions-- e.g. an auth token.)'
    );
  }


  // Try to parse the session id (`sid`) from the cookie
  var sid;
  try {
    sid = app.session.parseSessionIdFromCookie(socketHandshake.headers.cookie);
  }
  catch (e) {
    return cb((function _createError(){
      var err = new Error('Could not parse session id from cookie of connecting socket, and then failed again when trying to use a generated cookie. Something has possibly gone wrong with your session store configuration.');
      err.code = 'E_SESSION';
      return err;
    })());
  }

  // Load session
  if (!hadToGenerateCookie) {
    return app.session.get(sid, function (err, session) {
      return cb(err, session, sid);
    });
  }

  // If we had to generate a cookie, we must persist the session
  return app.session.set(sid, {
    cookie: {
      // Prevent access from client-side javascript
      httpOnly: true,

      // Restrict to path
      path: '/'
    }
  }, function (err, session){
    return cb(err, session, sid);
  });

};
