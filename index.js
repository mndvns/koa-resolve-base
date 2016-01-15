/**
 * Module dependencies
 */

var url = require('url');
var resolve = require('path').resolve;
var join = require('path').join;
var debug = require('debug')('koa-resolve-base');

module.exports = function(options) {
  options = options || {};

  // Header names
  var hostHeader = options.host || 'x-forwarded-host';
  var pathHeader = options.path || 'x-forwarded-path';
  var portHeader = options.port || 'x-forwarded-port';
  var protoHeader = options.proto || 'x-forwarded-proto';

  return function *base(next) {
    var hostParts = this.headers.host.split(':');

    // Construct the base
    var base = {
      protocol: (this.headers[protoHeader] || this.protocol || 'http').split(',')[0],
      hostname: (this.headers[hostHeader] || hostParts[0] || '').split(',')[0],
      port: (this.headers[portHeader] || hostParts[1] || '').split(',')[0],
      pathname: (this.headers[pathHeader] || '').split(',')[0]
    };

    // Remove standard ports
    if ((base.port == 80 && base.protocol === 'http') ||
        (base.port == 443 && base.protocol === 'https')) delete base.port;

    // Remove trailing slashes
    if (base.pathname === '/') base.pathname = '';
    if (base.pathname[base.pathname.length - 1] === '/') base.pathname = base.pathname.slice(0, base.pathname.length - 1);

    // Expose
    this.base = url.format(base);

    // Expose this.resolve
    this.resolve = function (){
      var path = [].join.call(arguments, '/');

      // It's an absolue path
      if (url.parse(path).protocol) return path;

      var appPath = this.originalUrl.slice(0, this.path.length)

      // Join the base path with the app path
      var joinedPath = join(this.base.pathname || '/', appPath);

      // It's a relative path
      var resolvedPath = url.format({
        protocol: base.protocol,
        hostname: base.hostname,
        port: base.port,
        pathname: resolve(joinedPath, path)
      });

      debug('Resolving path', joinedPath, '+', path, '->', resolvedPath);

      return resolvedPath;
    }.bind(this);

    yield next;
  }
};
