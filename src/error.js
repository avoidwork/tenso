/**
 * Route error handler
 *
 * @method error
 * @return {Undefined} undefined
 */
let error = ( server, req, res, status, err ) => {
	server.respond( req, res, err, status );
};
