/**
 * Module dependencies
 */

var _ = require('lodash');




module.exports = function ToBuildSocketsMethods(app) {

  // Build `sails.sockets` object
  var sailsSockets = {};
  sailsSockets.DEFAULT_EVENT_NAME = 'message';

  /**
   * Subscribe a socket to a generic room
   * @param  {object} socket   The socket to subscribe.
   * @param  {string} roomName The room to subscribe to
   */
  sailsSockets.join = function(sockets, roomName) {

    if (!_.isArray(sockets)) {
      sockets = [sockets];
    }

    _.each(sockets, function(socket) {
      // If a string was sent, try to look up a socket with that ID
      if (typeof socket == 'string') {
        socket = app.io.sockets.socket(socket);
      }

      // If it's not a valid socket object, bail
      if (!(socket && socket.manager)) {
        app.log.warn("Attempted to call `sailsSockets.join`, but the first argument was not a socket.");
        return;
      }
      // Join up!
      socket.join(roomName);

    });

    return true;

  };

  /**
   * Unsubscribe a socket from a generic room
   * @param  {object} socket   The socket to unsubscribe.
   * @param  {string} roomName The room to unsubscribe from
   */
  sailsSockets.leave = function(sockets, roomName) {

    if (!_.isArray(sockets)) {
      sockets = [sockets];
    }

    _.each(sockets, function(socket) {
      // If a string was sent, try to look up a socket with that ID
      if (typeof socket == 'string') {
        socket = app.io.sockets.socket(socket);
      }

      // If it's not a valid socket object, bail
      if (!(socket && socket.manager)) {
        app.log.warn("Attempted to call `sailsSockets.leave`, but the first argument was not a socket.");
        return;
      }

      // See ya!
      socket.leave(roomName);
    });

    return true;
  };

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

  sailsSockets.broadcast = function(roomName, eventName, data, socketToOmit) {

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



  /**
   * Broadcast a message to all connected sockets
   *
   * If the event name is omitted, sailsSockets.DEFAULT_EVENT_NAME will be used by default.
   * Thus, sailsSockets.blast(data) is also a valid usage.
   *
   * @param  {string} event    The event name to broadcast
   * @param  {object} data     The data to broadcast
   * @param  {object} socket   Optional socket to omit
   */

  sailsSockets.blast = function(eventName, data, socketToOmit) {

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



  /**
   * Get the ID of a socket object
   * @param  {object} socket The socket object to get the ID of
   * @return {string}        The socket's ID
   */
  sailsSockets.id = function(socket) {
    // If a request was passed in, get its socket
    socket = socket.socket || socket;
    if (socket) {
      return socket.id;
    } else return undefined;
  };

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
  sailsSockets.emit = function(socketIDs, eventName, data) {
    if (!_.isArray(socketIDs)) {
      socketIDs = [socketIDs];
    }

    if (typeof eventName === 'object') {
      data = eventName;
      eventName = null;
    }

    if (!eventName) {
      eventName = sailsSockets.DEFAULT_EVENT_NAME;
    }

    _.each(socketIDs, function(socketID) {
      app.io.sockets.socket(socketID).emit(eventName, data);
    });
  };

  /**
   * Get the list of sockets subscribed to a room
   * @param  {string} roomName The room to get subscribers of
   * @param  {boolean} returnSockets If true, return socket instances rather than IDs.
   * @return {array} An array of socket ID strings
   */
  sailsSockets.subscribers = function(roomName, returnSockets) {

    // The underlying implementation was changed a bit with the upgrade
    // to Socket.io v1.0.  For more information, see:
    //  •-> https://github.com/Automattic/socket.io/issues/1908#issuecomment-66836641
    // and •-> https://github.com/Automattic/socket.io/pull/1630#issuecomment-64389524

    if (returnSockets) {
      return app.io.nsps['/'].adapter.rooms[roomName];
      // return app.io.sockets.clients(roomName);
    } else {
      return _.keys(app.io.nsps['/'].adapter.rooms[roomName]);
      // return _.pluck(app.io.sockets.clients(roomName), 'id');
    }
  };

  /**
   * Get the list of rooms a socket is subscribed to
   * @param  {object} socket The socket to get rooms for
   * @return {array} An array of room names
   */
  sailsSockets.socketRooms = function(socket) {
    return _.map(_.keys(app.io.sockets.manager.roomClients[socket.id]), function(roomName) {
      return roomName.replace(/^\//, '');
    });
  };

  /**
   * Get the list of all rooms
   * @return {array} An array of room names, minus the empty room
   */
  sailsSockets.rooms = function() {
    var rooms = _.clone(app.io.sockets.manager.rooms);
    delete rooms[''];
    return _.map(_.keys(rooms), function(room) {
      return room.substr(1);
    });
  };

  return sailsSockets;
};
