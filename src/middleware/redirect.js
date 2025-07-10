/**
 * Authentication redirect middleware that redirects to the configured auth redirect URI
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {void}
 */
export function redirect (req, res) {
	res.redirect(req.server.auth.uri.redirect, false);
}
