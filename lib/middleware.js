"use strict";

const path = require("path"),
	fs = require("fs"),
	{STATUS_CODES} = require("http"),
	retsu = require("retsu"),
	coerce = require("tiny-coerce"),
	mime = require("mimetype"),
	{each} = require(path.join(__dirname, "shared.js")),
	regex = require(path.join(__dirname, "regex.js")),
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
	req.unprotect = req.server.config.auth.unprotect.filter(i => i.test(req.url) === true).length > 0;
	next();
}

function file (req, res, next) {
	if (req.headers.expect !== void 0) {
		res.error(417);
	} else {
		const lpath = path.join(req.server.config.root, "www", req.parsed.pathname.replace(regex.dir, ""));

		fs.lstat(lpath, (e, stats) => {
			if (e !== null) {
				res.error(404);
			} else if (stats.isDirectory() === false) {
				req.file = {path: lpath, stats: stats};
				req.server.log("Routed request to disk", "debug");
				next();
			} else if (regex.get.test(req.method) === true && regex.dir.test(req.parsed.pathname) === false) {
				res.redirect((req.parsed.pathname !== "/" ? req.parsed.pathname : "") + "/" + req.parsed.search);
			} else {
				const nth = req.server.config.index.length;
				let count = 0,
					handled = false;

				if (nth > 0) {
					each(req.server.config.index, i => {
						const npath = path.join(lpath, i);

						fs.lstat(npath, (err, lstats) => {
							if (err === null && handled === false) {
								handled = true;
								req.file = {path: npath, stats: lstats};
								req.server.log("Routed request to disk", "debug");
								next();
							} else if (++count === nth && handled === false) {
								res.error(404);
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
	const login = req.server.config.auth.uri.login;

	if (req.parsed.url === login || req.isAuthenticated() === true) {
		next();
	} else {
		res.redirect(login, false);
	}
}

function parse (req, res, next) {
	let valid = true,
		exception;

	if (req.body !== "") {
		const type = req.headers["content-type"];

		if (regex.encodeForm.test(type) === true) {
			const args = req.body ? retsu.chunk(req.body.split(regex.bodySplit), 2) : [];

			req.body = {};
			each(args, i => {
				req.body[i[0]] = coerce(decodeURIComponent(i[1]));
			});
		} else if (regex.encodeJson.test(type) === true || regex.jsonWrap.test(req.body) === true) {
			try {
				req.body = JSON.parse(req.body);
			} catch (e) {
				exception = e;
				valid = false;
			}
		}
	}

	next(valid === false ? exception : void 0);
}

function payload (req, res, next) {
	let invalid = false;

	if (regex.body.test(req.method) === true) {
		const obj = req.httpVersionMajor === 1 ? req : res,
			max = req.server.config.maxBytes;
		let body = "";

		obj.setEncoding("utf8");

		obj.on("data", data => {
			body += data;

			if (max > 0 && Buffer.byteLength(body) > max) {
				invalid = true;
				res.error(413);
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
	// No authentication, or it's already happened
	if (req.protect === false || req.protectAsync === false || (req.session !== void 0 && req.isAuthenticated() === true) === true) {
		const method = regex.head.test(req.method) ? "GET" : req.method,
			routes = req.server.router.middleware.get(method) || new Map(),
			uri = req.parsed.pathname;
		let result;

		if (routes.has(uri)) {
			result = routes.get(uri)[0];

			if (typeof result === "function") {
				result(req, res);
			} else {
				res.send(result);
			}
		} else {
			retsu.each(Array.from(routes.keys()), i => {
				const key = regex.hasParam.test(i) === true && regex.leftBrace.test(i) === false ? i.replace(/\/:(\w*)/g, "/(.*)") : i;

				if (new RegExp(`^${key}$`, "i").test(uri) === true) {
					return !(result = routes.get(i)[0]);
				}

				return void 0;
			});

			if (result !== void 0) {
				if (typeof result === "function") {
					result.call(req.server.tenso, req, res);
				} else {
					res.send(result);
				}
			} else if (regex.options.test(method) && req.server.allowed("GET", req.parsed.pathname) === true) {
				res.send(STATUS_CODES[204], 204);
			} else {
				res.error(404);
			}
		}
	} else {
		res.error(401);
	}
}

function rate (req, res, next) {
	if (req.server.config.rate.enabled === false || req.unprotect === true) {
		next();
	} else {
		const results = req.server.rate(req, req.server.config.rate.override),
			good = results.shift();

		each(rateHeaders, (i, idx) => res.header(i, results[idx]));

		if (good === true) {
			next();
		} else {
			res.error(req.server.config.rate.status || 429);
		}
	}
}

function stream (req, res) {
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

	if (regex.getOnly.test(req.method) === true) {
		if (letag !== void 0 && req.headers["if-none-match"] === letag) {
			delete headers["content-length"];
			res.send("", 304, headers);
		} else if (req.headers["if-none-match"] === void 0 && Date.parse(req.headers["if-modified-since"]) >= req.file.stats.mtime) {
			delete headers["content-length"];
			res.send("", 304, headers);
		} else if (req.server.router.http2 === false) {
			options = {};

			// Setting the partial content headers
			if (req.headers.range !== void 0) {
				each(req.headers.range.replace(/^.*=/, "").split(",")[0].split("-"), (i, idx) => {
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
					res.error(416);
				}

				status = 206;
				headers["content-range"] = `bytes ${options.start}-${options.end}/${req.file.stats.size}`;
				headers["content-length"] = options.end - options.start + 1;
			}

			res.send(fs.createReadStream(req.file.path, options), status, headers);
		} else if (req.headers.range !== void 0) {
			res.error(416); // Partial responses are not supported at this time for HTTP2
		} else {
			req.server.router.http2Send(req, res, req.file.path, status, headers);
		}
	} else {
		res.send("", 200, headers);
	}

	return void 0;
}

function statik (req, res) {
	const pathname = path.resolve(path.join(req.server.config.root, req.parsed.pathname.replace(regex.root, ""))),
		invalid = pathname.indexOf(req.server.config.root) === -1;

	if (invalid === true) {
		res.error(404);
	} else {
		file(req, res, err2 => {
			if (err2 !== void 0) {
				res.error(404);
			} else {
				req.session = void 0;
				stream(req, res, err3 => {
					if (err3 !== void 0) {
						res.error(404);
					}
				});
			}
		});
	}
}

function zuul (req, res, next) {
	const uri = req.parsed.pathname;
	let protectd = false;

	if (req.unprotect === false) {
		retsu.each(req.server.config.auth.protect, i => {
			if (i.test(uri) === true) {
				return !(protectd = true);
			}

			return void 0;
		});
	}

	// Setting state so the connection can be terminated properly
	req.protect = protectd;
	req.protectAsync = false;

	rate(req, res, e => {
		if (e !== void 0) {
			res.error(e);
		} else if (protectd === true) {
			next();
		} else {
			keymaster(req, res, next);
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
	"static": statik,
	zuul
};
