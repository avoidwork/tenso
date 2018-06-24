"use strict";

const path = require("path"),
	http = require("http"),
	https = require("https"),
	http2 = require("http2"),
	fs = require("fs"),
	keysort = require("keysort"),
	{each, sort} = require("retsu"),
	moment = require("moment"),
	zlib = require("zlib"),
	middleware = require(path.join(__dirname, "middleware.js")),
	regex = require(path.join(__dirname, "regex.js")),
	utility = require(path.join(__dirname, "utility.js")),
	renderers = require(path.join(__dirname, "renderers")),
	serializers = require(path.join(__dirname, "serializers")),
	Base = require(path.join(__dirname, "base.js"));

class Tenso extends Base {
	constructor () {
		super();
		this.config = {
			address: "0.0.0.0",
			default: "localhost",
			cacheSize: 1000,
			cacheTTL: 0,
			catchAll: true,
			coerce: true,
			compress: true,
			etags: {
				notify: false,
				ignore: [],
				invalid: [],
				onchange: () => void 0
			},
			headers: {
				"accept-ranges": "bytes",
				"content-type": "text/html; charset=utf-8"
			},
			httpVersion: "1.1",
			json: 0,
			logging: {
				enabled: true,
				stack: true,
				format: "%v %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-agent}i\"",
				level: "info",
				levels: {
					"emerg": 0,
					"alert": 1,
					"crit": 2,
					"error": 3,
					"warn": 4,
					"notice": 5,
					"info": 6,
					"debug": 7
				},
				time: "D/MMM/YYYY:HH:mm:ss ZZ"
			},
			maxBytes: 20480,
			port: 8000,
			root: "",
			ssl: {
				cert: null,
				key: null,
				pfx: null
			},
			uid: 0
		};
		this.coap = null;
		this.etags = null;
		this.hostname = "";
		this.rates = {};
		this.router = null;
		this.server = null;
		this.websocket = null;
		this.version = "";
	}

	all (route, fn) {
		this.router.always(route, fn);

		return this;
	}

	allows (...args) {
		return this.router.allows(...args);
	}

	allowed (...args) {
		return this.router.allowed(...args);
	}

	always (route, fn) {
		this.router.always(route, fn);

		return this;
	}

	blacklist (fn) {
		this.router.blacklist(fn);

		return this;
	}

	canETag (pathname, method, header) {
		return regex.getOnly.test(method) && (header !== void 0 ? this.etags.valid({"cache-control": header}) : true) && this.config.etags.invalid.filter(i => i.test(pathname)).length === 0;
	}

	clf (req, res, headers) {
		const user = req.parsed.auth !== null && req.parsed.auth.indexOf(":") > -1 ? req.parsed.auth.split(":")[0] || "-" : "-";

		return this.config.logging.format.replace("%v", req.headers.host)
			.replace("%h", req.ip || "-")
			.replace("%l", "-")
			.replace("%u", user)
			.replace("%t", `[${(moment().format(this.config.logging.time))}]`)
			.replace("%r", `${req.method} ${req.parsed.href} HTTP/${this.config.httpVersion}`)
			.replace("%>s", res.statusCode)
			.replace("%b", headers["content-length"] || "-")
			.replace("%{Referer}i", req.headers.referer || "-")
			.replace("%{User-agent}i", req.headers["user-agent"] || "-");
	}

	connect (req) {
		req.protect = false;
		req.protectAsync = false;
		req.unprotect = false;
		req.server = this;
	}

	compression (encoding = "", mimetype = "") {
		let result = "";

		if (this.config.compress === true && regex.compress.test(mimetype) === true) {
			each(utility.explode(encoding), i => {
				if (result === "") {
					if (regex.gzip.test(i) === true) {
						result = "gz";
					} else if (regex.def.test(i) === true) {
						result = "zz";
					}
				}
			});
		}

		return result;
	}

