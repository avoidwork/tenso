Tensō
=====

Tensō is a REST API facade for node.js, designed to simplify the implementation of APIs.

Tensō will handle the serialization & creation of hypermedia links, all you have to do is give it `Arrays` or `Objects`.

[![build status](https://secure.travis-ci.org/avoidwork/tenso.svg)](http://travis-ci.org/avoidwork/tenso)

## Example
Creating an API with Tensō is as simple as three statements.

```javascript
var tenso  = require( "tenso" ),
    routes = require( "./routes.js" ),
    app    = tenso( {routes: routes} );
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
		this.respond( req, res, uuid() );
	}
}
```

## Responses
Responses will have a standard shape. The result, and hypermedia will be in `data`. Hypermedia (pagination, links, etc.) will be in `data.link:[ {"uri": "...", "rel": "..."}, ...]`, & pagination will also be present via the `Link` HTTP header.
The result will be in `data.result`.

```json
{
  "data": {{ `null` or the response }},
  "error": {{ `null` or an `Error` stack trace / message }},
  "status": {{ HTTP status code }}
}
```

## REST / Hypermedia
Hypermedia is a prerequisite of REST, and is best described by the [Richard Maturity Model](http://martinfowler.com/articles/richardsonMaturityModel.html). Tensō will automagically paginate Arrays of results, or parse Entity representations for keys that imply
relationships, and create the appropriate Objects in the `link` Array, as well as the `Link` HTTP header. Object keys that match this pattern: `/_(guid|uuid|id|uri|url)$/` will be considered
hypermedia links.

For example, if the key `user_id` was found, it would be mapped to `/users/:id` with a link `rel` of `related`.

## Configuration
This is a sample configuration for Tensō, without authentication or SSL. This would be ideal for development, but not production! Enabling SSL is as easy as providing file paths for the two keys.

```json
{
	"auth": ["username:password", ...] or {"realm": "Super Secret", "list": ["username:password", ...]} /* Optional */
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

## Logging
Standard log levels are supported, and are emitted (by configuration) to `stdout` & `stderr`, & `syslog`.


## Dtrace
Dtrace probes can be enabled by configuration (disabled by default), and can be observed as `turtle-io`; Tensō is built on `turtle.io`.

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
