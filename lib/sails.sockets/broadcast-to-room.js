/**
 * Module dependencies
 */

var _ = require('lodash');




module.exports = function (app){


  /**
   * Broadcast a message to a room
   *
   * If the event name is omitted, "message" will be used by default.
   * Thus, sailsSockets.broadcast(roomName, data) is also a valid usage.
   *
   * @param  {string} roomName The room to broadcast a message to
   * @param  {string} eventName    The event name to broadcast
   * @param  {object} data     The data to broadcast
   * @param  {object} socket   Optional socket to omit
   */

  return function broadcastToRoom (roomName, eventName, data, socketToOmit) {

    // If the 'eventName' is an object, assume the argument was omitted and
    // parse it as data instead.
    if (typeof eventName === 'object') {
      data = eventName;
      eventName = null;
    }

    // Default to the sailsSockets.DEFAULT_EVENT_NAME.
    if (!eventName) {
      eventName = sailsSockets.DEFAULT_EVENT_NAME;
    }

    // If we were given a valid socket to omit, broadcast from there.
    if (socketToOmit && socketToOmit.manager) {
      socketToOmit.broadcast.to(roomName).emit(eventName, data);
    }
    // Otherwise broadcast to everyone
    else {
      app.io.sockets.in(roomName).emit(eventName, data);
    }
  };

};
