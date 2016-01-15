var should = require('should');
var request = require('supertest');
var Koa = require('koa');
var get = require('koa-route').get;
var mount = require('koa-mount')
var base = require('..');

var subapp = require('koa')();

subapp.use(function*(){
  this.body = this.resolve(this.query.path)
});

var app = require('koa')();

app.use(base());
app.use(mount('/subapp', subapp));

app.use(get('/', function*(){
  this.body = this.base;
}));

app.use(get('/resolve', function*(){
  this.body = this.resolve(this.query.path);
}));

app.use(get('*', function*(){
  this.body = {
    port: this.headers.host.split(':')[1],
    base: this.base
  };
}));

var $app = app.listen();

describe('koa-resolve-base', function(){
  describe('this.base', function(){
    it('should return the base url', function(done){
      request($app)
        .get('/')
        .expect(/http:\/\/127.0.0.1:/)
        .end(function(err, res){
          if (err) return done(err);
          res.ok.should.be.ok;
          return done();
        });
    });

    it('should return the forwarded host', function(done) {
      request($app)
        .get('/')
        .set('X-Forwarded-Host', 'example.com')
        // Supertest binds to a random port
        .expect(/http:\/\/example.com*/)
        .end(function(err, res) {
          if (err) return done(err);
          res.ok.should.be.ok;
          return done();
        });
    });

    it('should return the forwarded host and port', function(done) {
      request($app)
        .get('/')
        .set('X-Forwarded-Host', 'example.com')
        .set('X-Forwarded-Port', '8080')
        .expect('http://example.com:8080')
        .end(function(err, res) {
          if (err) return done(err);
          res.ok.should.be.ok;
          return done();
        });
    });

    it('should return the forwarded host, port and path', function(done) {
      request($app)
        .get('/')
        .set('X-Forwarded-Host', 'example.com')
        .set('X-Forwarded-Port', '8080')
        .set('X-Forwarded-Path', '/testing')
        .expect('http://example.com:8080/testing')
        .end(function(err, res) {
          if (err) return done(err);
          res.ok.should.be.ok;
          return done();
        });
    });

    it('should return the forwarded proto, host, port and path', function(done) {
      request($app)
        .get('/')
        .set('X-Forwarded-Proto', 'https')
        .set('X-Forwarded-Host', 'example.com')
        .set('X-Forwarded-Port', '8080')
        .set('X-Forwarded-Path', '/testing')
        .expect('https://example.com:8080/testing')
        .end(function(err, res) {
          if (err) return done(err);
          res.ok.should.be.ok;
          return done();
        });
    });

    it('should not send the port if not specified', function(done) {
      request($app)
        .get('/port')
        .set('X-Forwarded-Proto', 'http')
        .set('X-Forwarded-Host', 'example.com')
        .set('X-Forwarded-Path', '/testing')
        .end(function(err, res) {
          if (err) return done(err);
          res.ok.should.be.ok;
          res.body.base.should.eql('http://example.com:' + res.body.port + '/testing');
          return done();
        });
    });

    it('should not send the port on http and port 80', function(done) {
      request($app)
        .get('/')
        .set('X-Forwarded-Proto', 'http')
        .set('X-Forwarded-Host', 'example.com')
        .set('X-Forwarded-Port', '80')
        .set('X-Forwarded-Path', '/testing')
        .expect('http://example.com/testing')
        .end(function(err, res) {
          if (err) return done(err);
          res.ok.should.be.ok;
          return done();
        });
    });

    it('should not send the port on https and port 443', function(done) {
      request($app)
        .get('/')
        .set('X-Forwarded-Proto', 'https')
        .set('X-Forwarded-Host', 'example.com')
        .set('X-Forwarded-Port', '443')
        .set('X-Forwarded-Path', '/testing')
        .expect('https://example.com/testing')
        .end(function(err, res) {
          if (err) return done(err);
          res.ok.should.be.ok;
          return done();
        });
    });
  });

  describe('this.resolve(path)', function(){
    it('should resolve a root path correctly', function(done) {
      request($app)
        .get('/resolve')
        .query({path: '/path/to/test'})
        .set('X-Forwarded-Host', 'example.com')
        .set('X-Forwarded-Port', '8080')
        .expect('http://example.com:8080/path/to/test')
        .end(function(err, res) {
          if (err) return done(err);
          res.ok.should.be.ok;
          return done();
        });
    });

    it('should resolve a relative path correctly', function(done) {
      request($app)
        .get('/resolve')
        .query({path: 'path/to/test'})
        .set('X-Forwarded-Host', 'example.com')
        .set('X-Forwarded-Port', '8080')
        .expect('http://example.com:8080/resolve/path/to/test')
        .end(function(err, res) {
          if (err) return done(err);
          res.ok.should.be.ok;
          return done();
        });
    });

    it('should resolve a subapp path', function(done) {
      request($app)
        .get('/subapp/resolve')
        .query({path: 'path/to/test'})
        .set('X-Forwarded-Host', 'example.com')
        .set('X-Forwarded-Port', '8080')
        .expect('http://example.com:8080/subapp/path/to/test')
        .end(function(err, res) {
          if (err) return done(err);
          res.ok.should.be.ok;
          return done();
        });
    });

    it('should resolve an absolute path', function(done) {
      var path = 'https://test.com/test/1/2/3';
      request($app)
        .get('/resolve')
        .query({path: path})
        .set('X-Forwarded-Host', 'example.com')
        .set('X-Forwarded-Port', '8080')
        .expect(path)
        .end(function(err, res) {
          if (err) return done(err);
          res.ok.should.be.ok;
          return done();
        });
    });
  });
});
