/**
 * Module dependencies
 */

var _ = require('lodash');




module.exports = function (app){

  /**
   * Emit a message to one or more sockets by ID
   *
   * If the event name is omitted, "message" will be used by default.
   * Thus, sailsSockets.emit(socketIDs, data) is also a valid usage.
   *
   * @param  {array|string} socketIDs The ID or IDs of sockets to send a message to
   * @param  {string} event     The name of the message to send
   * @param  {object} data      Optional data to send with the message
   */
  return function emitToSockets (socketIDs, eventName, data) {
    if (!_.isArray(socketIDs)) {
      socketIDs = [socketIDs];
    }

    // If socket instances were supplied, coerce to ids to be flexible.
    socketIDs = _.map(socketIDs, function (socket){
      if (_.isObject(socket)){
        socket = sails.sockets.parseSocket(socket);
        return sails.sockets.id(socket);
      }
      return socket;
    });


    if (typeof eventName === 'object') {
      data = eventName;
      eventName = null;
    }

    if (!eventName) {
      eventName = sailsSockets.DEFAULT_EVENT_NAME;
    }

    _.each(socketIDs, function(socketID) {
      sails.sockets.get(socketID).emit(eventName, data);
    });
  };
};
