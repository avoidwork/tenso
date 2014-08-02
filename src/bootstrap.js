/**
 * Bootstraps an instance of Tenso
 *
 * @method bootstrap
 * @param  {Object} obj    Tenso instance
 * @param  {Object} config Application configuration
 * @return {Object}        Tenso instance
 */
function bootstrap( obj, config ) {
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
					obj.server[method]( route, arg );
				}
				else {
					obj.server[method]( route, function ( req, res ) {
						this.respond( req, res, prepare( arg ) );
					} );
				}
			} );
		} );
	}

	// Starting API server
	obj.server.start( config, function ( req, res, status ) {
		error( obj.server, req, res, status, obj.messages[status] );
	} );

	return obj;
}