	drop () {
		if (isNaN(this.config.uid) === false && this.config.uid > 0 && typeof process.setuid === "function") {
			try {
				process.setuid(this.config.uid);
				this.log(`Dropped process to run as uid ${this.config.uid}`, "debug");
			} catch (e) {
				this.log(e.stack, "warn");
			}
		}
	}

	error (req, res, err, headers = {}) {
		const preset = res.statusCode >= 400,
			numeric = isNaN(err.message) === false,
			status = preset ? res.statusCode : numeric ? Number(err.message) : 500;

		return res.send(preset ? err : new Error(http.STATUS_CODES[status]), status, headers);
	}

	etag (...args) {
		return this.etags.create(args.join("-"));
	}

	finish (req, res) {
		return this.log(this.clf(req, res, res.getHeaders()), "info");
	}

	headers (req, res, status, body, result, pipe = false) {
		const isOptions = regex.options.test(req.method) === true;
		let size;

		if (regex.head.test(req.method) === true) {
			result.connection = "close";
		}

		// eslint-disable-next-line no-extra-parens
		if (body === null || (isOptions === true && body === "")) {
			size = result["content-length"] = 0;
		} else {
			if (isOptions === true && body !== "") {
				result["content-length"] = Buffer.byteLength(body.toString());
			} else if (pipe === false && result["content-length"] === void 0) {
				result["content-length"] = Buffer.byteLength(body.toString());
			} else if (pipe === true) {
				delete result["content-length"];
				result["transfer-encoding"] = "chunked";
			}

			size = result["content-length"] || 0;
		}

		if (pipe === false && req.headers.range !== void 0 && result["content-range"] === void 0) {
			this.partial(req, res, size, result);
		}

		if (regex.get.test(req.method) === false || status >= 400) {
			delete result.etag;
			delete result["last-modified"];
		}

		if (status === 304) {
			delete result["content-length"];
			delete result["last-modified"];
		}

		if (status === 404) {
			delete result.allow;
			delete result["access-control-allow-methods"];
		}

		if (result["last-modified"] === "") {
			delete result["last-modified"];
		}

		if (req.timer !== void 0) {
			result["x-response-time"] = ((req.timer.stopped.length === 0 ? req.timer.stop() : req.timer).diff() / 1000000).toFixed(2) + " ms";
		}

		this.log("Generated headers", "debug");

		return result;
	}

	log (msg, level = "debug") {
		if (this.config.logging.enabled === true) {
			const idx = this.config.logging.levels[level];

			if (idx <= this.config.logging.levels[this.config.logging.level]) {
				process.nextTick(() => console[idx > 4 ? "log" : "error"](msg));
			}
		}

		return this;
	}

	partial (req, res, size, headers) {
		if (regex.partial.test(req.headers.range) === true) {
			const options = {};

			each(req.headers.range.replace(regex.partial, "").split(",")[0].split("-"), (i, idx) => {
				options[idx === 0 ? "start" : "end"] = i ? parseInt(i, 10) : void 0;
			});

			// Byte offsets
			if (isNaN(options.start) === true && isNaN(options.end) === false) {
				options.start = size - options.end;
				options.end = size;
			} else if (isNaN(options.end) === true) {
				options.end = size;
			}

			if ((options.start >= options.end || isNaN(options.start) || isNaN(options.end)) === false) {
				req.range = options;
				headers["content-range"] = `bytes ${options.start}-${options.end}/${size}`;
				headers["content-length"] = options.end - options.start + 1;
				res.statusCode = 206;
				res.removeHeader("etag"); // Removing etag since this rep is incomplete
				delete headers.etag;
			}
		}
	}

