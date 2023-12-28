import {INT_429, RETRY_AFTER, X_RATELIMIT_LIMIT, X_RATELIMIT_REMAINING, X_RATELIMIT_RESET} from "../utils/constants.js";

const rateHeaders = [
	X_RATELIMIT_LIMIT,
	X_RATELIMIT_REMAINING,
	X_RATELIMIT_RESET
];

export function rate (req, res, next) {
	const config = req.server.config.rate;

	if (config.enabled === false || req.unprotect) {
		next();
	} else {
		const results = req.server.rate(req, config.override),
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
