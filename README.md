Tensō
=====

[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/avoidwork/tenso?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Tensō is a REST API facade for node.js, designed to simplify the implementation of APIs.

Tensō will handle the serialization & creation of hypermedia links, all you have to do is give it `Arrays` or `Objects`.

[![build status](https://secure.travis-ci.org/avoidwork/tenso.svg)](http://travis-ci.org/avoidwork/tenso)

## Example
Creating an API with Tensō can be as simple as one statement.

```javascript
require( "tenso" )( {routes: require( __dirname + "/routes.js" )} );
```

### Creating Routes
Routes are loaded as a module, with each HTTP method as an export, affording a very customizable API server.

Route handlers have the context of the Tensō server, i.e. `this` will allow you to send a response with `this.respond(req, res, body[, status, headers])`. You can also use `res` to `res.respond(body[, status, headers])`, `res.redirect(url)`, or `res.error(status[, Error])`. 

The following example will create GET routes that will return an empty `Array` at `/`, an `Error` at `/reports/tps`, & a version 4 UUID at `/uuid`.

```javascript
var uuid = require( "keigai" ).util.uuid;

module.exports.get = {
	"/": ["/reports", "/uuid"],
	"/reports": ["/reports/tps"],
	"/reports/tps": function ( req, res ) {
		res.error( 785, Error( "TPS Cover Sheet not attached" ) );
	},
	"/uuid": function ( req, res ) {
		res.respond( uuid(), 200, {"cache-control": "no-cache"} );
	}
}
```

### Request Helpers
Tensō decorates `req` with "helpers" such as `req.ip`, & `req.parsed`. `PATCH`, `PUT`, & `POST` payloads are available as `req.body`. Sessions are available as `req.session` when using `local` authentication.

## Responses
Responses will have a standard shape, and will be utf-8 by default. The result, and hypermedia will be in `data`. Hypermedia (pagination, links, etc.) will be in `data.link:[ {"uri": "...", "rel": "..."}, ...]`, & pagination will also be present via the `Link` HTTP header.
The result will be in `data.result`.

```json
{
  "data": {{ `null` or `{link: [], result: ?}` }},
  "error": {{ `null` or an `Error` stack trace / message }},
  "status": {{ HTTP status code }}
}
```

## REST / Hypermedia
Hypermedia is a prerequisite of REST, and is best described by the [Richardson Maturity Model](http://martinfowler.com/articles/richardsonMaturityModel.html). Tensō will automagically paginate Arrays of results, or parse Entity representations for keys that imply
relationships, and create the appropriate Objects in the `link` Array, as well as the `Link` HTTP header. Object keys that match this pattern: `/_(guid|uuid|id|uri|url)$/` will be considered
hypermedia links.

For example, if the key `user_id` was found, it would be mapped to `/users/:id` with a link `rel` of `related`.

Tensō will bend the rules of REST when using authentication strategies provided by passport.js, or CSRF if is enabled, because they rely on a session. Session storage is in memory, or Redis. You have the option of a stateless or stateful API.

## Cache
Tensō has a robust multi-level cache strategy, starting at the response headers. If a response can be cached, an `Etag` will be sent to the `Client`, and registered in an `Etag LRU cache` which Tensō 
uses along with a 'cache compressed asset to disk' strategy, allowing Tensō to stream the last known version of a resource to the next `Client` that supports the same compression (gzip or deflate).
`Etags` will lazy expire from the cache, to minimize wasted cycles.

Caching can be disabled by setting the `cache-control` header to a "private" or "no cache" directive (see the above `/uuid` example).
 
## Configuration
This is a sample configuration for Tensō, without authentication or SSL. This would be ideal for development, but not production! Enabling SSL is as easy as providing file paths for the two keys.

```javascript
{
	"auth": /* Optional, see Authentication section */
	"cache": 1000, /* Optional, size of Etag LRU cache */
	"compress": false, /* Optional, enabled by default, disabled with SSL */
	"headers": { ... }, /* Optional, custom headers */
	"hostname": "localhost", /* Optional, default is 'localhost' */
	"json": 2, /* Optional, default indent for 'pretty' JSON */
	"logs": { /* Optional */
		"level": "debug",
		"stdout": true,
		"dtrace": true,
		"syslog": true
	},
	"port": 8000, /* Optional, default is 8000 */
	"routes": require( "./routes.js" ), /* Required! */
	"session": { /* Optional */
		"secret": null,
		"store": "memory", /* "memory" or "redis" */
		"redis": /* See connect-redis for options */
	},
	"ssl": { /* Optional */
		"cert": null,
		"key": null
	},
	"uid": N /* Optional, system account uid to drop to after starting with elevated privileges to run on a low port */
}
```

## Authentication
The `protect` Array is the endpoints that will require authentication. The `redirect` String is the end point users will be redirected to upon successfully authenticating, the default is `/`.

Sessions are used for non `Basic` or `Bearer Token` authentication, and will have `/login`, `/logout`, & custom routes. Redis is supported for session storage.

Multiple authentication strategies can be enabled at once.

### Basic Auth
```javascript
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

### Facebook
Facebook authentication will create `/auth`, `/auth/facebook`, & `/auth/facebook/callback` routes. `auth(accessToken, refreshToken, profile, callback)` must execute `callback(err, user)`.
 
```javascript
{
	"auth": {
		"facebook": {
			"enabled": true,
			"auth": function ( ... ) { ... }, /* Authentication handler, to 'find' or 'create' a User */
			"client_id": "", /* Get this from Facebook */
			"client_secret": "" /* Get this from Facebook */
		},
		"protect": ["/private"]
	}
}
```

### Google
Google authentication (OpenID) will create `/auth`, `/auth/google`, & `/auth/google/callback` routes. `auth(identifier, profile, callback)` must execute `callback(err, user)`.
 
```javascript
{
	"auth": {
		"google": {
			"enabled": true,
			"auth": function ( ... ) { ... }, /* Authentication handler, to 'find' or 'create' a User */
		},
		"protect": ["/private"]
	}
}
```

### LinkedIn
LinkedIn authentication will create `/auth`, `/auth/linkedin`, & `/auth/linkedin/callback` routes. `auth(token, tokenSecret, profile, callback)` must execute `callback(err, user)`.
 
```javascript
{
	"auth": {
		"linkedin": {
			"enabled": true,
			"auth": function ( ... ) { ... }, /* Authentication handler, to 'find' or 'create' a User */
			"client_id": "", /* Get this from LinkedIn */
			"client_secret": "", /* Get this from LinkedIn */,
			"scope": "" /* Optional, permission scope */
		}
		"protect": ["/private"]
	}
}
```

### Local
Local authentication will create `/login`. `auth(username, password)` must execute `callback(err, user)`.

```javascript
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
 
```javascript
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
```javascript
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
 
```javascript
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

### Twitter
Twitter authentication will create `/auth`, `/auth/twitter`, & `/auth/twitter/callback` routes. `auth(token, tokenSecret, profile, callback)` must execute `callback(err, user)`.
 
```javascript
{
	"auth": {
		"twitter": {
			"enabled": true,
			"auth": function ( ... ) { ... }, /* Authentication handler, to 'find' or 'create' a User */
			"consumer_key": "", /* Get this from Twitter */
			"consumer_secret": "" /* Get this from Twitter */
		},
		"protect": ["/private"]
	}
}
```

## Sessions
Sessions can use a memory (default) or redis store. Memory will limit your sessions to a single server instance, while redis will allow you to share sessions across a cluster of processes, or machines. To use redis, set the `store` property to "redis".

If the session `secret` is not provided, a version 4 `UUID` will be used.

```javascript
{
	"session" : {
		"secret": "my secret",
		"store": "redis",
		"redis": {
			"host": "127.0.0.1",
			"port": 6379
		}
	}
}
```


## Security
Tensō uses [lusca](https://github.com/krakenjs/lusca#api) for security as a middleware. Please see it's documentation for how to configure it; each method & argument is a key:value pair for `security`.

```javascript
{
	"security": { ... }
}
```

## Compression
Compression is enabled by default, for Clients that support `gzip` or `deflate`. Compression will be disabled if `SSL` is enabled.

## Rate Limiting
Rate limiting is controlled by configuration, and is disabled by default. Rate limiting is based on `token`, `session`, or `ip`, depending upon authentication method.

Rate limiting can be overridden by providing an `override` function that takes `req` & `rate`, and must return (a modified) `rate`.

```javascript
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
A 'max byte' limit can be enforced on all routes that handle `PATCH`, `POST`, & `PUT` requests. The default limit is 1 MB (1048576 b).

```javascript
{
	"maxBytes": 5242880
}
```

## Logging
Standard log levels are supported, and are emitted (by configuration) to `stdout` & `stderr`, & `syslog`.

## DTrace
DTrace probes can be enabled by configuration (disabled by default). A shell script is available at `./dtrace.sh` to observe the probes.
The last argument for each probe is the nanoseconds it took to execute.

```
"allowed",        "char *", "char *", "char *", "int"
"allows",         "char *", "char *", "int"
"compress",       "char *", "char *", "int"
"compression",    "char *", "int"
"error",          "char *", "char *", "int",    "char *", "int"
"headers",        "int",    "int"
"log",            "char *", "int",    "int",    "int"
"proxy",          "char *", "char *", "char *", "char *", "int"
"middleware",     "char *", "char *", "int"
"request",        "char *", "int"
"respond",        "char *", "char *", "char *", "int",    "int"
"status",         "int",    "int",    "int",    "int",    "int"
"write",          "char *", "char *", "char *", "char *", "int"
```

## License
Copyright (c) 2014 Jason Mulligan  
Licensed under the BSD-3 license.
