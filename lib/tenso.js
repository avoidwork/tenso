"use strict";

const path = require("path"),
	http = require("http"),
	https = require("https"),
	http2 = require("http2"),
	fs = require("fs"),
	precise = require("precise"),
	moment = require("moment"),
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
			auth: {
				protect: [],
				unprotect: [],
				redirect: "/",
				basic: {
					enabled: false,
					list: []
				},
				bearer: {
					enabled: false,
					tokens: []
				},
				jwt: {
					enabled: false,
					auth: null,
					audience: "",
					algorithms: [
						"HS256",
						"HS384",
						"HS512"
					],
					ignoreExpiration: false,
					issuer: "",
					scheme: "Bearer",
					secretOrKey: ""
				},
				local: {
					enabled: false,
					auth: null
				},
				oauth2: {
					enabled: false,
					auth: null,
					auth_url: "",
					token_url: "",
					client_id: "",
					client_secret: ""
				},
				uris: {
					login: "/auth/login",
					root: "/auth"
				},
				saml: {
					enabled: false,
					auth: null
				}
			},
			cacheSize: 1e3,
			cacheTTL: 3e5,
			catchAll: true,
			coap: {
				enabled: false,
				options: {
					type: "udp4",
					port: 5683
				}
			},
			coerce: true,
			compress: true,
			etags: {
				enabled: true,
				notify: false,
				ignore: [],
				invalid: [],
				onchange: () => void 0
			},
			headers: {
				"content-type": "text/html; charset=utf-8"
			},
			hostname: "localhost",
			http2: false,
			httpVersion: "1.1",
			json: 0,
			logging: {
				enabled: true,
				stack: false,
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
			maxBytes: 0,
			port: 8000,
			rate: {
				enabled: false,
				limit: 450,
				message: "Too many requests",
				override: null,
				reset: 900,
				status: 429
			},
			root: "",
			renderHeaders: true,
			routes: {},
			security: {
				key: "x-csrf-token",
				secret: "tenso",
				csrf: true,
				csp: null,
				xframe: "SAMEORIGIN",
				p3p: "",
				hsts: null,
				xssProtection: true,
				nosniff: true
			},
			session: {
				cookie: {
					httpOnly: true,
					maxAge: 900000,
					path: "/",
					sameSite: true,
					secure: false
				},
				name: "tenso.sid",
				proxy: true,
				redis: {
					host: "127.0.0.1",
					port: 6379
				},
				resave: false,
				rolling: false,
				saveUninitialized: false,
				secret: "tensoABC",
				store: "memory"
			},
			silent: false,
			ssl: {
				cert: null,
				key: null,
				pfx: null
			},
			static: "/assets/.*",
			staticCache: 300,
			template: "",
			title: "Tensō",
			websocket: {
				enabled: false,
				options: {
					port: 3000,
					keepAliveInterval: 10000
				}
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
		return this.config.etags.enabled && regex.getOnly.test(method) && (header !== void 0 ? this.etags.valid({"cache-control": header}) : true) && this.config.etags.invalid.filter(i => i.test(pathname)).length === 0;
	}

	clf (req, res, headers) {
		return this.config.logging.format.replace("%v", req.headers.host)
			.replace("%h", req.ip || "-")
			.replace("%l", "-")
			.replace("%u", req.parsed.username || "-")
			.replace("%t", `[${(moment().format(this.config.logging.time))}]`)
			.replace("%r", `${req.method} ${req.parsed.pathname} HTTP/${this.config.httpVersion}`)
			.replace("%>s", res.statusCode)
			.replace("%b", headers["content-length"] || "-")
			.replace("%{Referer}i", req.headers.referer || "-")
			.replace("%{User-agent}i", req.headers["user-agent"] || "-");
	}

	connect (req) {
		req.timer = precise().start();
		req.protect = false;
		req.protectAsync = false;
		req.unprotect = false;
		req.server = this;
	}

	compression (encoding = "", mimetype = "") {
		let result = "";

		if (this.config.compress === true && regex.compress.test(mimetype) === true) {
			utility.each(utility.explode(encoding), i => {
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

	headers (req, res, status, body, headers) {
		if (req.protect === true && regex.private.test(headers["cache-control"]) === false) {
			headers["cache-control"] = (headers["cache-control"] || res.getHeader("cache-control") || "").replace(/(private|public)(,\s)?/g, "");
			headers["cache-control"] = `private${(headers["cache-control"].length > 0 ? ", " : "")}${(headers["cache-control"] || "")}`;
		}

		if (regex.modify.test(req.method) === false && regex.modify.test(req.allow) === true && this.config.security.csrf === true && res.locals[this.config.security.key] !== void 0) {
			headers[this.config.security.key] = res.locals[this.config.security.key];
		}

		if (status === 200 && this.canETag(req.parsed.pathname, req.method, res.getHeader("cache-control") || headers["cache-control"])) {
			headers.etag = this.etag(body, req.parsed.href);
		} else {
			delete headers.etag;
			delete headers["last-modified"];
		}

		if (regex.head.test(req.method) === true) {
			headers.connection = "close";
		}

		if (regex.get.test(req.method) === false || status >= 400) {
			delete headers.etag;
			delete headers["last-modified"];
		}

		if (status === 304) {
			delete headers["content-length"];
			delete headers["last-modified"];
		}

		if (status === 404) {
			delete headers.allow;
			delete headers["access-control-allow-methods"];
		}

		if (headers["last-modified"] === "") {
			delete headers["last-modified"];
		}

		const rheaders = res.getHeaders();

		utility.each(Object.keys(headers), i => {
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

		this.log("Generated headers", "debug");
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

	render (req, res, arg, headers) {
		if (arg === null) {
			arg = "null";
		}

		let format = "",
			accepts = utility.explode(req.parsed.searchParams.get("format") || req.headers.accept || format, ","),
			decorated = res.getHeaders(),
			renderer;

		utility.each(accepts, i => {
			if (format.length === 0) {
				const mimetype = i.replace(regex.mimetype, "");

				if (renderers.has(mimetype) === true) {
					format = mimetype;
				}
			}
		});

		if (format.length === 0) {
			format = "application/json";
		}

		renderer = renderers.get(format);
		headers["content-type"] = format;

		utility.each(Object.keys(decorated), i => {
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

	send (req, res, body = "", status = 200, headers = {}) {
		let result;

		if (res.headersSent === false) {
			this.headers(req, res, status, body, headers);
			result = body === null || typeof body.on !== "function" ? this.render(req, res, utility.hypermedia(this, req, utility.serialize(req, body, status), headers), headers) : body;
			headers["x-response-time"] = ((req.timer.stopped.length === 0 ? req.timer.stop() : req.timer).diff() / 1e6).toFixed(2) + " ms";
		} else {
			result = body;
		}

		return result;
	}

	serializer (mimetype, fn) {
		serializers.set(mimetype, fn);

		return this;
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
