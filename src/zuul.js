/**
 * Returns middleware to determine if a route is protected
 *
 * @method zuul
 * @param {Array} protect Array of routes
 * @return {Function}    Middleware
 */
let zuul = ( protect ) => {
	return ( req, res, next ) => {
		let uri = req.parsed.path,
			protectd = false;

		array.iterate( protect, ( r ) => {
			if ( r.test( uri ) ) {
				return !( protectd = true );
			}
		} );

		// Setting state so the connection can be terminated properly
		req.protect = protectd;
		req.protectAsync = false;

		if ( protectd && next ) {
			next();
		} else {
			keymaster( req, res );
		}
	};
};
