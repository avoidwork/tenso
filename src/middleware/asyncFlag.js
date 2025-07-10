/**
 * Middleware that sets the async protection flag on the request object
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
export function asyncFlag (req, res, next) {
	req.protectAsync = true;
	next();
}
