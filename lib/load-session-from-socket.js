/**
 * Try to get a session instance for the provided socket handshake
 * @param  {Object} socketHandshake
 * @param  {Sails} app
 * @param  {Function} cb
 */

module.exports = function loadSessionFromSocket(socketHandshake, app, cb) {

  // console.log('--------- Attempting to load session using cookie in handshake:',socketHandshake.headers.cookie);

  // Session hook not enabled or disabled for this request, trigger the lifecycle callback with
  // a fake session object, but omit the third `sid` argument to the callback
  // to signal that it's not a real session.
  if (!app.session || socketHandshake.headers.nosession) {
    return cb(null, {}, undefined);
  }


  // If no cookie exists, generate one and set it on the handshake
  var hadToGenerateCookie;
  if (!socketHandshake.headers.cookie){
    socketHandshake.headers.cookie = app.session.generateNewSidCookie();
    hadToGenerateCookie = true;
    // Display a warning in verbose mode if a connection was made without a cookie.
    app.log.verbose(
      'Could not fetch session, since connecting socket has no cookie (is this a cross-origin socket?)'+'\n'+
      'Generated a one-time-use cookie:'+ socketHandshake.headers.cookie+'and saved it on the socket handshake.'+'\n'+
      'This will start this socket off with an empty session, i.e. (req.session === {})'+'\n'+
      'That "anonymous" section will only last until the socket is disconnected unless you persist the session id in your database,'+'\n'+
      'or by setting the set-cookie response header for an HTTP request that you *know* came from the same user (etc)'+'\n'+
      'Alternatively, just make sure the socket sends a `cookie` header or query param when it initially connects.'
    );
  }


  // Try to parse the session id (`sid`) from the cookie
  var sid;
  try {
    sid = app.session.parseSessionIdFromCookie(socketHandshake.headers.cookie);
  }
  catch (e) {
    return cb((function _createError(){
      var err = new Error('Could not parse session id from cookie of connecting socket, and then failed again when trying to use a generated cookie. Something has probably gone wrong with your session store configuration.');
      err.code = 'E_SESSION';
      return err;
    })());
  }

  // console.log('\n');
  // console.log('------------------------------------------------------------');
  // console.log('cookie:',socketHandshake.headers.cookie);
  // console.log('sid?',!!sid);
  // console.log('sid=',sid);
  // console.log('------------------------------------------------------------');

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
