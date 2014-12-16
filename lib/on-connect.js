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
      _loadSessionFromSocket(socket, app, function finishedLoading(err, session){
        // If an error occurred loading the session, log what happened
        if (err) {
          app.log.warn('A socket connected, but the session could not be loaded to pass to configured disconnect handler `sails.config.sockets.onConnect()`.  Will run handler with a fake, empty session.  Details:\n',err);
          session = {};
        }
        // Then run lifecycle callback
        app.config.sockets.onConnect(session, socket);

        // TODO:
        // turn this into `afterConnect` and have it
        // save the session when the cb is triggered
      });
    })();


    // Bind disconnect handler
    socket.on('disconnect', function onSocketDisconnect(){

      // Configurable custom onDisconnect logic here
      // (default: do nothing)
      if (!app.config.sockets.onDisconnect) return;

      _loadSessionFromSocket(socket, app, function finishedLoading(err, session){
        // If an error occurred loading the session, log what happened
        if (err) {
          app.log.warn('Socket disconnected, but session could not be loaded to pass to configured disconnect handler `sails.config.sockets.onDisconnect()`.  Will run handler with a fake, empty session.  Details:\n',err);
          session = {};
        }

        // Then run lifecycle callback
        app.config.sockets.onDisconnect(session, socket);

        // TODO:
        // turn this into `afterDisconnect` and have it
        // save the session when the cb is triggered

      }); //</loadSessionFromSocket>

    }); //</onSocketDisconnect>


    // Bind socket request handlers
    // (supports sails.io clients 0.9 and up)
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
  // a fake session object.
  if (!app.session) {
    return cb(null, {});
  }

  // If no cookie exists, generate one and set it on the handshake
  if (!socket.handshake.headers.cookie){
    socket.handshake.headers.cookie = app.session.generateNewSidCookie();
    console.log('GENERATED COOKIE:',socket.handshake.headers.cookie);
    // socket.handshake.headers.cookie = app.config.session.key + '=' + newSessionId;
  }
  app.log.verbose('Could not fetch session, since connecting socket (', socket.id, ') has no cookie.');
  app.log.verbose('Is this a cross-origin socket..?)');
  app.log.verbose('Generated a one-time-use cookie:', socket.handshake.headers.cookie,'and saved it on the socket handshake.');
  app.log.verbose('This will start this socket off with an empty session, i.e. (req.session === {})');
  app.log.verbose('That "anonymous" section will only last until the socket is disconnected unless you persist the session id in your database, or by setting the set-cookie response header for an HTTP request that you *know* came from the same user (etc)');
  app.log.verbose('Alternatively, just make sure the socket sends a `cookie` header or query param when it initially connects.');


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

  console.log('sid?',!!sid);
  console.log('sid=',sid);

  // Load session
  return app.session.get(sid, cb);
}