	rate (req, fn) {
		const config = this.config.rate,
			id = req.sessionID || req.ip;
		let valid = true,
			seconds = Math.floor(new Date().getTime() / 1000),
			limit, remaining, reset, state;

		if (this.rates[id] === void 0) {
			this.rates[id] = {
				limit: config.limit,
				remaining: config.limit,
				reset: seconds + config.reset,
				time_reset: config.reset
			};
		}

		if (typeof fn === "function") {
			this.rates[id] = fn(req, this.rates[id]);
		}

		state = this.rates[id];
		limit = state.limit;
		remaining = state.remaining;
		reset = state.reset;

		if (seconds >= reset) {
			reset = state.reset = seconds + config.reset;
			remaining = state.remaining = limit - 1;
		} else if (remaining > 0) {
			state.remaining--;
			remaining = state.remaining;
		} else {
			valid = false;
		}

		return [valid, limit, remaining, reset];
	}

	redirect (req, res, uri, perm = false) {
		return this.send(req, res, "", perm === false ? 302 : 301, {location: uri});
	}

	render (req, res, arg, headers) {
		if (arg === null) {
			arg = "null";
		}

		let format = "application/json",
			accepts = utility.explode(req.parsed.query.format || req.headers.accept || format, ","),
			decorated = res.getHeaders(),
			renderer;

		each(accepts, i => {
			const mimetype = i.replace(regex.mimetype, "");
			let output;

			if (renderers.has(mimetype) === true) {
				output = false;
				format = mimetype;
			}

			return output;
		});

		renderer = renderers.get(format);
		headers["content-type"] = format;

		each(Object.keys(decorated), i => {
			if (headers[i] === void 0) {
				headers[i] = decorated[i];
			}
		});

		return renderer(arg, req, headers, format === "text/html" ? this.config.template : void 0);
	}

	renderer (mimetype, fn) {
		renderers.set(mimetype, fn);

		return this;
	}

	respond (req, res, arg = "", status = 200, headers = {}) {
		return this.send(req, res, arg, status, headers);
	}

	send (req, res, body = "", status = 200, headers = {"content-type": "text/plain"}) {
		if (req.protect === true && regex.private.test(headers["cache-control"]) === false) {
			headers["cache-control"] = (headers["cache-control"] || res.getHeader("cache-control") || "").replace(/(private|public)(,\s)?/g, "");
			headers["cache-control"] = `private${(headers["cache-control"].length > 0 ? ", " : "")}${(headers["cache-control"] || "")}`;
			res.removeHeader("cache-control");
		}

		if (regex.modify.test(req.method) === false && regex.modify.test(req.allow) === true && this.config.security.csrf === true && res.locals[this.config.security.key] !== void 0) {
			headers[this.config.security.key] = res.locals[this.config.security.key];
		}

		if (status === 200 && this.canETag(req.parsed.pathname, req.method, res.getHeader("cache-control") || headers["cache-control"])) {
			headers.etag = this.etag(body, req.parsed.href);
		} else {
			delete headers.etag;
		}

		const head = regex.head.test(req.method),
			pipe = head === false && body !== null && typeof body.on === "function",
			rheaders = res.getHeaders();
		let indent = this.config.json,
			header;

		if (res.headersSent === false) {
			res.statusCode = status;

			if (pipe === false && body instanceof Object || Array.isArray(body)) {
				if (req.headers.accept !== void 0) {
					header = regex.indent.exec(req.headers.accept);
					indent = header !== null ? parseInt(header[1], 10) : this.config.json;
				}

				body = JSON.stringify(body, null, indent);
				headers["content-length"] = Buffer.byteLength(body);
				headers["content-type"] = "application/json";
			}

			this.headers(req, res, status, body, headers, pipe);
			each(Object.keys(headers), i => {
				if (rheaders[i] !== void 0) {
					if (headers[i] !== rheaders[i]) {
						res.removeHeader(i);
					} else {
						delete headers[i];
					}
				}
			});

			if (status >= 300 && status < 400) {
				res.removeHeader("accept-ranges");
				res.removeHeader("cache-control");
				res.removeHeader("content-type");
				res.removeHeader("content-length");
				delete headers["accept-ranges"];
				delete headers["cache-control"];
				delete headers["content-type"];
				delete headers["content-length"];
			}

			if (status !== 416 && req.headers.range !== void 0 && !res.hasHeader("content-range") && headers["content-range"] === void 0) {
				this.error(req, res, new Error(416), headers);
			} else {
				if (head === true) {
					body = "";
				} else if (headers["content-range"] !== void 0) {
					status = res.statusCode = 206;
				}
			}
		}
	}

