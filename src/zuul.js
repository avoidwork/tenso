/**
 * Returns middleware to determine if a route is protected
 *
 * @method zuul
 * @param {Array} protect Array of routes
 * @return {Undefined}    undefined
 */
function zuul ( protect ) {
	return function ( req, res, next ) {
		var uri      = req.parsed.path,
		    protectd = false;

		array.each( protect, function ( regex ) {
			if ( regex.test( uri ) ) {
				protectd = true;
				return false;
			}
		} );

		if ( protectd && next ) {
			next();
		}
	};
}
