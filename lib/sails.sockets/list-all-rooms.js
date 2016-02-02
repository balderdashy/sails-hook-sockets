/**
 * Module dependencies
 */

var _ = require('lodash');




module.exports = function (app){


  /**
   * Get the list of all rooms.
   *
   * Note that as of Socket.io v1.0, this will also return the automatically-generated
   * per-socket rooms.
   *
   * @return {array} An array of room ids, minus the empty room
   */
  return function listAllRooms() {

    app.log.debug('sails.sockets.rooms() is deprecated (see `http://sailsjs.org/documentation/concepts/upgrading/to-v-0-12`)');

    var roomIds = _.keys(app.io.sockets.adapter.rooms);

    // delete the 'empty string' (i.e. global) room
    _.remove(roomIds, function (roomId){
      if (roomId === '') return true;
    });

    return roomIds;
  };
};
