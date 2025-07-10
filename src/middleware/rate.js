import {INT_429, RETRY_AFTER, X_RATELIMIT_LIMIT, X_RATELIMIT_REMAINING, X_RATELIMIT_RESET} from "../core/constants.js";

const rateHeaders = [
	X_RATELIMIT_LIMIT,
	X_RATELIMIT_REMAINING,
	X_RATELIMIT_RESET
];

/**
 * Rate limiting middleware that enforces request rate limits
 * Tracks request rates and returns 429 status when limits are exceeded
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
export function rate (req, res, next) {
	const config = req.server.rate;

	if (config.enabled === false || req.unprotect) {
		next();
	} else {
		const results = req.server.rateLimit(req, config.override),
			good = results.shift();

		if (good) {
			for (const [idx, i] of rateHeaders.entries()) {
				res.header(i, results[idx]);
			}

			next();
		} else {
			res.header(RETRY_AFTER, config.reset);
			res.error(config.status || INT_429);
		}
	}
}
