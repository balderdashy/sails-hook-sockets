# sails-hook-sockets changelog

### 0.13.0

[ENHANCEMENT] Added callback argument to `.join()`, `.leave()` and `.subscribers()`.
[ENHANCEMENT] Added ability to broadcast to multiple rooms using `.broadcast()`.
[DEPRECATION] Deprecated `.rooms()` method, since it uses undocumented socket.io functionality.
[DEPRECATION] Deprecated `.emit()` and `.emitAll()` and made them aliases for `.broadcast()`.
[DEPRECATION] Deprecated `.socketRooms()`.
[DEPRECATION] Deprecated `.id()` (made it an alias of `.getId()`).
[DEPRECATION] Deprecated synchronous use of `.subscribers()`.

##### Low Risk Compatibility Warnings

 * Since `.emit()` and `.emitAll()` are now aliases for `.broadcast()`, they will no longer throw or give feedback if any of the specified sockets aren't connected to the server making the call.  If you must check for socket connection on the server first, inspect `sails.io.sockets.connected[socketId]` (see http://socket.io/docs/server-api/#namespace#connected:object)


