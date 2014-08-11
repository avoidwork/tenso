/**
 * Keymaster for the request
 *
 * @method keymaster
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined}  undefined
 */
function keymaster ( req, res ) {
	var obj, result, routes, uri, valid;

	// No authentication, or it's already happened
	if ( !req.protect || !req.protectAsync || ( req.session && req.isAuthenticated() ) ) {
		obj    = req.server.tenso;
		routes = req.server.config.routes[req.method.toLowerCase()] || {};
		uri    = req.parsed.pathname;
		valid  = false;

		if ( uri in routes ) {
			result = routes[uri];

			if ( typeof result == "function" ) {
				result.call( obj, req, res );
			}
			else {
				obj.respond( req, res, result );
			}
		}
		else {
			iterate( routes, function ( value, key ) {
				var regex = new RegExp( "^" + key + "$", "i" );

				if ( regex.test( uri ) ) {
					result = value;

					return false;
				}
			} );

			if ( result ) {
				if ( typeof result == "function" ) {
					result.call( obj, req, res );
				}
				else {
					obj.respond( req, res, result );
				}
			}
			else {
				iterate( req.server.config.routes.get || {}, function ( value, key ) {
					var regex = new RegExp( "^" + key + "$", "i" );

					if ( regex.test( uri ) ) {
						valid = true;

						return false;
					}
				} );

				if ( valid ) {
					obj.error( req, res, 405 );
				}
				else {
					obj.error( req, res, 404 );
				}
			}
		}
	}
}
