"use strict";

const path = require("path"),
	fs = require("fs"),
	retsu = require("retsu"),
	coerce = require("tiny-coerce"),
	mime = require("mimetype"),
	precise = require("precise"),
	regex = require(path.join(__dirname, "regex.js")),
	login = "/login",
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
	if (req.headers.expect !== void 0) {
		next(new Error(417));
	} else {
		const lpath = path.join(req.server.config.root, "www", req.parsed.pathname.replace(regex.dir, ""));

		fs.lstat(lpath, (e, stats) => {
			if (e !== null) {
				next(e);
			} else if (stats.isDirectory() === false) {
				req.file = {path: lpath, stats: stats};
				req.server.log("Routed request to disk", "debug");
				next();
			} else if (regex.get.test(req.method) === true && regex.dir.test(req.parsed.pathname) === false) {
				res.redirect((req.parsed.pathname !== "/" ? req.parsed.pathname : "") + "/" + req.parsed.search, 301);
			} else {
				const nth = req.server.config.index.length;
				let count = 0,
					handled = false;

				if (nth > 0) {
					retsu.each(req.server.config.index, i => {
						const npath = path.join(lpath, i);

						fs.lstat(npath, (err, lstats) => {
							if (err === null && handled === false) {
								handled = true;
								req.file = {path: npath, stats: lstats};
								req.server.log("Routed request to disk", "debug");
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
	if (req.parsed.url === login || req.isAuthenticated() === true) {
		next();
	} else {
		res.redirect(login);
	}
}

function parse (req, res, next) {
	if (regex.body.test(req.method) === true && req.body !== void 0) {
		const type = req.headers["content-type"];

		if (regex.encode_form.test(type) === true) {
			const args = req.body ? retsu.chunk(req.body.split(regex.body_split), 2) : [];

			req.body = {};
			retsu.each(args, i => {
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
		let body = "";

		req.setEncoding("utf8");
		req.invalid = false;

		req.on("data", data => {
			body += data;

			if (req.server.config.maxBytes > 0 && Buffer.byteLength(body) > req.server.config.maxBytes) {
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
	// No authentication, or it's already happened
	if (req.protect === false || req.protectAsync === false || (req.session !== void 0 && req.isAuthenticated() === true) === true) {
		const method = regex.get_rewrite.test(req.method) ? "get" : req.method.toLowerCase(),
			routes = req.server.config.routes[method] || {},
			uri = req.parsed.pathname;
		let result;

		if (uri in routes) {
			result = routes[uri];

			if (typeof result === "function") {
				result.call(req.server.tenso, req, res);
			} else {
				res.send(result);
			}
		} else {
			retsu.each(Reflect.ownKeys(routes), i => {
				let key = i;

				if (regex.has_param.test(i) === true && regex.leftBrace.test(i) === false) {
					key = i.replace(/\/:(\w*)/g, "/(.*)");
				}

				if (new RegExp(`^${key}$`, "i").test(uri) === true) {
					return !(result = routes[i]);
				}

				return void 0;
			});

			if (result !== void 0) {
				if (typeof result === "function") {
					result.call(req.server.tenso, req, res);
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
	if (req.server.config.rate.enabled === false || req.unprotect === true) {
		next();
	} else {
		const results = req.server.rate(req, req.server.config.rate.override),
			good = results.shift();

		retsu.each(rateHeaders, (i, idx) => res.header(i, results[idx]));

		if (good === true) {
			next();
		} else {
			next(new Error(req.server.config.rate.status || 429));
		}
	}
}

function stream (req, res, next) {
	if (req.file === void 0) {
		next(new Error(404));
	} else {
		const headers = {
			"content-length": req.file.stats.size,
			"content-type": mime.lookup(req.file.path),
			"last-modified": req.file.stats.mtime.toUTCString()
		};

		let status = 200,
			letag, options;

		if (req.server.canETag(req.parsed.pathname, req.method) === true) {
			letag = headers.etag = req.server.etag(req.parsed.pathname, req.file.stats.size, req.file.stats.mtime);
		}

		if (regex.get_only.test(req.method) === true) {
			if (letag !== void 0 && req.headers["if-none-match"] === letag) {
				delete headers["content-length"];
				res.send("", 304, headers);
			} else if (req.headers["if-none-match"] === void 0 && Date.parse(req.headers["if-modified-since"]) >= req.file.stats.mtime) {
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
						options.start = req.file.stats.size - options.end;
						options.end = req.file.stats.size;
					} else if (isNaN(options.end) === true) {
						options.end = req.file.stats.size;
					}

					if (options.start >= options.end || isNaN(options.start) === true || isNaN(options.end) === true) {
						return next(new Error(416));
					}

					status = 206;
					headers["content-range"] = `bytes ${options.start}-${options.end}/${req.file.stats.size}`;
					headers["content-length"] = options.end - options.start + 1;
				}

				res.send(fs.createReadStream(req.file.path, options), status, headers);
			}
		} else {
			res.send("", 200, headers);
		}
	}

	return void 0;
}

function statik (req, res) {
	const pathname = req.parsed.pathname.replace(regex.root, ""),
		invalid = (pathname.replace(regex.dir, "").split("/").filter(i => i !== ".")[0] || "") === "..",
		outDir = !invalid ? (pathname.match(/\.{2}\//g) || []).length : 0,
		inDir = !invalid ? (pathname.match(/\w+?(\.\w+|\/)+/g) || []).length : 0;

	if (invalid === true) {
		res.error(404);
	} else if (outDir > 0 && outDir >= inDir) {
		res.error(404);
	} else {
		file(req, res, err2 => {
			if (err2 !== void 0) {
				res.error(404);
			} else {
				if (res.hasHeader("cache-control") === true) {
					res.removeHeader("cache-control");
				}

				res.header("cache-control", `public, max-age=${(req.server.config.staticCache || 300)}`);
				stream(req, res, err3 => {
					if (err3 !== void 0) {
						res.error(404);
					}
				});
			}
		});
	}
}

function timer (req, res, next) {
	req.timer = precise().start();
	next();
}

function zuul (req, res, next) {
	const uri = req.parsed.path;
	let protectd = false;

	if (regex.options.test(req.method) === false) {
		retsu.each(req.server.config.auth.protect, i => {
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
