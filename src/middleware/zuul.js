import {rate} from "./rate.js";

/**
 * Main protection middleware that coordinates authentication and rate limiting
 * Determines if a request should be protected based on auth patterns and handles rate limiting
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
export function zuul (req, res, next) {
	const uri = req.url;
	let protect = false;

	if (req.unprotect === false) {
		for (const i of req.server.auth.protect) {
			if (i.test(uri)) {
				protect = true;
				break;
			}
		}
	}

	// Setting state so the connection can be terminated properly
	req.protect = protect;
	req.protectAsync = false;

	rate(req, res, e => {
		if (e !== void 0) {
			res.error(e);
		} else if (protect) {
			next();
		} else {
			req.exit();
		}
	});
}
