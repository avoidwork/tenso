"use strict";

const path = require("path"),
	http = require("http"),
	fs = require("fs"),
	retsu = require("retsu"),
	coerce = require("tiny-coerce"),
	mime = require("mimetype"),
	precise = require("precise"),
	regex = require(path.join(__dirname, "regex.js")),
	iterate = require(path.join(__dirname, "iterate.js")),
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
	if (req.server.config.auth.unprotect.filter(i => i.test(req.url) === true).length > 0) {
		req.unprotect = true;
	}

	next();
}

function file (req, res, next) {
	const server = req.server;

	if (req.headers.expect !== void 0) {
		next(new Error(417));
	} else {
		const root = path.join(server.config.root, server.config.hosts[req.host]),
			lpath = path.join(root, req.parsed.pathname.replace(regex.dir, ""));

		fs.lstat(lpath, (e, stats) => {
			if (e !== null) {
				next(e);
			} else if (stats.isDirectory() === false) {
				req.file = {path: lpath, stats: stats};
				server.log("Routed request to disk", "debug");
				next();
			} else if (regex.get.test(req.method) === true && regex.dir.test(req.parsed.pathname) === false) {
				res.redirect((req.parsed.pathname !== "/" ? req.parsed.pathname : "") + "/" + req.parsed.search, 301);
			} else {
				let count = 0,
					handled = false,
					nth = server.config.index.length;

				if (nth > 0) {
					retsu.each(server.config.index, i => {
						let npath = path.join(lpath, i);

						fs.lstat(npath, (err, lstats) => {
							if (err === null && handled === false) {
								handled = true;
								req.file = {path: npath, stats: lstats};
								server.log("Routed request to disk", "debug");
								next();
							} else if (++count === nth && handled === false) {
								next();
							}
						});
					});
				} else {
					next();
				}
			}
		});
	}
}

function guard (req, res, next) {
	if (req.parsed.url === "/login" || req.isAuthenticated() === true) {
		next();
	} else {
		res.redirect("/login");
	}
}

function parse (req, res, next) {
	if (regex.body.test(req.method) === true && req.body !== void 0) {
		let type = req.headers["content-type"];

		if (regex.encode_form.test(type) === true) {
			let args = req.body ? retsu.chunk(req.body.split(regex.body_split), 2) : [];

			req.body = {};
			iterate(args, i => {
				req.body[i[0]] = coerce(decodeURIComponent(i[1]));
			});
		} else if (regex.encode_json.test(type) === true || regex.json_wrap.test(req.body) === true) {
			try {
				req.body = JSON.parse(req.body);
			} catch (e) {
				void 0;
			}
		}
	}

	next();
}

function payload (req, res, next) {
	if (regex.body.test(req.method) === true) {
		const server = req.server;
		let body;

		req.setEncoding("utf-8");
		req.invalid = false;

		req.on("data", data => {
			body = body === void 0 ? data : body + data;

			if (server.config.maxBytes > 0 && Buffer.byteLength(body) > server.config.maxBytes) {
				req.invalid = true;
				next(new Error(413));
			}
		});

		req.on("end", () => {
			if (req.invalid === false) {
				if (body !== void 0) {
					req.body = body;
				}

				next();
			}
		});
	} else {
		next();
	}
}

function keymaster (req, res, next) {
	const obj = req.server.tenso,
		authd = req.session !== void 0 && req.isAuthenticated() === true;

	// No authentication, or it's already happened
	if (req.protect === false || req.protectAsync === false || authd === true) {
		const method = regex.get_rewrite.test(req.method) ? "get" : req.method.toLowerCase(),
			routes = req.server.config.routes[method] || {},
			uri = req.parsed.pathname;
		let result;

		if (uri in routes) {
			result = routes[uri];

			if (typeof result === "function") {
				result.call(obj, req, res);
			} else {
				res.send(result);
			}
		} else {
			iterate(routes, (value, key) => {
				if (regex.has_param.test(key) === true && regex.leftBrace.test(key) === false) {
					key = key.replace(/\/:(\w*)/g, "/(.*)");
				}

				if (new RegExp(`^${key}$`, "i").test(uri) === true) {
					return !(result = value);
				}

				return void 0;
			});

			if (result !== void 0) {
				if (typeof result === "function") {
					result.call(obj, req, res);
				} else {
					res.send(result);
				}
			} else {
				next(new Error(404));
			}
		}
	} else {
		next(new Error(401));
	}
}

