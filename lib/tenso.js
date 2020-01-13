"use strict";

const path = require("path"),
	http = require("http"),
	https = require("https"),
	http2 = require("http2"),
	fs = require("fs"),
	precise = require("precise"),
	moment = require("moment"),
	eventsource = require("tiny-eventsource"),
	dtrace = require(path.join(__dirname, "dtrace.js")),
	middleware = require(path.join(__dirname, "middleware.js")),
	regex = require(path.join(__dirname, "regex.js")),
	{hasBody} = require(path.join(__dirname, "shared.js")),
	{hypermedia, ms, serialize} = require(path.join(__dirname, "utility.js")),
	renderers = require(path.join(__dirname, "renderers.js")),
	serializers = require(path.join(__dirname, "serializers.js")),
	Base = require(path.join(__dirname, "base.js"));

class Tenso extends Base {
	constructor () {
		super();
		this.config = {
			auth: {
				delay: 0,
				protect: [],
				unprotect: [],
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
				msg: {
					login: "POST 'username' & 'password' to authenticate"
				},
				oauth2: {
					enabled: false,
					auth: null,
					auth_url: "",
					token_url: "",
					client_id: "",
					client_secret: ""
				},
				uri: {
					login: "/auth/login",
					logout: "/auth/logout",
					redirect: "/",
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
			coerce: true,
			corsExpose: "",
			dtrace: false,
			etags: {
				enabled: false,
				ignore: [],
				invalid: [],
				mimetype: "application/json"
			},
			headers: {
				"content-type": "application/json",
				"vary": "accept, accept-encoding, accept-language, origin"
			},
			host: "0.0.0.0",
			http2: false,
			httpVersion: "1.1",
			index: ["index.htm", "index.html"],
			json: 0,
			logging: {
				enabled: true,
				stack: false,
				stackWire: false,
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
			mimeType: "application/json",
			origins: ["*"],
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
				rolling: true,
				resave: true,
				saveUninitialized: true,
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
			uid: 0
		};
		this.etags = null;
		this.dtrace = this.config.dtrace;
		this.dtp = null;
		this.probes = new Map();
		this.rates = new Map();
		this.renderers = renderers;
		this.router = null;
		this.serializers = serializers;
		this.server = null;
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

	always (...args) {
		this.router.always(...args);

		return this;
	}

	blacklist (fn) {
		this.router.blacklist(fn);

		return this;
	}

	canETag (pathname, method, header) {
		let result, timer;

		if (this.dtrace) {
			timer = precise().start();
		}

		result = this.config.etags.enabled && method === "GET" && (header !== void 0 ? this.etags.valid({"cache-control": header}) : true) && this.config.etags.invalid.filter(i => i.test(pathname)).length === 0;

		if (this.dtrace) {
			timer.stop();
			this.probes.get("etag").fire(() => [pathname, method, ms(timer.diff())]);
		}

		return result;
	}

	canModify (arg) {
		return arg.includes("DELETE") || hasBody(arg);
	}

	clf (req, res) {
		return this.config.logging.format.replace("%v", req.headers.host)
			.replace("%h", req.ip || "-")
			.replace("%l", "-")
			.replace("%u", req.parsed.username || "-")
			.replace("%t", `[${moment().format(this.config.logging.time)}]`)
			.replace("%r", `${req.method} ${req.parsed.pathname}${req.parsed.search} HTTP/${this.config.httpVersion}`)
			.replace("%>s", res.statusCode)
			.replace("%b", res.getHeader("content-length") || "-")
			.replace("%{Referer}i", req.headers.referer || "-")
			.replace("%{User-agent}i", req.headers["user-agent"] || "-");
	}

	connect (req, res) {
		const fn = res.send;

		req.timer = precise().start();
		req.hypermedia = true;
		req.protect = false;
		req.protectAsync = false;
		req.unprotect = false;
		req.server = this;
		res.send = (body = "", status = 200, headers = {}) => {
			if (!res.headersSent) {
				let lbody = body;

				for (const [key, value] of Object.entries(headers)) {
					res.header(key, value);
				}

				res.statusCode = status;

				if (lbody === null || typeof lbody.on !== "function") {
					lbody = serialize(req, res, lbody);
					lbody = hypermedia(req, res, lbody);
					lbody = this.final(req, res, lbody);
					lbody = this.render(req, res, lbody);
				}

				lbody = this.send(req, res, lbody);
				fn(lbody, res.statusCode);
			}
		};
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

	error (req, res, err = {}) {
		const preset = res.statusCode >= 400,
			numeric = isNaN(err.message) === false,
			status = preset ? res.statusCode : numeric ? Number(err.message) : 500;

		res.send(preset && err instanceof Error ? err : new Error(http.STATUS_CODES[status]), status);
	}

	etag (...args) {
		return this.etags.create(args.map(i => typeof i !== "string" ? JSON.stringify(i) : i).join("-"));
	}

	eventsource (...args) {
		return eventsource(...args);
	}

	final (req, res, arg) {
		return arg;
	}

	finish (req, res) {
		return this.log(this.clf(req, res), "info");
	}

	headers (req, res, body) {
		const status = res.statusCode,
			cache = res.getHeader("cache-control") || "";
		let csrf = false,
			timer;

		if (this.dtrace) {
			timer = precise().start();
		}

		if (req.protect && cache.includes("private") === false) {
			let lcache = cache.replace(/(private|public)(,\s)?/g, "");

			res.header("cache-control", `private${lcache.length > 0 ? ", " : ""}${lcache || ""}`);
		}

		if (this.canModify(req.method) === false && this.canModify(req.allow) && this.config.security.csrf === true && this.config.security.key in res.locals) {
			res.header(this.config.security.key, res.locals[this.config.security.key]);
			csrf = true;
		}

		if (req.cors) {
			res.header("access-control-expose-headers", `cache-control, content-language, content-type, expires, last-modified, pragma${csrf ? `, ${this.config.security.key}` : ""}${this.config.corsExpose.length > 0 ? `, ${this.config.corsExpose}` : ""}`);
		}

		if (status === 200 && this.canETag(req.parsed.pathname, req.method, res.getHeader("cache-control"))) {
			res.header("etag", this.etag(body));
		} else {
			res.removeHeader("etag");
			res.removeHeader("last-modified");
		}

		if (req.method === "HEAD") {
			res.header("connection", "close");
		}

		if (res.getHeader("last-modified") === "") {
			res.removeHeader("last-modified");
		}

		if (status === 404) {
			res.removeHeader("allow");
			res.removeHeader("access-control-allow-methods");
		}

		if (status >= 300 && status < 400) {
			res.removeHeader("accept-ranges");
			res.removeHeader("cache-control");
			res.removeHeader("content-type");
			res.removeHeader("content-length");
		}

		res.header("x-response-time", ((req.timer.stopped.length === 0 ? req.timer.stop() : req.timer).diff() / 1e6).toFixed(2) + " ms");

		if (this.dtrace) {
			timer.stop();
			this.probes.get("headers").fire(() => [req.parsed.pathname, req.method, status, ms(timer.diff())]);
		}

		this.log("Generated headers", "debug");
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

	rate (req, fn) {
		let timer;

		if (this.dtrace) {
			timer = precise().start();
		}

		const config = this.config.rate,
			id = req.sessionID || req.ip;
		let valid = true,
			seconds = Math.floor(new Date().getTime() / 1000),
			limit, remaining, reset, state;

		if (this.rates.has(id) === false) {
			this.rates.set(id, {
				limit: config.limit,
				remaining: config.limit,
				reset: seconds + config.reset,
				time_reset: config.reset
			});
		}

		if (typeof fn === "function") {
			this.rates.set(id, fn(req, this.rates.get(id)));
		}

		state = this.rates.get(id);
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

		if (this.dtrace) {
			timer.stop();
			this.probes.get("rate").fire(() => [req.parsed.pathname, req.method, valid, limit, remaining, reset, ms(timer.diff())]);
		}

		return [valid, limit, remaining, reset];
	}

	render (req, res, arg) {
		let timer;

		if (this.dtrace) {
			timer = precise().start();
		}

		if (arg === null) {
			arg = "null";
		}

		const accepts = (req.parsed.searchParams.get("format") || req.headers.accept || res.getHeader("content-type")).split(",");
		let format = "",
			renderer, result;

		for (const media of accepts) {
			const mimetype = media.replace(regex.mimetype, "");

			if (renderers.has(mimetype)) {
				format = mimetype;
				break;
			}
		}

		if (format.length === 0) {
			format = this.config.mimeType;
		}

		renderer = renderers.get(format);
		res.header("content-type", format);
		result = renderer(req, res, arg, this.config.template);

		if (this.dtrace) {
			timer.stop();
			this.probes.get("render").fire(() => [req.parsed.pathname, req.method, ms(timer.diff())]);
		}

		return result;
	}

	renderer (mimetype, fn) {
		this.renderers.set(mimetype, fn);

		return this;
	}

	send (req, res, body = "") {
		let result, timer;

		if (this.dtrace) {
			timer = precise().start();
		}

		this.headers(req, res, body);

		switch (res.statusCode) {
			case 204:
			case 301:
			case 302:
			case 304:
			case 307:
			case 308:
				result = "";
				break;
			default:
				const nil = body === null;

				if (nil || typeof body.on !== "function") {
					res.header("content-length", nil ? 0 : Buffer.byteLength(body));
					result = req.method === "HEAD" || nil ? "" : body;
				} else {
					result = body;
				}
		}

		if (this.dtrace) {
			timer.stop();
			this.probes.get("send").fire(() => [req.parsed.pathname, req.method, res.statusCode, ms(timer.diff())]);
		}

		return result;
	}

	serializer (mimetype, fn) {
		this.serializers.set(mimetype, fn);

		return this;
	}

	start () {
		this.config.etags.invalid = this.config.etags.ignore.map(i => new RegExp(i, "i"));

		if (this.server === null) {
			if (this.config.ssl.cert === null && this.config.ssl.pfx === null && this.config.ssl.key === null) {
				this.server = http.createServer(this.router.route).listen(this.config.port, this.config.host, () => this.drop());
			} else if (this.config.http2 === false) {
				this.server = https.createServer({
					cert: this.config.ssl.cert ? fs.readFileSync(this.config.ssl.cert) : void 0,
					pfx: this.config.ssl.pfx ? fs.readFileSync(this.config.ssl.pfx) : void 0,
					key: this.config.ssl.key ? fs.readFileSync(this.config.ssl.key) : void 0,
					port: this.config.port,
					host: this.config.host
				}, this.router.route).listen(this.config.port, this.config.host, () => this.drop());
			} else {
				this.config.httpVersion = "2.0";
				this.server = http2.createSecureServer({
					cert: this.config.ssl.cert ? fs.readFileSync(this.config.ssl.cert) : void 0,
					pfx: this.config.ssl.pfx ? fs.readFileSync(this.config.ssl.pfx) : void 0,
					key: this.config.ssl.key ? fs.readFileSync(this.config.ssl.key) : void 0
				}).on("stream", this.router.route).listen(this.config.port, this.config.host, () => this.drop());
			}

			this.dtrace = this.config.dtrace;

			if (this.dtrace) {
				this.dtp = dtrace("tenso");
				this.probes.set("etag", this.dtp.addProbe("etag", "char *", "char *", "char *"));
				this.probes.set("headers", this.dtp.addProbe("headers", "char *", "char *", "int", "char *"));
				this.probes.set("rate", this.dtp.addProbe("rate", "char *", "char *", "bool", "int", "int", "int", "char *"));
				this.probes.set("render", this.dtp.addProbe("render", "char *", "char *", "char *"));
				this.probes.set("send", this.dtp.addProbe("send", "char *", "char *", "int", "char *"));
				this.dtp.enable();
			}

			this.log(`Started server on port ${this.config.host}:${this.config.port}`, "debug");
		}

		return this;
	}

	"static" (...args) {
		middleware.static(...args);

		return this;
	}

	stop () {
		if (this.server !== null) {
			this.server.close();
			this.server = null;
		}

		this.log(`Stopped server on port ${this.config.host}:${this.config.port}`, "debug");

		return this;
	}

	use (...args) {
		this.router.use(...args);

		return this;
	}
}

module.exports = config => new Tenso(config);
