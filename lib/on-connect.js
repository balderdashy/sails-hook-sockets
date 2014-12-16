/**
 * Module dependencies
 */

var ToReceiveIncomingSailsIOMsg = require('./receive-incoming-sails-io-msg');


module.exports = function ToHandleNewConnection(app){

  // Set the environment for `receiveIncomingSailsIOMsg`
  var receiveIncomingSailsIOMsg = ToReceiveIncomingSailsIOMsg(app);

  return function onConnect (socket){


    // Run `onConnect` lifecycle callback
    if (app.config.sockets.onConnect) {
      if (!app.session) {
        app.config.sockets.onConnect({}, socket);
      }
      else {

        // TODO: make this work again

        // app.session.fromSocket(socket, function sessionReady (err, session) {
        //   // If an error occurred loading the session, log what happened
        //   if (err) {
        //     app.log.error(err);
        //     return;
        //   }
        //   // But continue on to run event handler either way
        //   app.config.sockets.onConnect({}, socket);

        // });
      }
    }


    // Bind socket request handlers
    // (supports sails.io clients 0.9 and up)
    (function (bindSocketRequestHandler){
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
    });

    // Bind disconnect handler
    socket.on('disconnect', function onSocketDisconnect(){

      // Configurable custom onConnect logic here
      // (default: do nothing)
      if (app.config.sockets.onDisconnect) {
        if (!app.session) {
          app.config.sockets.onDisconnect({}, socket);
        }
        else {

          // TODO: make this work again

          // app.session.fromSocket(socket, function sessionReady (err, session) {
          //   // If an error occurred loading the session, log what happened
          //   if (err) {
          //     app.log.error(err);
          //     return;
          //   }
          //   // But continue on to run event handler either way
          //   app.config.sockets.onDisconnect({}, socket);

          // });
        }
      }
    }); //</onSocketDisconnect>
  }; //</onSocketConnect>
};
