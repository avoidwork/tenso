/**
 * Prepares a response body
 *
 * @method prepare
 * @param  {Mixed}  data   [Optional] Response body "data"
 * @param  {Object} error  [Optional] Error instance
 * @param  {Number} status HTTP status code
 * @return {Object}        Standardized response body
 */
function prepare ( data, error, status ) {
	if ( data !== null ) {
		error = null;
	}

	return {
		data   : data   || null,
		error  : error ? ( error.message || error.stack || error ) : null,
		status : status || 200
	};
}
