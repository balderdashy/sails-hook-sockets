var assert = require('assert');
var path = require('path');
var proxyaddr = require('proxy-addr');
var receiveIncoming = require('../lib/receive-incoming-sails-io-msg');
var express = require(require.resolve('express', {
  paths: [path.dirname(require.resolve('sails/package.json'))]
}));

function requestContext(trust, options) {
  options = options || {};
  var context;
  var app = {
    config: { host: 'fixture.invalid', sockets: {} },
    log: { verbose: function () {}, warn: function () {}, error: function () {} },
    hooks: {
      http: {
        app: {
          get: function (name) {
            assert.strictEqual(name, 'trust proxy fn');
            return trust;
          }
        }
      }
    },
    router: {
      route: function (req) { context = req; }
    }
  };
  if (options.httpApp) { app.hooks.http.app = options.httpApp; }
  if (options.missingHttpApp) { app.hooks.http = {}; }
  if (options.throwGet) {
    app.hooks.http.app.get = function () { throw new Error('fixture setting lookup failed'); };
  }
  if (options.missingHttp) { app.hooks = {}; }
  var headers = {
    __sails_io_sdk_version: '1.2.1',
    __sails_io_sdk_platform: 'node',
    __sails_io_sdk_language: 'javascript'
  };
  if (options.forwarded) { headers['x-forwarded-for'] = options.forwarded; }
  receiveIncoming(app)({
    eventName: 'get',
    incomingSailsIOMsg: { url: '/fixture?source=contract' },
    socket: {
      handshake: {
        address: options.peer || '10.0.0.2',
        headers: headers,
        query: {}
      }
    }
  });
  assert.ok(context, 'the actual virtual request receiver must run');
  return context;
}

describe('virtual request proxy-address contract', function () {
  it('keeps the peer address with no forwarded header', function () {
    var req = requestContext(function () { return false; }, { peer: '::ffff:127.0.0.1' });
    assert.strictEqual(req.ip, '::ffff:127.0.0.1');
    assert.deepStrictEqual(req.ips, []);
  });

  it('ignores forwarded addresses when no proxy is trusted', function () {
    var req = requestContext(function () { return false; }, { forwarded: '198.51.100.50, 203.0.113.7' });
    assert.strictEqual(req.ip, '10.0.0.2');
    assert.deepStrictEqual(req.ips, []);
  });

  it('keeps nearest-client semantics with one trusted hop', function () {
    var req = requestContext(function (address, index) { return index < 1; }, { forwarded: '198.51.100.50, 203.0.113.7' });
    assert.strictEqual(req.ip, '203.0.113.7');
    assert.deepStrictEqual(req.ips, ['203.0.113.7']);
  });

  it('keeps two-hop address and ips ordering', function () {
    var req = requestContext(function (address, index) { return index < 2; }, { forwarded: '198.51.100.50, 203.0.113.7' });
    assert.strictEqual(req.ip, '198.51.100.50');
    assert.deepStrictEqual(req.ips, ['198.51.100.50', '203.0.113.7']);
  });

  it('keeps trust-all function behavior', function () {
    var req = requestContext(function () { return true; }, { forwarded: '198.51.100.50, 203.0.113.7' });
    assert.strictEqual(req.ip, '198.51.100.50');
    assert.deepStrictEqual(req.ips, ['198.51.100.50', '203.0.113.7']);
  });

  it('keeps a custom address trust function', function () {
    var req = requestContext(function (address) { return address === '10.0.0.2'; }, { forwarded: '198.51.100.50, 203.0.113.7' });
    assert.strictEqual(req.ip, '203.0.113.7');
    assert.deepStrictEqual(req.ips, ['203.0.113.7']);
  });

  it('keeps plain IPv4 subnet behavior', function () {
    var req = requestContext(proxyaddr.compile('10.0.0.0/8'), { forwarded: '198.51.100.50, 203.0.113.7' });
    assert.strictEqual(req.ip, '203.0.113.7');
    assert.deepStrictEqual(req.ips, ['203.0.113.7']);
  });

  it('falls back to no trust when the HTTP app is absent', function () {
    var req = requestContext(null, { missingHttp: true, forwarded: '198.51.100.50' });
    assert.strictEqual(req.ip, '10.0.0.2');
    assert.deepStrictEqual(req.ips, []);
  });

  it('falls back to no trust when the HTTP hook has no app', function () {
    var req = requestContext(null, { missingHttpApp: true, forwarded: '198.51.100.50' });
    assert.strictEqual(req.ip, '10.0.0.2');
    assert.deepStrictEqual(req.ips, []);
  });

  it('falls back to no trust when Express setting lookup throws', function () {
    var req = requestContext(null, { throwGet: true, forwarded: '198.51.100.50' });
    assert.strictEqual(req.ip, '10.0.0.2');
    assert.deepStrictEqual(req.ips, []);
  });

  it('preserves rejection of an absent delegated trust function', function () {
    assert.throws(function () {
      requestContext(undefined, { forwarded: '198.51.100.50' });
    }, /trust argument is required/);
  });

  it('uses the real Express compiled one-hop trust function', function () {
    var httpApp = express();
    httpApp.set('trust proxy', 1);
    var req = requestContext(null, {
      httpApp: httpApp,
      forwarded: '198.51.100.50, 203.0.113.7'
    });
    assert.strictEqual(req.ip, '203.0.113.7');
    assert.deepStrictEqual(req.ips, ['203.0.113.7']);
  });

  it('keeps a trust function inherited from an Express parent app', function () {
    var parent = express();
    parent.set('trust proxy', 2);
    var child = express();
    parent.use('/child', child);
    assert.strictEqual(child.get('trust proxy fn'), parent.get('trust proxy fn'));
    var req = requestContext(null, {
      httpApp: child,
      forwarded: '198.51.100.50, 203.0.113.7'
    });
    assert.strictEqual(req.ip, '198.51.100.50');
    assert.deepStrictEqual(req.ips, ['198.51.100.50', '203.0.113.7']);
  });

  it('delegates address and hop arguments to Express custom trust', function () {
    var calls = [];
    var httpApp = express();
    httpApp.set('trust proxy', function (address, index) {
      calls.push([address, index]);
      return index === 0 && address === '10.0.0.2';
    });
    var req = requestContext(null, {
      httpApp: httpApp,
      forwarded: '198.51.100.50, 203.0.113.7'
    });
    assert.strictEqual(req.ip, '203.0.113.7');
    assert.deepStrictEqual(req.ips, ['203.0.113.7']);
    assert.deepStrictEqual(calls, [
      ['10.0.0.2', 0], ['203.0.113.7', 1],
      ['10.0.0.2', 0], ['203.0.113.7', 1]
    ]);
  });

  it('delegates Express loopback subnet trust for a mapped peer', function () {
    var httpApp = express();
    httpApp.set('trust proxy', 'loopback');
    var req = requestContext(null, {
      httpApp: httpApp,
      peer: '::ffff:127.0.0.1',
      forwarded: '203.0.113.7'
    });
    assert.strictEqual(req.ip, '203.0.113.7');
    assert.deepStrictEqual(req.ips, ['203.0.113.7']);
  });

  it('rejects unrelated IPv4 and mapped candidates for short mapped subnets', function () {
    var trust = proxyaddr.compile('::ffff:10.0.0.0/8');
    assert.strictEqual(trust('203.0.113.7'), false);
    assert.strictEqual(trust('::ffff:203.0.113.7'), false);
  });
});
