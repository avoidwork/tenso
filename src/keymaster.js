/**
 * Keymaster for the request
 *
 * @method keymaster
 * @param req
 * @param res
 */
function keymaster ( req, res ) {
	var obj, result, routes, uri;

	// No authentication, or it's already happened
	if ( !req.protect || !req.protectAsync ) {
		obj    = req.server.tenso;
		routes = req.server.config.routes[req.method.toLowerCase()] || {};
		uri    = req.parsed.pathname;

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
				obj.error( req, res, 404 );
			}
		}
	}
}
