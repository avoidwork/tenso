"use strict";

const path = require("path"),
	parsers = require(path.join(__dirname, "parsers.js")),
	{hasBody} = require(path.join(__dirname, "shared.js")),
	rateHeaders = [
		"x-ratelimit-limit",
		"x-ratelimit-remaining",
		"x-ratelimit-reset"
	];

function asyncFlag (req, res, next) {
	req.protectAsync = true;
	next();
}

function bypass (req, res, next) {
	req.unprotect = (req.cors && req.method === "OPTIONS") || req.server.config.auth.unprotect.filter(i => i.test(req.url)).length > 0; // eslint-disable-line no-extra-parens
	next();
}

function guard (req, res, next) {
	const login = req.server.config.auth.uri.login;

	if (req.parsed.pathname === login || req.isAuthenticated()) {
		next();
	} else {
		res.error(401);
	}
}

function parse (req, res, next) {
	let valid = true,
		exception;

	if (req.body !== "") {
		const type = "content-type" in req.headers ? req.headers["content-type"].replace(/\s.*$/, "") : "";

		if (type.length > 0 && parsers.has(type)) {
			try {
				req.body = parsers.get(type)(req.body);
			} catch (err) {
				valid = false;
				exception = err;
			}
		}
	}

	next(valid === false ? exception : void 0);
}

function payload (req, res, next) {
	if (hasBody(req.method) && (req.headers["content-type"] || "").includes("multipart") === false) {
		const obj = req,
			max = req.server.config.maxBytes;
		let body = "",
			invalid = false;

		obj.setEncoding("utf8");

		obj.on("data", data => {
			if (invalid === false) {
				body += data;

				if (max > 0 && Buffer.byteLength(body) > max) {
					invalid = true;
					res.error(413);
				}
			}
		});

		obj.on("end", () => {
			if (invalid === false) {
				req.body = body;
				next();
			}
		});
	} else {
		next();
	}
}

function keymaster (req, res) {
	if (req.protect === false || req.protectAsync === false || (req.session !== void 0 && req.isAuthenticated())) { // eslint-disable-line no-extra-parens
		req.last(req, res);
	} else {
		res.error(401);
	}
}

function rate (req, res, next) {
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

function zuul (req, res, next) {
	const uri = req.parsed.pathname;
	let protectd = false;

	if (req.unprotect === false) {
		for (const i of req.server.config.auth.protect) {
			if (i.test(uri)) {
				protectd = true;
				break;
			}
		}
	}

	// Setting state so the connection can be terminated properly
	req.protect = protectd;
	req.protectAsync = false;

	rate(req, res, e => {
		if (e !== void 0) {
			res.error(e);
		} else if (protectd) {
			next();
		} else {
			keymaster(req, res);
		}
	});
}

module.exports = {
	asyncFlag,
	bypass,
	guard,
	parse,
	payload,
	rate,
	zuul
};
