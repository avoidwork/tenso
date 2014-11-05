/**
 * Rate limiting middleware
 *
 * @method rate
 * @param  {Object}   obj  Tenso instance
 * @param  {Object}   req  Client request
 * @param  {Object}   res  Client response
 * @param  {Function} next Next middleware
 * @return {Undefined}     undefined
 */
function rate ( obj, req, res, next ) {
	var headers = ["x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"],
	    config  = obj.server.config.rate,
	    results = obj.rate( req, config.override ),
	    valid   = results.shift();

	array.each( headers, function ( i, idx ) {
		res.setHeader( i, results[idx] );
	} );

	if ( valid ) {
		next();
	}
	else {
		obj.error( req, res, config.status || 429, config.message || "Too Many Requests" );
	}
}
