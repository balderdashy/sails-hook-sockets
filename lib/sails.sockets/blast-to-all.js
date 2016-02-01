/**
 * Module dependencies
 */

var _ = require('lodash');




module.exports = function (app){


  /**
   * Blast out a message to all connected sockets
   *
   * If the event name is omitted, sails.sockets.DEFAULT_EVENT_NAME will be used by default.
   * Thus, sails.sockets.blast(data, [socketToOmit]) is also a valid usage.
   *
   * @param  {string} eventName    The event name to broadcast
   * @param  {object} data     The data to broadcast
   * @param  {object} socketToOmit   Optional socket to omit
   */

  return function blast(eventName, data, socketToOmit) {

    // If the 'eventName' is an object, assume the argument was omitted and
    // parse it as data instead.
    if (typeof eventName === 'object') {
      data = eventName;
      eventName = null;
    }

    // Default to the sails.sockets.DEFAULT_EVENT_NAME eventName.
    if (!eventName) {
      eventName = app.sockets.DEFAULT_EVENT_NAME;
    }

    // If the thing passed in looks like `req`, not a socket, then use its
    // req.socket instead if possible.
    socketToOmit = app.sockets.parseSocket(socketToOmit);

    // If we were given a valid socket to omit, "broadcast" using that socket
    // so that it will not receive the message.
    if (socketToOmit) {
      socketToOmit.broadcast.emit(eventName, data);
      return;
    }

    // Otherwise broadcast to everyone in the default namespace
    app.io.sockets.emit(eventName, data);
  };

};
