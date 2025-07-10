/**
 * Middleware that terminates the request if the URL matches configured exit patterns
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
export function exit (req, res, next) {
	if (req.server.exit.includes(req.url)) {
		req.exit();
	} else {
		next();
	}
}
