const rateHeaders = [
	"x-ratelimit-limit",
	"x-ratelimit-remaining",
	"x-ratelimit-reset"
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
			res.header("retry-after", config.reset);
			res.error(config.status || 429);
		}
	}
}
