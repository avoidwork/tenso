/**
 * Prepares a response body
 *
 * @method prepare
 * @param  {Mixed}  arg    [Optional] Response body "data"
 * @param  {Object} error  [Optional] Error instance
 * @param  {Number} status HTTP status code
 * @return {Object}        Standardized response body
 */
function prepare (arg, err, status) {
	return {
		data: arg ? clone(arg) : null,
		error: !arg ? (err.message || err || "Something went wrong") : null,
		links: [],
		status: status || 200
	};
}
