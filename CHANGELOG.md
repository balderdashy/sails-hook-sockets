# sails-hook-sockets changelog

### 0.13.2

* [ENHANCEMENT] Optimized `.addRoomMembersToRooms()`, `.removeRoomMembersFromRooms()` for use with single socket rooms
* [ENHANCEMENT] Made `.join()` and `.leave()` work cross-server (when provided with a socket ID)

##### Low Risk Compatibility Warnings

 * Since `.join()` and `.leave()` no longer throw if given an ID of a socket that is not connected to the server--instead, they will use `.addRoomMembersToRooms()` or `.removeRoomMembersFromRooms()` to give any other connected servers the chance to find that socket.  If you must check for socket connection on the server first, inspect `sails.io.sockets.connected[socketId]` (see http://socket.io/docs/server-api/#namespace#connected:object)

### 0.13.1

* [ENHANCEMENT] Added `.addRoomMembersToRooms()`
* [ENHANCEMENT] Added `.removeRoomMembersFromRooms()`
* [ENHANCEMENT] Added `.leaveAll()`
* [ENHANCEMENT] Refactored admin bus to connect directly to Redis rather than using a socket.io client connection
* [DEPRECATION] Deprecated `.subscribers()`.

### 0.13.0

* [ENHANCEMENT] Added callback argument to `.join()`, `.leave()` and `.subscribers()`.
* [ENHANCEMENT] Added ability to broadcast to multiple rooms using `.broadcast()`.
* [DEPRECATION] Deprecated `.rooms()` method, since it uses undocumented socket.io functionality.
* [DEPRECATION] Deprecated `.emit()` and `.emitAll()` and made them aliases for `.broadcast()`.
* [DEPRECATION] Deprecated `.socketRooms()`.
* [DEPRECATION] Deprecated `.id()` (made it an alias of `.getId()`).
* [DEPRECATION] Deprecated synchronous use of `.subscribers()`.

##### Low Risk Compatibility Warnings

 * Since `.emit()` and `.emitAll()` are now aliases for `.broadcast()`, they will no longer throw or give feedback if any of the specified sockets aren't connected to the server making the call.  If you must check for socket connection on the server first, inspect `sails.io.sockets.connected[socketId]` (see http://socket.io/docs/server-api/#namespace#connected:object)


