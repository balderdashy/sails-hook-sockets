# sails-hook-sockets changelog

### 1.1.0

* [UPGRADE] Update [socket.io](http://socket.io) dependency to version 1.5.1.
* [ENHANCEMENT] Add validation for `db` option.  Thanks [bberry6](https://github.com/bberry6)!  [#9](https://github.com/balderdashy/sails-hook-sockets/pull/9)
* [ENHANCEMENT] Add `onlyAllowOrigins` config to restrict the origins allowed to connect to the socket server. [9450c96](https://github.com/balderdashy/sails-hook-sockets/commit/9450c96cd22b2ca49696cfbebc5d46b54a08b97c)

### 1.0.1

* [BUGFIX] Made `maxHttpBufferSize` actually work by passing through to the underlying adapter. [f5bf545](https://github.com/balderdashy/sails-hook-sockets/commit/f5bf54595d388f4dcdb739a5fc5613c7255d6014)
* [DEPRECATION] Deprecated `maxBufferSize` option in favor of `maxHttpBufferSize`. [f5bf545](https://github.com/balderdashy/sails-hook-sockets/commit/f5bf54595d388f4dcdb739a5fc5613c7255d6014)
* [ENHANCEMENT] Make "websocket" the default transport.  This is better supported by more clients than the "polling-first" method.  The relevant changes have been made in [sails.io.js](http://github.com/balderdashy/sails.io.js) as well. [8135ada](https://github.com/balderdashy/sails-hook-sockets/commit/8135adae8ec04e99facf84e38803b95fa3c79f90)

### 1.0.0

* **[BREAKING CHANGE]** Removed deprecated `sails.socket` methods: `.emit()`, `.emitToAll()`, `.rooms()`, `.socketRooms()`, `.subscribers()`, `.id()`.
* [ENHANCEMENT] Added support for the "subEvent" option.  Thanks [@albi34](https://github.com/albi34)! [#26](https://github.com/balderdashy/sails-hook-sockets/issues/26)
* [BUGFIX] Explicitly set content-type when responding to JSONP request.  Thanks [@arryon](https://github.com/arryon)! [#28](https://github.com/balderdashy/sails-hook-sockets/pull/28)

### 0.13.7

* [BUGFIX] Correctly handle joining/leaving rooms using socket ID as the first argument. Thanks [@Biktop](https://github.com/Biktop)! [#22](https://github.com/balderdashy/sails-hook-sockets/issues/22)

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


