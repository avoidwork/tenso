"use strict";

const path = require("path"),
	http = require("http"),
	https = require("https"),
	fs = require("fs"),
	deferred = require("tiny-defer"),
	keysort = require("keysort"),
	retsu = require("retsu"),
	moment = require("moment"),
	zlib = require("zlib"),
	iterate = require(path.join(__dirname, "iterate.js")),
	middleware = require(path.join(__dirname, "middleware.js")),
	regex = require(path.join(__dirname, "regex.js")),
	utility = require(path.join(__dirname, "utility.js")),
	renderers = require(path.join(__dirname, "renderers")),
	serializers = require(path.join(__dirname, "serializers"));

class Tenso {
	constructor () {
		this.config = {
			address: "0.0.0.0",
			default: "localhost",
			cacheSize: 1000,
			catchAll: true,
			compress: true,
			etags: {
				notify: false,
				ignore: [],
				invalid: [],
				onchange: () => {}
			},
			headers: {
				"accept-ranges": "bytes",
				"content-type": "text/html; charset=utf-8"
			},
			hosts: {},
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
			maxBytes: 1048576,
			port: 8000,
			root: "",
			seed: 625,
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

	all (route, fn, host) {
		retsu.each(http.METHODS, i => this.router.use(route, fn, i, host));

		return this;
	}

	allows (...args) {
		return this.router.allows(...args);
	}

	allowed (...args) {
		return this.router.allowed(...args);
	}

	blacklist (...args) {
		return this.router.blacklist(...args);
	}

	canETag (pathname, method, header) {
		return regex.get_only.test(method) && (header !== void 0 ? this.etags.valid({"cache-control": header}) : true) && this.config.etags.invalid.filter(i => i.test(pathname)).length === 0;
	}

	clf (req, res, headers) {
		let user = "-";

		if (req.parsed.auth !== null && req.parsed.auth.indexOf(":") > -1) {
			user = req.parsed.auth.split(":")[0] || "-";
		}

		return this.config.logging.format.replace("%v", req.headers.host)
			.replace("%h", req.ip || "-")
			.replace("%l", "-")
			.replace("%u", user)
			.replace("%t", `[${(moment().format(this.config.logging.time))}]`)
			.replace("%r", `${req.method} HTTP/1.1`)
			.replace("%>s", res.statusCode)
			.replace("%b", headers["content-length"] || "-")
			.replace("%{Referer}i", req.headers.referer || "-")
			.replace("%{User-agent}i", req.headers["user-agent"] || "-");
	}

	compression (encoding = "", mimetype = "") {
		let result = "";

		if (this.config.compress === true && regex.compress.test(mimetype) === true) {
			retsu.each(utility.explode(encoding), i => {
				let output;

				if (regex.gzip.test(i) === true) {
					result = "gz";
					output = false;
				} else if (regex.def.test(i) === true) {
					result = "zz";
					output = false;
				}

				return output;
			});
		}

		return result;
	}

	del (route, fn, host) {
		this.router.use(route, fn, "DELETE", host);

		return this;
	}

	delete (route, fn, host) {
		this.router.use(route, fn, "DELETE", host);

		return this;
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

	get (route, fn, host) {
		this.router.use(route, fn, "GET", host);

		return this;
	}

	headers (req, res, status, body, result, pipe = false) {
		const isOptions = regex.options.test(req.method) === true;
		let size;

		if (regex.head.test(req.method) === true) {
			result.connection = "close";
		}

		if (isOptions === true && body === "") {
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

	hash (arg) {
		return this.router.hash(arg);
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

	options (route, fn, host) {
		this.router.use(route, fn, "OPTIONS", host);

		return this;
	}

	partial (req, res, size, headers) {
		if (regex.partial.test(req.headers.range) === true) {
			const options = {};

			retsu.each(req.headers.range.replace(regex.partial, "").split(",")[0].split("-"), (i, idx) => {
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

	patch (route, fn, host) {
		this.router.use(route, fn, "PATCH", host);

		return this;
	}

	post (route, fn, host) {
		this.router.use(route, fn, "POST", host);

		return this;
	}

	put (route, fn, host) {
		this.router.use(route, fn, "PUT", host);

		return this;
	}

	rate (req, fn) {
		const config = this.config.rate,
			id = req.sessionID || req.ip;
		let valid = true,
			seconds = parseInt(new Date().getTime() / 1000, 10),
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
		let format = "application/json",
			accepts = utility.explode(req.parsed.query.format || req.headers.accept || format, ","),
			decorated = res.getHeaders(),
			renderer;

		iterate(accepts, i => {
			let mimetype = i.replace(regex.mimetype, ""),
				found = false;

			if (renderers.has(mimetype) === true) {
				found = true;
				format = mimetype;
			}

			return found ? false : void 0;
		});

		renderer = renderers.get(format);
		headers["content-type"] = format;

		retsu.each(Reflect.ownKeys(decorated), i => {
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

	respond (req, res, arg, status = 200, headers = {}) {
		const defer = deferred();

		if (res.headersSent === false) {
			let output;

			if (req.protect === true && regex.private.test(headers["cache-control"]) === false) {
				headers["cache-control"] = (headers["cache-control"] || res.getHeader("cache-control") || "").replace(/(private|public)(,\s)?/g, "");
				headers["cache-control"] = `private${(headers["cache-control"].length > 0 ? ", " : "")}${(headers["cache-control"] || "")}`;
				res.removeHeader("cache-control");
			}

			if (regex.modify.test(req.method) === false && regex.modify.test(req.allow) === true && this.config.security.csrf === true && res.locals[this.config.security.key] !== void 0) {
				headers[this.config.security.key] = res.locals[this.config.security.key];
			}

			res.removeHeader("content-type");

			output = typeof arg.on !== "function" ? this.render(req, res, utility.hypermedia(this, req, this.serialize(req, arg, status), headers), headers) : arg;

			if (status === 200 && this.canETag(req.parsed.pathname, req.method, res.getHeader("cache-control") || headers["cache-control"])) {
				headers.etag = this.etag(output, req.parsed.href);
			} else {
				delete headers.etag;
			}

			this.send(req, res, output, status, headers).then(defer.resolve, defer.reject);
		} else {
			defer.resolve();
		}

		return defer.promise;
	}

	send (req, res, body = "", status = 200, headers = {"content-type": "text/plain"}) {
		const defer = deferred(),
			head = regex.head.test(req.method),
			pipe = head === false && typeof body.on === "function",
			rheaders = res.getHeaders();
		let indent = this.config.json,
			compression = "",
			header, lheaders, compressionMethod;

		const errHandler = e => {
			try {
				res.statusCode = 500;
				res.writeHead(500, lheaders || headers);
				res.end(http.STATUS_CODES[500]);
			} catch (err) {
				void 0;
			}

			this.log(e.stack, "warn");
			defer.reject(e);
		};

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

			lheaders = this.headers(req, res, status, body, headers, pipe);

			retsu.each(Reflect.ownKeys(lheaders), i => {
				if (rheaders[i] !== void 0) {
					if (lheaders[i] !== rheaders[i]) {
						res.removeHeader(i);
					} else {
						delete lheaders[i];
					}
				}
			});

			if (status !== 416 && req.headers.range !== void 0 && !res.hasHeader("content-range") && lheaders["content-range"] === void 0) {
				return this.error(req, res, new Error(416), headers).then(defer.resolve, defer.reject);
			}

			if (head === false && body !== null && body !== "") {
				compression = this.compression(req.headers["accept-encoding"], lheaders["content-type"] || rheaders["content-type"]);
			}

			if (compression !== "") {
				if (regex.gzip.test(compression)) {
					lheaders["content-encoding"] = "gzip";
					compressionMethod = "createGzip";
				} else {
					lheaders["content-encoding"] = "deflate";
					compressionMethod = "createDeflate";
				}

				if (pipe === true) {
					lheaders["transfer-encoding"] = "chunked";
					delete lheaders["content-length"];
					res.writeHead(status, lheaders);
					body.pipe(zlib[compressionMethod]()).on("error", errHandler).on("close", () => defer.resolve(true)).pipe(res);
				} else {
					zlib[compressionMethod.replace("create", "").toLowerCase()](body, (e, data) => {
						if (e !== null) {
							errHandler(e);
						} else {
							lheaders["content-length"] = data.length;

							if (req.headers.range !== void 0) {
								this.partial(req, res, data.length, lheaders);
							}

							try { // Might be an error from a failed compression stream
								res.writeHead(status, lheaders);
							} catch (err) {
								this.log(`Headers have already been sent for ${res.statusCode} response`, "error");
							}

							res.end(data);
							defer.resolve(true);
						}
					});
				}
			} else {
				if (head === true) {
					body = "";
				} else if (lheaders["content-range"] !== void 0) {
					status = res.statusCode = 206;
				}

				res.writeHead(status, lheaders);

				if (pipe === true) {
					body.on("error", errHandler).on("close", () => defer.resolve(true)).pipe(res);
				} else {
					if (req.range !== void 0) {
						res.end(Buffer.from(body.toString()).slice(req.range.start, req.range.end + 1).toString());
					} else {
						res.end(body.toString());
					}

					defer.resolve(true);
				}
			}
		}

		return defer.promise;
	}

	serialize (req, arg, status = 200, iot = false) {
		let format = "application/json",
			accepts = iot === false ? utility.explode(req.parsed.query.format || req.headers.accept || format, ",") : format,
			errz = arg instanceof Error,
			result, serializer;

		iterate(accepts, i => {
			let mimetype = i.replace(regex.mimetype, ""),
				found = false;

			if (serializers.has(mimetype) === true) {
				found = true;
				format = mimetype;
			}

			return found ? false : void 0;
		});

		serializer = serializers.get(format);

		if (errz === true) {
			result = serializer(null, arg, status < 400 ? 500 : status);
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

		if (typeof req.parsed.search === "string" && regex.has_order_by.test(req.parsed.search) === true && Array.isArray(arg)) {
			if (regex.unsortable.test(typeof arg[0]) === false && arg[0] !== null) {
				output = keysort(utility.clone(arg), req.parsed.search.replace("?", "").split("&").filter(i => regex.order_by.test(i)).reduce((a, b) => {
					a.push(b.replace(regex.order_by, ""));

					return a;
				}, []).join(", ").replace(/\%20|\+/g, " "));
			} else {
				// Primitives, regular Array.sort()
				output = utility.clone(arg).sort(retsu.sort);

				if (regex.has_order_by_desc.test(req.parsed.search) === true) {
					output = output.reverse();
				}
			}
		} else {
			output = arg;
		}

		return output;
	}

	start () {
		const drop = () => {
			if (isNaN(this.config.uid) === false && this.config.uid > 0 && typeof process.setuid === "function") {
				try {
					process.setuid(this.config.uid);
					this.log(`Dropped process to run as uid ${this.config.uid}`, "debug");
				} catch (e) {
					this.log(e.stack, "warn");
				}
			}
		};

		this.config.etags.invalid = this.config.etags.ignore.map(i => new RegExp(i, "i"));

		if (this.server === null) {
			if (this.config.ssl.cert === null && this.config.ssl.pfx === null && this.config.ssl.key === null) {
				this.server = http.createServer(this.router.route).listen(this.config.port, this.config.address, drop);
			} else {
				this.server = https.createServer({
					cert: this.config.ssl.cert ? fs.readFileSync(this.config.ssl.cert) : void 0,
					pfx: this.config.ssl.pfx ? fs.readFileSync(this.config.ssl.pfx) : void 0,
					key: this.config.ssl.key ? fs.readFileSync(this.config.ssl.key) : void 0,
					port: this.config.port,
					host: this.config.address
				}, this.router.route).listen(this.config.port, this.config.address, drop);
			}

			this.log(`Started server on port ${this.config.address}:${this.config.port}`, "debug");
		}

		return this;
	}

	"static" (...args) {
		return middleware.static(...args);
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
		return this.router.use(...args);
	}
}

module.exports = config => new Tenso(config);
