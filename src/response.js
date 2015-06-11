/**
 * Creates a response
 *
 * @method response
 * @param  {Mixed}  arg    Unserialized response body
 * @param  {Number} status HTTP status, default is `200`
 * @return {Object}        Response body
 */
function response (arg, status) {
	let error = arg instanceof Error,
		rep;

	if (error) {
		if (status === undefined) {
			throw new Error("Invalid arguments");
		}

		rep = prepare(null, arg, status);
	} else {
		rep = prepare(arg, null, status);
	}

	return rep;
}
