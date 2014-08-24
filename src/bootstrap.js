/**
 * Bootstraps an instance of Tenso
 *
 * @method bootstrap
 * @param  {Object} obj    Tenso instance
 * @param  {Object} config Application configuration
 * @return {Object}        Tenso instance
 */
function bootstrap ( obj, config ) {
	function mediator ( req, res, next ) {
		res.error = function ( status, body ) {
			obj.error( req, res, status, body );
		};

		res.redirect = function ( uri ) {
			obj.redirect( req, res, uri );
		};

		res.respond = function ( body, status, headers ) {
			obj.respond( req, res, body, status, headers );
		};

		next();
	}

	function rateLimit ( req, res, next ) {
		rate( obj, req, res, next );
	}

	obj.server.use( mediator ).blacklist( mediator );

	if ( config.rate.enabled ) {
		obj.server.use( rateLimit ).blacklist( rateLimit );
	}

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
		obj.server.log( "Compression over SSL is disabled for your protection", "debug" );
	}

	// Starting API server
	obj.server.start( config, function ( req, res, status, msg ) {
		error( obj.server, req, res, status, msg || obj.messages[status] );
	} );

	return obj;
}
