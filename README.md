Tensō
=====

Tensō is a REST framework for node.js, designed to simplify the implementation of APIs.

## Example
Creating an API with Tensō is as simple as three statements.

```javascript
var tenso  = require( "tenso" ).factory,
    routes = require( "./routes.js" ),
    app    = tenso( {routes: routes} );
```

### Creating Routes
Routes are loaded as a module, with each HTTP method as an export, affording a very customizable API server. The following example will create GET routes that will return an empty `Array` at `/`, an `Error` at `/reports/tps`, & a random number at `/random`. Route handlers have the context of the API server, i.e. `this` will allow you to send a response with `this.respond( req, res, body[, status, headers] )`.

```javascript
var random   = require( "keigai" ).util.number.random,
    response = require( "tenso" ).response;

module.exports.get = {
	"/": [],
	"/reports/tps": function ( req, res ) {
		this.respond( req, res, response( new Error( "TPS Cover Sheet not attached" ), 785 ), 785 );
	},
	"/random": function ( req, res ) {
		this.respond( req, res, response( random() ) );
	}
}
```

## API
### factory( [config] )
Tensō factory, which accepts a configuration Object

### prepare( data[, error, status] )
Prepares a standard response body, use `response()` unless you need to by pass validation

### response( arg[, status] )
Quick way to prepare a response body

## Configuration
This is a sample configuration for Tensō, without authentication or SSL. This would be ideal for development, but not production! Enabling is as easy as providing file paths for the two keys.

```json
{
	"hostname": "localhost",
	"pageSize": 5,
	"port": 8000,
	"routes": "routes.js",
	"log": {
		"dtrace": false,
		"syslog": false
	},
	"ssl": {
		"key": null,
		"cert": null
	}
}
```

## License
Copyright (c) 2014 Jason Mulligan  
Licensed under the BSD-3 license.
