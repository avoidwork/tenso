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
	next();
}
