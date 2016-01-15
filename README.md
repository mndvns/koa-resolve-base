# koa-resolve-base

Get the base url for Koa apps, ported from [connect-base](https://github.com/camshaft/connect-base)

Use
---

Set up a server that echoes the requesting url:

```js
var app = require('koa')();
var base = require('koa-resolve-base');

app.use(base());

app.use(function(req, res){
  res.send(req.base);
})
```

When we request it locally:

```sh
curl http://localhost:5000
> http://localhost:5000
```

When we host it through a DNS server:

```sh
curl http://example.com
> http://example.com
```

We can also set the protocol, host, port, and path; maybe through a reverse proxy

```sh
curl -H "X-Forwarded-Proto: https" http://example.com
> https://example.com
```

```sh
curl -H "X-Forwarded-Host: test.example.com" http://example.com
> http://test.example.com
```

```sh
curl -H "X-Forwarded-Port: 8080" http://example.com
> http://example.com:8080
```

```sh
curl -H "X-Forwarded-Path: /testing" http://example.com
> http://example.com/testing
```

Testing
-------

```sh
npm install -d
npm test
```
