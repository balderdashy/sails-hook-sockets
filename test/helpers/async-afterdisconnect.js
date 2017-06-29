module.exports = async function(session, socket, cb) {
  if (socket.handshake.query.disconnect === 'error') {
    throw new Error('err!');
  }
  try {
    await dumb(socket.handshake.query.disconnect);
    return cb();
  } catch (e) {
    return cb(e);
  }
};


// Define a dumb async function.
var dumb = function (status) {
  return new Promise(function (resolve, reject) {
    setTimeout(function() {
      if (status === 'reject') {
        return reject();
      }
      return resolve();
    }, 100);
  });
};

