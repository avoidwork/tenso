Tensō
=====

Tensō is a REST API facade for node.js, designed to simplify the implementation of APIs.

Tensō will handle the serialization & creation of hypermedia links, all you have to do is give it `Arrays` or `Objects`.

[![build status](https://secure.travis-ci.org/avoidwork/tenso.svg)](http://travis-ci.org/avoidwork/tenso)

## Example
Creating an API with Tensō is as simple as three statements.

```javascript
var tenso  = require( "tenso" ),
    routes = require( "./routes.js" );

tenso( {routes: routes} );
```

### Creating Routes
Routes are loaded as a module, with each HTTP method as an export, affording a very customizable API server.

Route handlers have the context of the Tensō server, i.e. `this` will allow you to send a response with `this.respond( req, res, body[, status, headers] )`.

The following example will create GET routes that will return an empty `Array` at `/`, an `Error` at `/reports/tps`, & a version 4 UUID at `/uuid`.

```javascript
var uuid = require( "keigai" ).util.uuid;

module.exports.get = {
	"/": [],
	"/reports/tps": function ( req, res ) {
		this.respond( req, res, new Error( "TPS Cover Sheet not attached" ), 785 );
	},
	"/uuid": function ( req, res ) {
		this.respond( req, res, uuid(), 200, {"cache-control": "no-cache"} );
	}
}
```

### Request Helpers
Tensō decorates `req` with "helpers" such as `req.ip`, & `req.parsed`. Cookies are available at `req.cookies{}`. Sessions are available at `req.sessions{}`. `PATCH`, `PUT`, or `POST` payloads are available as `req.body`.

## Responses
Responses will have a standard shape. The result, and hypermedia will be in `data`. Hypermedia (pagination, links, etc.) will be in `data.link:[ {"uri": "...", "rel": "..."}, ...]`, & pagination will also be present via the `Link` HTTP header.
The result will be in `data.result`.

```json
{
  "data": {{ `null` or `{link: [], result: ?}` }},
  "error": {{ `null` or an `Error` stack trace / message }},
  "status": {{ HTTP status code }}
}
```

## REST / Hypermedia
Hypermedia is a prerequisite of REST, and is best described by the [Richard Maturity Model](http://martinfowler.com/articles/richardsonMaturityModel.html). Tensō will automagically paginate Arrays of results, or parse Entity representations for keys that imply
relationships, and create the appropriate Objects in the `link` Array, as well as the `Link` HTTP header. Object keys that match this pattern: `/_(guid|uuid|id|uri|url)$/` will be considered
hypermedia links.

For example, if the key `user_id` was found, it would be mapped to `/users/:id` with a link `rel` of `related`.

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
	"hostname": "localhost", /* Optional, default is 'localhost' */
	"port": 8000, /* Optional, default is 8000 */
	"uid": N, /* Optional, system account uid to drop to after starting with elevated privileges to run on a low port */
	"routes": require( "./routes.js" ), /* Required! */
	"logs": { /* Optional */
		"level": "info",
		"stdout": true,
		"dtrace": false,
		"syslog": false
	},
	"ssl": { /* Optional */
		"key": null,
		"cert": null
	}
}
```

## Authentication
Planned authentication options include `OAuth2 (generic)`, `Twitter`, & `Facebook`.

### Basic Auth
`Basic Auth` will be applied to the entire API if enabled.

```javascript
{
	"auth": {
		"basic": {
			"enabled": true,
			"list": ["username:password", ...],
			"realm": "Private" // `realm` is optional
		}
	}
}
```

### Oauth2 Bearer Token
The `protect` Array is the endpoints that will be protected by `OAuth2 Bearer Tokens`.

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

### Local
The `protect` Array is the endpoints that will be protected by `local` authentication. Do not protect `/`, as it'll block the authentication end points.

`local` authentication will rely on sessions, so SSL is required for production servers.

```javascript
{
	"auth": {
		local: {
			enabled: true,
			auth: function ( req, res ) {
				if ( !req.session.authorized ) {
					if ( ... ) {
						req.session.authorized = true;
					}
					else {
						req.session.authorized = false;
					}

					req.session.save();
				}

				if ( req.session.authorized ) {
					this.redirect( req, res, "/stuff" );
				}
				else {
					this.error( req, res, 401, "Unauthorized" );
				}
			},
			middleware: function( req, res, next ) {
				if ( req.session.authorized ) {
					next();
				}
				else {
					res.redirect( "/login" );
				}
			},
			login: "/login"
		}
		"protect": ["/stuff"]
	}
}
```

## Rate Limiting
Rate limiting is controlled by configuration, and is disabled by default.

## Logging
Standard log levels are supported, and are emitted (by configuration) to `stdout` & `stderr`, & `syslog`.

## Dtrace
Dtrace probes can be enabled by configuration (disabled by default), and can be observed as `turtle-io`; Tensō is built on [turtle.io](https://github.com/avoidwork/turtle.io).

```
"allowed",        "char *", "char *", "char *", "int"
"allows",         "char *", "char *", "int"
"compress",       "char *", "char *", "int"
"compression",    "char *", "int"
"error",          "char *", "char *", "int", "char *", "int"
"headers",        "int", "int"
"log",            "char *", "int", "int", "int"
"proxy",          "char *", "char *", "char *", "char *", "int"
"middleware",     "char *", "char *", "int"
"request",        "char *", "int"
"respond",        "char *", "char *", "char *", "int", "int"
"status",         "int", "int", "int", "int", "int"
"write",          "char *", "char *", "char *", "char *", "int"
```

## License
Copyright (c) 2014 Jason Mulligan  
Licensed under the BSD-3 license.
