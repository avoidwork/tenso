Tensō
=====

Tensō is a REST framework for node.js, designed to simplify the implementation of APIs.

## Example
Creating an API with Tensō is as simple as three statements.

```javascript
"use strict";

var tenso  = require( "tenso" ),
    config = require( __dirname + "/config.json" ),
    app    = tenso( config );
```

## Creating Routes
Routes are loaded as a module, affording a very customizable API server. The following example will return an empty `Array` at `/`, a `String` at `/reports/tps`, & a random number at `/random`.

```javascript
var random  = require( "keigai" ).util.number.random,
    prepare = require( "./lib/tenso" ).prepare;

module.exports.get = {
	"/": [],
	"/reports/tps": "TPS Cover Sheet not attached",
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