function rate (req, res, next) {
	const server = req.server,
		config = server.config.rate;

	let good, results;

	if (config.enabled === false || req.unprotect === true) {
		next();
	} else {
		results = server.rate(req, config.override);
		good = results.shift();
		iterate(rateHeaders, (i, idx) => res.setHeader(i, results[idx]));

		if (good === true) {
			next();
		} else {
			next(new Error(config.status || 429));
		}
	}
}

function stream (req, res, next) {
	const method = req.method,
		server = req.server,
		stats = req.file ? req.file.stats : {};
	let status = 200,
		letag, headers, options;

	// Not a file on disk
	if (req.file === void 0) {
		return next(new Error(http.STATUS_CODES[404]));
	}

	if (server.canETag(req.parsed.pathname, req.method) === true) {
		letag = server.etag(req.parsed.pathname, stats.size, stats.mtime);
	}

	headers = {
		"content-length": stats.size,
		"content-type": mime.lookup(req.file.path),
		"last-modified": stats.mtime.toUTCString()
	};

	if (letag !== void 0) {
		headers.etag = letag;
	}

	if (regex.get_only.test(method) === true) {
		if (letag !== void 0 && req.headers["if-none-match"] === letag) {
			delete headers["content-length"];
			res.send("", 304, headers);
		} else if (req.headers["if-none-match"] === void 0 && Date.parse(req.headers["if-modified-since"]) >= stats.mtime) {
			delete headers["content-length"];
			res.send("", 304, headers);
		} else {
			options = {};

			// Setting the partial content headers
			if (req.headers.range !== void 0) {
				retsu.each(req.headers.range.replace(/^.*=/, "").split(",")[0].split("-"), (i, idx) => {
					options[idx === 0 ? "start" : "end"] = i ? parseInt(i, 10) : void 0;
				});

				// Byte offsets
				if (isNaN(options.start) === true && isNaN(options.end) === false) {
					options.start = stats.size - options.end;
					options.end = stats.size;
				} else if (isNaN(options.end) === true) {
					options.end = stats.size;
				}

				if (options.start >= options.end || isNaN(options.start) === true || isNaN(options.end) === true) {
					return res.error(416, http.STATUS_CODES[416]);
				}

				status = 206;
				headers["content-range"] = `bytes ${options.start}-${options.end}/${stats.size}`;
				headers["content-length"] = options.end - options.start + 1;
			}

			res.send(fs.createReadStream(req.file.path, options), status, headers);
		}
	} else {
		res.send("", 200, headers);
	}

	return void 0;
}

function statik (req, res) {
	file(req, res, err => {
		if (err !== void 0) {
			res.error(404, http.STATUS_CODES[404]);
		} else {
			if (res.hasHeader("cache-control") === true) {
				res.removeHeader("cache-control");
			}

			res.header("cache-control", `public, max-age=${(req.server.config.staticCache || 300)}`);
			stream(req, res, err2 => {
				if (err2 !== void 0) {
					res.error(404, http.STATUS_CODES[404]);
				}
			});
		}
	});
}

function timer (req, res, next) {
	req.timer = precise().start();
	next();
}

function zuul (req, res, next) {
	const uri = req.parsed.path;
	let protectd = false;

	if (regex.options.test(req.method) === false) {
		iterate(req.server.config.auth.protect, i => {
			if (i.test(uri) === true) {
				return !(protectd = true);
			}

			return void 0;
		});

		// Setting state so the connection can be terminated properly
		req.protect = protectd;
		req.protectAsync = false;

		rate(req, res, e => {
			if (e !== void 0) {
				next(e);
			} else if (protectd === true) {
				next();
			} else {
				keymaster(req, res, next);
			}
		});
	} else {
		res.send("OPTIONS requests are only support for CORS");
	}
}

module.exports = {
	asyncFlag: asyncFlag,
	bypass: bypass,
	guard: guard,
	parse: parse,
	payload: payload,
	rate: rate,
	"static": statik,
	timer: timer,
	zuul: zuul
};
