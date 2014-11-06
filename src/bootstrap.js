/**
 * Bootstraps an instance of Tenso
 *
 * @method bootstrap
 * @param  {Object} obj    Tenso instance
 * @param  {Object} config Application configuration
 * @return {Object}        Tenso instance
 */
function bootstrap ( obj, config ) {
	var notify = false;

	function mediator ( req, res, next ) {
		res.error = function ( status, body ) {
			return obj.error( req, res, status, body );
		};

		res.redirect = function ( uri ) {
			return obj.redirect( req, res, uri );
		};

		res.respond = function ( body, status, headers ) {
			return obj.respond( req, res, body, status, headers );
		};

		next();
	}

	function parse ( req ) {
		var args, type;

		if ( REGEX_BODY.test( req.method ) && req.body !== undefined ) {
			type = req.headers["content-type"];

			if ( REGEX_FORMENC.test( type ) ) {
				args = req.body ? array.chunk( req.body.split( REGEX_BODY_SPLIT ), 2 ) : [];
				req.body = {};

				array.each( args, function ( i ) {
					req.body[i[0]] = coerce( i[1] );
				} );
			}

			if ( REGEX_JSONENC.test( type ) ) {
				req.body = json.decode( req.body, true );
			}
		}

		arguments[2]();
	}

	obj.server.use( mediator ).blacklist( mediator );
	obj.server.use( parse ).blacklist( parse );

	// Bootstrapping configuration
	config                = auth( obj, config );
	config.headers        = config.headers || {};
	config.headers.server = SERVER;

	// Creating status > message map
	iterate( obj.server.codes, function ( value, key ) {
		obj.messages[value] = obj.server.messages[key];
	} );

	// Setting routes
	if ( config.routes instanceof Object ) {
		iterate( config.routes, function ( routes, method ) {
			iterate( routes, function ( arg, route ) {
				if ( typeof arg == "function" ) {
					obj.server[method]( route, function () {
						arg.apply( obj, array.cast( arguments ) );
					} );
				}
				else {
					obj.server[method]( route, function ( req, res ) {
						obj.respond( req, res, arg );
					} );
				}
			} );
		} );
	}

	// Disabling compression over SSL due to BREACH
	if ( config.ssl.cert && config.ssl.key ) {
		config.compress = false;
		notify = true;
	}

	// Starting API server
	obj.server.start( config, function ( req, res, status, msg ) {
		error( obj.server, req, res, status, msg || obj.messages[status] );
	} );

	// Intercepts all responses and decorates a private directive is user is authenticated
	obj.respond = ( function () {
		var fn = obj.respond;

		return function ( req, res, body, status, headers ) {
			if ( req.protect ) {
				headers = headers || clone( obj.server.config.headers, true );

				if ( headers["cache-control" ].indexOf( "private " ) == -1 ) {
					headers["cache-control"] = "private " + headers["cache-control"];
				}
			}

			return fn.call( obj, req, res, body, status, headers );
		};
	} )();

	if ( notify ) {
		obj.server.log( "Compression over SSL is disabled for your protection", "debug" );
	}

	return obj;
}
