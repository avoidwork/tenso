"use strict";

const path = require("path"),
	http = require("http"),
	turtleio = require("turtle.io"),
	deferred = require("tiny-defer"),
	merge = require("tiny-merge"),
	keysort = require("keysort"),
	retsu = require("retsu"),
	iterate = require(path.join(__dirname, "iterate.js")),
	regex = require(path.join(__dirname, "regex.js")),
	utility = require(path.join(__dirname, "utility.js")),
	renderers = require(path.join(__dirname, "renderers")),
	serializers = require(path.join(__dirname, "serializers")),
	verbs = ["DELETE", "GET", "POST", "PUT", "PATCH"];

class Tenso {
	constructor (config = {headers: {}}) {
		config.headers.server = "tenso/" + config.version;

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
		this.websocket = null;
		this.version = "";
	}

	all (route, fn, host) {
		each(verbs, i => this.router.use(route, fn, i, host));

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

	canETag (pathname, method, headers = this.config.headers) {
		return regex.get_only.test(method) && this.etags.valid(headers) && !this.config.etags.invalid.filter(i => i.test(pathname)).length;
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
			.replace("%t", "[" + moment().format(this.config.logging.time) + "]")
			.replace("%r", req.method + " " + req.url + " HTTP/1.1")
			.replace("%>s", res.statusCode)
			.replace("%b", headers["content-length"] || "-")
			.replace("%{Referer}i", req.headers.referer || "-")
			.replace("%{User-agent}i", req.headers["user-agent"] || "-");
	}

	compression (encoding = "", mimetype = "") {
		let result = "";

		if (this.config.compress === true && regex.compress.test(mimetype)) {
			retsu.each(utility.explode(encoding), i => {
				let output;

				if (regex.gzip.test(i)) {
					result = "gz";
					output = false;
				} else if (regex.def.test(i)) {
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

	error (req, res, err) {
		const preset = res.statusCode >= 400,
			numeric = !isNaN(err.message),
			status = preset ? res.statusCode : numeric ? Number(err.message) : 500;

		return this.respond(req, res, preset ? err : new Error(http.STATUS_CODES[status]), status);
	}

	etag (...args) {
		return this.etags.create(args.join("-"));
	}

	headers (req, res, status, body, headers, pipe) {
		const result = utility.merge(utility.clone(this.config.headers), headers),
			options = {},
			isOptions = regex.options.test(req.method);
		let size;

		if (req.allow !== "" && result.allow === void 0) {
			result.allow = req.allow;
		}

		if (regex.head.test(req.method)) {
			result.connection = "close";
		}

		if (isOptions && body === "") {
			size = result["content-length"] = 0;
		} else {
			if (isOptions && body !== "") {
				result["content-length"] = Buffer.byteLength(body.toString());
			} else if (!pipe && result["content-length"] === void 0) {
				result["content-length"] = Buffer.byteLength(body.toString());
			} else if (pipe) {
				delete result["content-length"];
				result["transfer-encoding"] = "chunked";
			}

			size = result["content-length"] || 0;
		}

		if (!pipe && req.headers.range && headers["content-range"] === void 0) {
			retsu.each(req.headers.range.split(",")[0].split("-"), (i, idx) => {
				options[idx === 0 ? "start" : "end"] = i ? parseInt(i, 10) : void 0;
			});

			// Byte offsets
			if (isNaN(options.start) && !isNaN(options.end)) {
				options.start = size - options.end;
				options.end = size;
			} else if (isNaN(options.end)) {
				options.end = size;
			}

			if (options.start >= options.end || isNaN(options.start) || isNaN(options.start)) {
				result["content-range"] = "";
			} else {
				req.range = options;
				result["content-range"] = "bytes " + options.start + "-" + options.end + "/" + size;
				result["content-length"] = options.end - options.start + 1;
			}
		}

		if (!regex.get.test(req.method) || status >= 400) {
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
		if (this.config.logging.enabled) {
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
		return this.send(req, res, "", !perm ? 302 : 301, {location: uri});
	}

	render (req, arg, headers) {
		let format = "application/json",
			accepts = utility.explode(req.parsed.query.format || req.headers.accept || format, ","),
			renderer;

		iterate(accepts, i => {
			let mimetype = i.replace(regex.mimetype, ""),
				found = false;

			if (renderers.has(mimetype)) {
				found = true;
				format = mimetype;
			}

			return found ? false : void 0;
		});

		renderer = renderers.get(format);
		headers["content-type"] = format;

		return renderer(arg, req, headers, format === "text/html" ? this.config.template : void 0);
	}

	renderer (mimetype, fn) {
		renderers.set(mimetype, fn);

		return this;
	}

	respond (req, res, arg, status = 200, headers = {}) {
		const defer = deferred();

		if (res._header === null) {
			let ref = [headers || {}],
				output;

			if (res._headers !== null) {
				merge(ref[0], res._headers);
			}

			// Decorating early for renderers
			if (ref[0].allow === void 0) {
				ref[0].allow = req.allow;
			}

			if (!regex.get_rewrite.test(req.method)) {
				if (ref[0]["cache-control"] === void 0 && this.config.headers["cache-control"]) {
					ref[0]["cache-control"] = utility.clone(this.config.headers["cache-control"]) || "public";
				}

				if (req.protect && !regex.private.test(ref[0]["cache-control"])) {
					ref[0]["cache-control"] = ref[0]["cache-control"].replace(/(private|public)(,\s)?/g, "");
					ref[0]["cache-control"] = "private" + (ref[0]["cache-control"].length > 0 ? ", " : "") + (ref[0]["cache-control"] || "");
				}

				if (!regex.modify.test(req.method) && regex.modify.test(req.allow) && this.config.security.csrf && res.locals[this.config.security.key] !== void 0) {
					ref[0][this.config.security.key] = res.locals[this.config.security.key];
				}

				output = this.render(req, utility.hypermedia(this.server, req, this.serialize(req, arg, status), ref[0]), ref[0]);

				if (this.server.canETag(req.parsed.pathname, req.method, ref[0])) {
					ref[0].etag = this.server.etag(output, req.parsed.href);
				}
			} else {
				output = "";
			}

			this.send(req, res, output, status, ref[0]).then(defer.resolve, defer.reject);
		} else {
			defer.resolve();
		}

		return defer.promise;
	}

	send (req, res, body = "", status = 200, headers = {"content-type": "text/plain"}) {
		const deferred = defer(),
			pipe = typeof body.on === "function";
		let indent = this.config.json,
			header, lheaders, compression, compressionMethod;

		const errHandler = e => {
			try {
				res.statusCode = 500;
				res.writeHead(500, lheaders || headers);
				res.end(http.STATUS_CODES[500]);
			} catch (err) {
				void 0;
			}

			this.log(e.stack, "warn");
			deferred.reject(e);
		};

		if (!res.headersSent) {
			res.statusCode = status;

			if (!pipe && body instanceof Object || body instanceof Array) {
				if (req.headers.accept !== void 0) {
					header = regex.indent.exec(req.headers.accept);
					indent = header !== null ? parseInt(header[1], 10) : this.config.json;
				}

				body = JSON.stringify(body, null, indent);
				headers["content-length"] = Buffer.byteLength(body);
				headers["content-type"] = "application/json";
			}

			lheaders = this.headers(req, res, status, body, headers, pipe);

			if (status !== 416 && req.headers.range && lheaders["content-range"] === void 0) {
				return this.error(req, res, 416, http.STATUS_CODES[416]);
			}

			if (body !== null && body !== "") {
				compression = this.compression(req.headers["accept-encoding"], lheaders["content-type"]);
			}

			if (compression) {
				if (regex.gzip.test(compression)) {
					lheaders["content-encoding"] = "gzip";
					compressionMethod = "createGzip";
				} else {
					lheaders["content-encoding"] = "deflate";
					compressionMethod = "createDeflate";
				}

				if (pipe) {
					lheaders["transfer-encoding"] = "chunked";
					delete lheaders["content-length"];
					res.writeHead(status, lheaders);
					body.pipe(zlib[compressionMethod]()).on("error", errHandler).on("close", () => deferred.resolve(true)).pipe(res);
				} else {
					zlib[compressionMethod.replace("create", "").toLowerCase()](body, (e, data) => {
						if (e !== null) {
							errHandler(e);
						} else {
							lheaders["content-length"] = data.length;

							try { // Might be an error from a failed compression stream
								res.writeHead(status, lheaders);
							} catch (err) {
								this.log("Headers have already been sent for " + res.statusCode + " response", "error");
							}

							res.end(data);
							deferred.resolve(true);
						}
					});
				}
			} else {
				if (lheaders["content-range"] !== void 0 && lheaders["content-range"] !== "") {
					status = res.statusCode = 206;
				}

				res.writeHead(status, lheaders);

				if (pipe) {
					body.on("error", errHandler).on("close", () => deferred.resolve(true)).pipe(res);
				} else {
					if (req.range !== void 0) {
						res.end(new Buffer(body.toString()).slice(req.range.start, req.range.end + 1).toString());
					} else {
						res.end(body.toString());
					}

					deferred.resolve(true);
				}
			}
		}

		return deferred.promise;
	}

	serialize (req, arg, status = 200, iot = false) {
		let format = "application/json",
			accepts = !iot ? utility.explode(req.parsed.query.format || req.headers.accept || format, ",") : format,
			errz = arg instanceof Error,
			result, serializer;

		iterate(accepts, i => {
			let mimetype = i.replace(regex.mimetype, ""),
				found = false;

			if (serializers.has(mimetype)) {
				found = true;
				format = mimetype;
			}

			return found ? false : void 0;
		});

		serializer = serializers.get(format);

		if (errz) {
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

		if (typeof req.parsed.search === "string" && regex.has_order_by.test(req.parsed.search) && Array.isArray(arg)) {
			if (!regex.unsortable.test(typeof arg[0]) && arg[0] !== null) {
				output = keysort(utility.clone(arg), req.parsed.search.replace("?", "").split("&").filter(i => regex.order_by.test(i)).reduce((a, b) => {
					a.push(b.replace(regex.order_by, ""));

					return a;
				}, []).join(", ").replace(/\%20|\+/g, " "));
			} else {
				// Primitives, regular Array.sort()
				output = utility.clone(arg).sort(retsu.sort);

				if (regex.has_order_by_desc.test(req.parsed.search)) {
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
			if (this.config.uid && !isNaN(this.config.uid) && typeof process.setuid === "function") {
				try {
					process.setuid(this.config.uid);
					this.log("Dropped process to run as uid " + this.config.uid, "debug");
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

			this.log("Started server on port " + this.config.address + ":" + this.config.port, "debug");
		}

		return this;
	}

	stop () {
		this.config.ignore.length = 0;

		if (this.server !== null) {
			this.server.close();
			this.server = null;
		}

		this.log("Stopped server on port " + this.config.address + ":" + this.config.port, "debug");

		return this;
	}

	use (...args) {
		return this.router.use(...args);
	}
}

module.exports = config => new Tenso(config);
