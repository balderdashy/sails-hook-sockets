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
          app.log.error('Could not run `sails.config.sockets.onConnect()`');
          app.log.error('(session could not be loaded)');
          app.log.error(err);
          return;
        }
        // Otherwise, run lifecycle callback
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

        // Otherwise, run lifecycle callback
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
 * Try to get session id (`sid`) from a cookie
 *
 * @required  {String}   options.cookie
 * @required  {Function} options.parser
 * @return {String}
 */

function _getSid(options){
  var cookie;
  try {
    cookie = options.cookie;
    if (!cookie) throw new Error('No cookie available');
  }
  catch (e) { return ''; }

  var sid;
  try {
    sid = app.session.parseSessionIdFromCookie(cookie);
  }
  catch (e) {
    if (typeof e === 'object' && e.code === 'E_SESSION_PARSE_COOKIE') {
      return '';
    }
    return '';
  }
  return sid||'';
}


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

  // Parse the sid from the cookie
  var sid = _getSid({
    parser: app.session.parseSessionIdFromCookie,
    cookie: socket.handshake.headers.cookie
  });
  if (!sid) {
    // TODO:
    // generate session (and set cookie in handshake), then return the sid
    // if that doesn't work, coerce the sid to empty string
    sid = '';
  }

  // Load session
  return app.session.get(sid, cb);
}
