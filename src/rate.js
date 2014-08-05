/**
 * Rate limiting middleware
 *
 * @method rate
 * @param  {Object}   req  Client request
 * @param  {Object}   res  Client response
 * @param  {Function} next Next middleware
 * @return {Undefined}     undefined
 */
function rate ( req, res, next ) {
	var headers = ["x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"],
	    results = this.rate( req );

	array.each( headers, function ( i, idx ) {
		res.setHeader( i, results[idx] );
	} );

	if ( results[1] > 0 ) {
		next();
	}
	else {
		this.error( req, res, 429, "Too Many Requests" );
	}
}
