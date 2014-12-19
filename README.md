# sockets

`sockets` hook for Sails v0.11

## Status

> ##### Stability: [3](http://nodejs.org/api/documentation.html#documentation_stability_index) - Stable


## Purpose

This hook's responsibilities are:

#### When initialized...
+ fire up socket.io server
+ listen for connect / disconnect events
  + listen for get/post/put/delete/patch events
    + create bare-bones request and response contexts, then pass them to the core interpreter in Sails to be routed on the fly.

#### Bind "shadow" routes...

###### `before`
N/A

###### `after`

+ `GET __getcookie`


#### Expose on the `sails` app object:

+ `sails.sockets.*` (see reference documentation for sails.sockets on sailsjs.org for full list of exposed methods)

## FAQ

> If you have a question that isn't covered here, please feel free to send a PR adding it to this section.

#### What is this?

This repo contains a hook, one of the building blocks Sails is made out of.

#### What version of Sails is this for?

The versioning of a hook closely mirrors that of the Sails version it depends on.  While the "patch" version (i.e. the "Z" in "X.Y.Z") will normally differ from that of Sails core, the "minor" version number (i.e. the "Y" in "X.Y.Z") of this hook is also the minor version of Sails for which it is designed.  For instance, if a hook is version `0.11.9`, it is designed for Sails `^0.11.0` (that means it'll work from 0.11.0 all the way up until 0.12.0).

#### Does this hook use Socket.io v1.0?

Yes.

#### Are there changes?

Yes, see the [v0.11 migration guide](http://sailsjs.org/#/documentation/concepts/Upgrading). You probably won't need to change anything unless you were extensively using the old Socket.io v0.9 configuration.


## License

MIT
