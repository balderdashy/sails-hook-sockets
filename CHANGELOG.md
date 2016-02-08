# sails-hook-sockets changelog

### 0.13.7

* [BUGFIX] Correctly handle joining/leaving rooms using socket ID as the first argument [#22](https://github.com/balderdashy/sails-hook-sockets/issues/22)

### 0.13.6

* [BUGFIX] Make "async" a full dependency, to ensure compatibility with Sails when globals are turned off [a5bd1e1](https://github.com/balderdashy/sails-hook-sockets/commit/a5bd1e1e8c6e44177b0ac67ecf9449f86e76c533)

### 0.13.5

* [ENHANCEMENT] Forward the "nosession" header to the Sails virtual router (allowing sockets to connect without creating sessions) [7331197](https://github.com/balderdashy/sails-hook-sockets/commit/733119797ea357dcabd9a4dc2b2d52f601a22398)

### 0.13.4

* [BUGFIX] Fix issue where admin bus crashes when "db" or "pass" is not specified in redis config [14210dc](https://github.com/balderdashy/sails-hook-sockets/commit/14210dc8d81e638f198493e05dda5eb8651f0e8f)

### 0.13.3

* [BUGFIX] Added missing require()s to ensured that hook works without Sails globals enabled

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


