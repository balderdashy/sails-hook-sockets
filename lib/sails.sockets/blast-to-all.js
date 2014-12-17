/**
 * Module dependencies
 */

var _ = require('lodash');




module.exports = function (app){


  /**
   * Blast out a message to all connected sockets
   *
   * If the event name is omitted, sailsSockets.DEFAULT_EVENT_NAME will be used by default.
   * Thus, sailsSockets.blast(data) is also a valid usage.
   *
   * @param  {string} event    The event name to broadcast
   * @param  {object} data     The data to broadcast
   * @param  {object} socket   Optional socket to omit
   */

  return function blast(eventName, data, socketToOmit) {

    // If the 'eventName' is an object, assume the argument was omitted and
    // parse it as data instead.
    if (typeof eventName === 'object') {
      data = eventName;
      eventName = null;
    }

    // Default to the sailsSockets.DEFAULT_EVENT_NAME eventName.
    if (!eventName) {
      eventName = sailsSockets.DEFAULT_EVENT_NAME;
    }

    // If we were given a valid socket to omit, broadcast from there.
    if (socketToOmit && socketToOmit.manager) {
      socketToOmit.broadcast.emit(eventName, data);
    }

    // Otherwise broadcast to everyone
    else {
      app.io.sockets.emit(eventName, data);
    }
  };

};
