/**
 * Creates a response
 *
 * @method response
 * @param  {Mixed}  arg    Unserialized response body
 * @param  {Number} status HTTP status, default is `200`
 * @return {Object}        Response body
 */
function response (arg, status) {
	let err = arg instanceof Error,
		result;

	if (err) {
		if (status === undefined) {
			throw new Error("Invalid arguments");
		}

		result = prepare(null, arg, status);
	} else {
		result = prepare(arg, null, status);
	}

	return result;
}
