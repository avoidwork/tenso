Tensō
=====

Tensō is a REST framework for node.js, designed to simplify the implementation of APIs.

## Example
Creating an API with Tensō is as simple as three statements.

```javascript
"use strict";

var tenso = require( "tenso" ),
    app   = tenso( {routes: "routes.js"} );
```

## Creating Routes
Routes are loaded as a module, with each HTTP method as an export, affording a very customizable API server. The following example will create GET routes that will return an empty `Array` at `/`, an `Error` at `/reports/tps`, & a random number at `/random`.

```javascript
var random  = require( "keigai" ).util.number.random,
    prepare = require( "tenso" ).prepare;

module.exports.get = {
	"/": [],
	"/reports/tps": function ( req, res ) {
		this.respond( req, res, prepare( null, new Error( "TPS Cover Sheet not attached" ), 785 ), 785 );
	},
	"/random": function ( req, res ) {
		this.respond( req, res, prepare( random() ) );
	}
}
```

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
