Tensō
=====

[![build status](https://secure.travis-ci.org/avoidwork/tenso.svg)](http://travis-ci.org/avoidwork/tenso)

Tensō is an HTTP/HTTP2 REST API framework, that will handle the serialization & creation of hypermedia links; all you have to do is give it `Arrays` or `Objects`.

## Example
Creating an API with Tensō can be this simple:

```javascript
const path = require('path'),
    app = require("tenso")({routes: require(path.join(__dirname, "routes.js"))});

module.exports = app;
```

### Creating Routes
Routes are loaded as a module, with each HTTP method as an export, affording a very customizable API server.

You can use `res` to `res.send(body[, status, headers])`, `res.redirect(url)`, or `res.error(status[, Error])`. 

The following example will create GET routes that will return an `Array` at `/`, an `Error` at `/reports/tps`, & a version 4 UUID at `/uuid`.

```javascript
const uuid = require("tiny-uuid4");

module.exports.get = {
	"/": ["reports", "uuid"],
	"/reports": ["tps"],
	"/reports/tps": (req, res) => res.error(785, Error("TPS Cover Sheet not attached")),
	"/uuid": (req, res) => res.send(uuid(), 200, {"cache-control": "no-cache"})
};
```

#### Protected Routes
Protected routes are routes that require authorization for access, and will redirect to authentication end points if needed.

#### Unprotected Routes
Unprotected routes are routes that do not require authorization for access, and will exit the authorization pipeline early to avoid rate limiting, csrf tokens, & other security measures. These routes are the DMZ of your API! _You_ **must** secure these end points with alternative methods if accepting input!

#### Reserved Route
The `/assets/*` route is reserved for the HTML browsable interface assets; please do not try to reuse this for data.

### Request Helpers
Tensō decorates `req` with "helpers" such as `req.ip`, & `req.parsed`. `PATCH`, `PUT`, & `POST` payloads are available as `req.body`. Sessions are available as `req.session` when using `local` authentication.

Tensō decorates `res` with "helpers" such as `res.send()`, `res.status()`, & `res.json()`.

## Responses
Responses will have a standard shape, and will be utf-8 by default. The result will be in `data`. Hypermedia (pagination & links) will be in `links:[ {"uri": "...", "rel": "..."}, ...]`, & also in the `Link` HTTP header.

Page size can be specified via the `page_size` parameter, e.g. `?page_size=25`.

Sort order can be specified via then `order-by` which accepts `[field ]asc|desc` & can be combined like an SQL 'ORDER BY', e.g. `?order_by=desc` or `?order_by=lastName%20asc&order_by=firstName%20asc&order_by=age%20desc`

```json
{
  "data": "`null` or ?",
  "error": "`null` or an `Error` stack trace / message",
  "links": [],
  "status": 200
}
```

## REST / Hypermedia
Hypermedia is a prerequisite of REST, and is best described by the [Richardson Maturity Model](http://martinfowler.com/articles/richardsonMaturityModel.html). Tensō will automagically paginate Arrays of results, or parse Entity representations for keys that imply
relationships, and create the appropriate Objects in the `link` Array, as well as the `Link` HTTP header. Object keys that match this pattern: `/_(guid|uuid|id|uri|url)$/` will be considered
hypermedia links.

For example, if the key `user_id` was found, it would be mapped to `/users/:id` with a link `rel` of `related`.

Tensō will bend the rules of REST when using authentication strategies provided by passport.js, or CSRF if is enabled, because they rely on a session. Session storage is in memory, or Redis. You have the option of a stateless or stateful API.

## Browsable API / Renderers / Serializers
Tensō 1.4.0 added a few common format renderers, such as CSV, HTML, YAML, & XML. The HTML interface is a browsable API! You can use it to verify requests & responses, or simply poke around your API to see how it behaves.

Custom renderers can be registered with `server.renderer('mimetype', fn);`, and custom serializes can be registered with `server.serializer('mimetype', fn);`. The parameters for a serializer are `(arg, err, status = 200, stack = false)`; if `arg` is `null` then `err` must be an `Error` & `stack` determines if the response body is the `Error.message` or `Error.stack` property.

## Cache
ETags are built in! Caching can be disabled by setting the `cache-control` header to a "private" or "no cache" directive (see the above `/uuid` example).
 
## Configuration
This is a sample configuration for Tensō, without authentication or SSL. This would be ideal for development, but not production! Enabling SSL is as easy as providing file paths for the two keys.

```
{
	"auth": {}, /* Optional, see Authentication section */
	"cacheSize": 1000, /* Optional, size of Etag & route LRU caches */
	"cacheTTL": 0, /* Optional, TTL of items in Etag & route LRU caches */
	"headers": {}, /* Optional, custom headers */
	"hostname": "localhost", /* Optional, default is 'localhost' */
	"http2": false, /* Middleware signatures do not change, see woodland */
	"json": 0, /* Optional, default indent for 'pretty' JSON */
	"logging": {
		"level": "info", /* Optional */
		"enabled": true, /* Optional */
		"stack": false, /* Optional */
		"stackWire": false /* Optional */
	},
	"port": 8000, /* Optional */
	"routes": require("./routes.js"), /* Required! */
	"regex": {
		"hypermedia": "[a-zA-Z]+_(guid|uuid|id|url|uri)$", /* Optional, changes hypermedia detection / generation */
		"id": "^(_id|id)$" /* Optional, changes hypermedia detection / generation */
	},
	"session": { /* Optional */
		"secret": null,
		"store": "memory", /* "memory" or "redis" */
		"redis": {} /* See connect-redis for options */
	},
	"ssl": { /* Optional */
		"cert": null,
		"key": null
	},
	"renderHeaders": true, /* false will disable headers in HTML interface */
	"title": "My API", /* Page title for browsable API */
	"uid": 33 /* Optional, system account uid to drop to after starting with elevated privileges to run on a low port */
}
```

## Authentication
The `protect` Array is the endpoints that will require authentication. The `redirect` String is the end point users will be redirected to upon successfully authenticating, the default is `/`.

Sessions are used for non `Basic` or `Bearer Token` authentication, and will have `/login`, `/logout`, & custom routes. Redis is supported for session storage.

Multiple authentication strategies can be enabled at once.

Authentication attempts have a random delay to deal with "timing attacks"; always rate limit in production environment!

### Basic Auth
```
{
	"auth": {
		"basic": {
			"enabled": true,
			"list": ["username:password", ...],
		},
		"protect": ["/"]
	}
}
```

### JWT
JWT (JSON Web Token) authentication is stateless and does not have an entry point. The `auth(token, callback)` function must verify `token.sub`, and must execute `callback(err, user)`.

This authentication strategy relies on out-of-band information for the `secret`, and other optional token attributes.

```
{
	"auth": {
		"jwt": {
			"enabled": true,
			"auth": function (token, cb) { ... }, /* Authentication handler, to 'find' or 'create' a User */
			"algorithms": [], /* Optional signing algorithms, defaults to ["HS256", "HS384", "HS512"] */
			"audience": "", /* Optional, used to verify `aud` */
			"issuer: "", /* Optional, used to verify `iss` */
			"ignoreExpiration": false, /* Optional, set to `true` to ignore expired tokens */
			"scheme": "Bearer", /* Optional, set to specify the `Authorization` scheme */
			"secretOrKey": ""
		}
		"protect": ["/private"]
	}
}
```

### Local
Local authentication will create `/login`. `auth(username, password)` must execute `callback(err, user)`.

```
{
	"auth": {
		"local": {
			"enabled": true,
			"auth": function ( ... ) { ... }, /* Authentication handler, to 'find' or 'create' a User */
		}
		"protect": ["/private"]
	}
}
```

### OAuth2
OAuth2 authentication will create `/auth`, `/auth/oauth2`, & `/auth/oauth2/callback` routes. `auth(accessToken, refreshToken, profile, callback)` must execute `callback(err, user)`.
 
```
{
	"auth": {
		"oauth2": {
			"enabled": true,
			"auth": function ( ... ) { ... }, /* Authentication handler, to 'find' or 'create' a User */
			"auth_url": "", /* Authorization URL */
			"token_url": "", /* Token URL */
			"client_id": "", /* Get this from authorization server */
			"client_secret": "" /* Get this from authorization server */
		},
		"protect": ["/private"]
	}
}
```

### Oauth2 Bearer Token
```
{
	"auth": {
		"bearer": {
			"enabled": true,
			"tokens": ["abc", ...]
		},
		"protect": ["/"]
	}
}
```

### SAML
SAML authentication will create `/auth`, `/auth/saml`, & `/auth/saml/callback` routes. `auth(profile, callback)` must execute `callback(err, user)`.

Tensō uses [passport-saml](https://github.com/bergie/passport-saml), for configuration options please visit it's homepage.
 
```
{
	"auth": {
		"saml": {
			"enabled": true,
			...
		},
		"protect": ["/private"]
	}
}
```

## ETags
Generates `ETag` headers for `GET` requests

```
{
	"etags": {
		enabled: true, // Enabled or disabled
		ignore: [], // Paths to ignore
		mimetype: "application/json" // Default respose mimetype
	}
}
```

## Sessions
Sessions can use a memory (default) or redis store. Memory will limit your sessions to a single server instance, while redis will allow you to share sessions across a cluster of processes, or machines. To use redis, set the `store` property to "redis".

If the session `secret` is not provided, a version 4 `UUID` will be used.

```
{
	"session" : {
		cookie: {
			httpOnly: true,
			path: "/",
			sameSite: true,
			secure: false
		},
		name: "tenso.sid",
		proxy: true,
		redis: {
			host: "127.0.0.1",
			port: 6379
		},
		rolling: true,
		resave: true,
		saveUninitialized: true,
		secret: "tensoABC",
		store: "memory"
	}
}
```


## Security
Tensō uses [lusca](https://github.com/krakenjs/lusca#api) for security as a middleware. Please see it's documentation for how to configure it; each method & argument is a key:value pair for `security`.

```
{
	"security": { ... }
}
```

## Compression
Compression is enabled by default, for Clients that support `gzip` or `deflate`. Compression will be disabled if `SSL` is enabled.

## Rate Limiting
Rate limiting is controlled by configuration, and is disabled by default. Rate limiting is based on `token`, `session`, or `ip`, depending upon authentication method.

Rate limiting can be overridden by providing an `override` function that takes `req` & `rate`, and must return (a modified) `rate`.

```
{
	"rate": {
		"enabled": true,
		"limit": 450, /* Maximum requests allowed before `reset` */
		"reset": 900, /* TTL in seconds */
		"status": 429, /* Optional HTTP status */
		"message": "Too many requests",  /* Optional error message */
		"override": function ( req, rate ) { ... } /* Override the default rate limiting */
	}
}
```

## Limiting upload size
A 'max byte' limit can be enforced on all routes that handle `PATCH`, `POST`, & `PUT` requests. The default limit is 20 KB (20480 B).

```
{
	"maxBytes": 5242880
}
```

## Logging
Standard log levels are supported, and are emitted to `stdout` & `stderr`. Stack traces can be enabled.

```
{
    "logging": {
        "level": "warn",
        "enabled": true,
        "stack": true
    }
}
```

## Template
The browsable template can be overridden with a custom HTML document.

```
{
    "template": "/var/www/api/template.html"
}
```

## Static assets folder
The browsable template can load assets from this folder. assets.

```
{
    "static": "/var/www/api/assets/.*"
}
```

## Static assets cache
The browsable template assets have a default `public` cache of `300` seconds (5 minutes). These assets will always be considered `public`, but you can customize how long they are cacheable.

```
{
    "staticCache": 300
}
```

## Custom static routes
Custom static routes can be defined like such:

```
   "/other": (req, res) => req.server.static(req, res);
```

## EventSource streams
Create & cache an `EventSource` stream to send messages to a Client. See [tiny-eventsource](https://github.com/avoidwork/tiny-eventsource) for configuration options:

```
const streams = new Map();

...

"/stream": (req, res) => {
 const id = req.user.userId;

 if (streams.has(id) === false) {
   streams.set(id, req.server.eventsource({ms: 3e4), "initialized");
 }

 streams.get(id).init(req, res);
}

...

// Send data to Clients
streams.get(id).send({...});
```

## License
Copyright (c) 2018 Jason Mulligan
Licensed under the BSD-3-Clause license.
