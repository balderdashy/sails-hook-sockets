/**
 * Module dependencies
 */

var ToReceiveIncomingSailsIOMsg = require('./receive-incoming-sails-io-msg');



module.exports = function ToHandleNewConnection(app){

  // Set the environment for `receiveIncomingSailsIOMsg`
  var receiveIncomingSailsIOMsg = ToReceiveIncomingSailsIOMsg(app);

  return function onConnect (socket){


    // Run `onConnect` lifecycle event
    (function runOnConnectListener(){
      if (!app.config.sockets.onConnect) return;

      app.log.warn('`sails.config.sockets.onConnect` has been deprecated, and support will be removed in an upcoming release. See the v0.11 migration guide for more information.');
      app.log.warn('(running it for you this time)');

      _loadSessionFromSocket(socket, app, function finishedLoading(err, session, sessionId){
        // If an error occurred loading the session, log what happened
        if (err) {
          app.log.warn('A socket connected, but the session could not be loaded to pass to configured handler: `sails.config.sockets.onConnect()`.  Will run handler with a fake, empty session.  Details:\n',err);
          session = {};
        }
        // Then run lifecycle callback
        app.config.sockets.onConnect(session, socket);
      });
    })();


    // Bind disconnect handler
    socket.on('disconnect', function onSocketDisconnect(){

      // Configurable custom onDisconnect logic here
      // (default: do nothing)
      if (!app.config.sockets.onDisconnect) return;

      _loadSessionFromSocket(socket, app, function finishedLoading(err, session, sessionId){
        // If an error occurred loading the session, log what happened
        if (err) {
          app.log.warn('Socket disconnected, but session could not be loaded to pass to configured disconnect handler: `sails.config.sockets.onDisconnect()`.  Will pass a fake, empty session as argument to lifecycle callback.  Details:\n',err);
          session = {};
          sessionId = undefined;
        }

        // Then run lifecycle callback
        app.config.sockets.afterDisconnect(session, socket, function (err) {
          if (err) {
            app.log.error('Error in `sails.config.sockets.afterDisconnect` lifecycle callback:',err);
            return;
          }

          // Save the session if necessary/possible
          if (!app.session || !sessionId) return;
          app.session.set(sessionId, session, function (err){
            if (err) {
              app.log.error('Error saving session in `sails.config.sockets.afterDisconnect`:',err);
              return;
            }
          });
        });

      }); //</loadSessionFromSocket>

    }); //</onSocketDisconnect>


    // Bind socket request handlers
    (function bindRequestHandlersForMajorHttpMethods(bindSocketRequestHandler){
      bindSocketRequestHandler('get');
      bindSocketRequestHandler('post');
      bindSocketRequestHandler('put');
      bindSocketRequestHandler('delete');
      bindSocketRequestHandler('patch');
      bindSocketRequestHandler('options');
      bindSocketRequestHandler('head');
    })(function receiveMessage(eventName){
      socket.on(eventName, function (incomingSailsIOMsg, socketIOClientCallback){
        receiveIncomingSailsIOMsg({
          incomingSailsIOMsg: incomingSailsIOMsg,
          socketIOClientCallback: socketIOClientCallback,
          eventName: eventName,
          socket: socket
        });
      });
    }); // </bindRequestHandlersForMajorHttpMethods>

  }; //</onSocketConnect>
};



/**
 * Try to get a session instance for the provided socket
 * @param  {Socket} socket
 * @param  {Sails} app
 * @param  {Function} cb
 */

function _loadSessionFromSocket(socket, app, cb) {

  // Session hook not enabled, trigger the lifecycle callback with
  // a fake session object, but omit the third `sid` argument to the callback
  // to signal that it's not a real session.
  if (!app.session) {
    return cb(null, {}, undefined);
  }


  // If no cookie exists, generate one and set it on the handshake
  var hadToGenerateCookie;
  if (!socket.handshake.headers.cookie){
    socket.handshake.headers.cookie = app.session.generateNewSidCookie();
    hadToGenerateCookie = true;
    app.log.verbose(
      'Could not fetch session, since connecting socket ('+socket.id+') has no cookie (is this a cross-origin socket?)'+'\n'+
      'Generated a one-time-use cookie:'+ socket.handshake.headers.cookie+'and saved it on the socket handshake.'+'\n'+
      'This will start this socket off with an empty session, i.e. (req.session === {})'+'\n'+
      'That "anonymous" section will only last until the socket is disconnected unless you persist the session id in your database,'+'\n'+
      'or by setting the set-cookie response header for an HTTP request that you *know* came from the same user (etc)'+'\n'+
      'Alternatively, just make sure the socket sends a `cookie` header or query param when it initially connects.'
    );
  }


  // Try to parse the session id (`sid`) from the cookie
  var sid;
  try {
    sid = app.session.parseSessionIdFromCookie(socket.handshake.headers.cookie);
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
  // console.log('cookie:',socket.handshake.headers.cookie);
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

}
