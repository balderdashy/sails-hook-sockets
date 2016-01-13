# sails-hook-sockets changelog

### 0.12.4

[DEPRECATION] Deprecated `.rooms()` method, since it uses undocumented socket.io functionality
[DEPRECATION] Deprecated `.emit()` and `.emitAll()` (use `.broadcast()` instead)
[DEPRECATION] Deprecated `.socketRooms()`
[DEPRECATION] Deprecated `.id()` (use `.getId()` instead)
[ENHANCEMENT] Added callback argument to `.join()`, `.leave()` and `.subscribers()`
[DEPRECATION] Deprecated synchronous use of `.subscribers()`
[ENHANCEMENT] Added ability to broadcast to multiple rooms using `.broadcast()`
