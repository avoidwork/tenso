import {INT_401} from "../core/constants.js";

/**
 * Authentication guard middleware that protects routes requiring authentication
 * Allows access to login URL or for authenticated users, otherwise returns 401
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
export function guard (req, res, next) {
	const login = req.server.auth.uri.login;

	if (req.url === login || req.isAuthenticated()) {
		next();
	} else {
		res.error(INT_401);
	}
}
