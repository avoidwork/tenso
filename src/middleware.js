const path = require("path"),
	regex = require(path.join(__dirname, "regex.js")),
	utility = require(path.join(__dirname, "utility.js"));

const rateHeaders = [
	"x-ratelimit-limit",
	"x-ratelimit-remaining",
	"x-ratelimit-reset"
];

function rate (req, res, next) {
	let server = req.server,
		obj = server.tenso,
		config = server.config.rate,
		results = obj.rate(req, config.override),
		valid = results.shift();

	rateHeaders.forEach(function (i, idx) {
		res.setHeader(i, results[idx]);
	});

	if (valid) {
		next();
	} else {
		obj.error(req, res, config.status || 429, config.message || "Too Many Requests");
	}
}

function keymaster (req, res, next) {
	let obj = req.server.tenso,
		method, result, routes, uri;

	// No authentication, or it's already happened
	if (!req.protect || !req.protectAsync || (req.session && req.isAuthenticated())) {
		method = regex.get_rewrite.test(req.method) ? "get" : req.method.toLowerCase();
		routes = req.server.config.routes[method] || {};
		uri = req.parsed.pathname;

		if (uri in routes) {
			result = routes[uri];

			if (typeof result === "function") {
				result.call(obj, req, res);
				next();
			} else {
				obj.respond(req, res, result).then(next, next);
			}
		} else {
			utility.iterate(routes, function (value, key) {
				if (new RegExp("^" + key + "$", "i").test(uri)) {
					return !(result = value);
				}
			});

			if (result) {
				if (typeof result === "function") {
					result.call(obj, req, res);
					next();
				} else {
					obj.respond(req, res, result).then(next, next);
				}
			} else {
				obj.error(req, res, 404);
			}
		}
	} else {
		obj.error(req, res, 401);
	}
}

module.exports = {
	keymaster: keymaster,
	rate: rate
};