	serialize (req, arg, status = 200, iot = false) {
		let format = "application/json",
			accepts = iot === false ? utility.explode(req.parsed.query.format || req.headers.accept || format, ",") : format,
			errz = arg instanceof Error,
			result, serializer;

		each(accepts, i => {
			let mimetype = i.replace(regex.mimetype, ""),
				output;

			if (serializers.has(mimetype) === true) {
				output = false;
				format = mimetype;
			}

			return output;
		});

		serializer = serializers.get(format);

		if (errz === true) {
			result = serializer(null, arg, status < 400 ? 500 : status, req.server.config.logging.stack);
		} else {
			result = serializer(this.sort(arg, req), null, status);
		}

		return result;
	}

	serializer (mimetype, fn) {
		serializers.set(mimetype, fn);

		return this;
	}

	sort (arg, req) {
		let output;

		if (typeof req.parsed.search === "string" && regex.hasOrderBy.test(req.parsed.search) === true && Array.isArray(arg)) {
			if (regex.unsortable.test(typeof arg[0]) === false && arg[0] !== null) {
				output = keysort(utility.clone(arg), req.parsed.search.replace("?", "").split("&").filter(i => regex.orderBy.test(i)).reduce((a, b) => [...a, b.replace(regex.orderBy, "")], []).join(", ").replace(/\%20|\+/g, " "));
			} else {
				// Primitives, regular Array.sort()
				output = utility.clone(arg).sort(sort);

				if (regex.hasOrderByDesc.test(req.parsed.search) === true) {
					output = output.reverse();
				}
			}
		} else {
			output = arg;
		}

		return output;
	}

	start () {
		this.config.etags.invalid = this.config.etags.ignore.map(i => new RegExp(i, "i"));

		if (this.server === null) {
			if (this.config.ssl.cert === null && this.config.ssl.pfx === null && this.config.ssl.key === null) {
				this.server = http.createServer(this.router.route).listen(this.config.port, this.config.address, () => this.drop());
			} else if (this.config.http2 === false) {
				this.server = https.createServer({
					cert: this.config.ssl.cert ? fs.readFileSync(this.config.ssl.cert) : void 0,
					pfx: this.config.ssl.pfx ? fs.readFileSync(this.config.ssl.pfx) : void 0,
					key: this.config.ssl.key ? fs.readFileSync(this.config.ssl.key) : void 0,
					port: this.config.port,
					host: this.config.address
				}, this.router.route).listen(this.config.port, this.config.address, () => this.drop());
			} else {
				this.config.httpVersion = "2.0";
				this.server = http2.createSecureServer({
					cert: this.config.ssl.cert ? fs.readFileSync(this.config.ssl.cert) : void 0,
					pfx: this.config.ssl.pfx ? fs.readFileSync(this.config.ssl.pfx) : void 0,
					key: this.config.ssl.key ? fs.readFileSync(this.config.ssl.key) : void 0
				}).on("stream", this.router.route).listen(this.config.port, this.config.address, () => this.drop());
			}

			this.log(`Started server on port ${this.config.address}:${this.config.port}`, "debug");
		}

		return this;
	}

	"static" (...args) {
		middleware.static(...args);

		return this;
	}

	stop () {
		this.config.ignore.length = 0;

		if (this.server !== null) {
			this.server.close();
			this.server = null;
		}

		this.log(`Stopped server on port ${this.config.address}:${this.config.port}`, "debug");

		return this;
	}

	use (...args) {
		this.router.use(...args);

		return this;
	}
}

module.exports = config => new Tenso(config);
