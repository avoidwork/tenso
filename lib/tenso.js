"use strict";

const path = require("path"),
	http = require("http"),
	https = require("https"),
	fs = require("fs"),
	eventsource = require("tiny-eventsource"),
	parsers = require(path.join(__dirname, "parsers.js")),
	regex = require(path.join(__dirname, "regex.js")),
	{hasBody} = require(path.join(__dirname, "shared.js")),
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
			corsExpose: "cache-control, content-language, content-type, expires, last-modified, pragma, x-csrf-token",
			headers: {
				"content-type": "application/json; charset=utf-8",
				"vary": "accept, accept-encoding, accept-language, origin"
			},
			host: "0.0.0.0",
			index: ["index.htm", "index.html"],
			json: 0,
			logging: {
				enabled: true,
				stack: false
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
			static: "/assets",
			staticCache: 300,
			template: "",
			title: "Tenso",
			uid: 0
		};
		this.parsers = parsers;
		this.rates = new Map();
		this.renderers = renderers;
		this.router = null;
		this.serializers = serializers;
		this.server = null;
		this.version = "";
	}

	canModify (arg) {
		return arg.includes("DELETE") || hasBody(arg);
	}

	connect (req, res) {
		let csrf = false;

		req.hypermedia = true;
		req.protect = false;
		req.protectAsync = false;
		req.unprotect = false;
		req.server = this;

		if (this.canModify(req.method) === false && this.canModify(req.allow) && this.config.security.csrf === true && this.config.security.key in res.locals) {
			res.header(this.config.security.key, res.locals[this.config.security.key]);
			csrf = true;
		}

		if (req.cors) {
			const header = `access-control-${req.method === "OPTIONS" ? "allow" : "expose"}-headers`;

			res.removeHeader(header);
			res.header(header, `cache-control, content-language, content-type, expires, last-modified, pragma${csrf ? `, ${this.config.security.key}` : ""}${this.config.corsExpose.length > 0 ? `, ${this.config.corsExpose}` : ""}`);
		}
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

	eventsource (...args) {
		return eventsource(...args);
	}

	final (req, res, arg) {
		return arg;
	}

	headers (req, res) {
		const key = "cache-control",
			cache = res.getHeader(key) || "";

		if (req.protect && cache.includes("private") === false) {
			const lcache = cache.replace(/(private|public)(,\s)?/g, "");

			res.removeHeader(key);
			res.header(key, `private${lcache.length > 0 ? ", " : ""}${lcache || ""}`);
		}
	}

	ignore (fn) {
		this.router.ignore(fn);

		return this;
	}

	log (msg, level = "debug") {
		this.router.log(msg, level);

		return this;
	}

	rate (req, fn) {
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

		return [valid, limit, remaining, reset];
	}

	render (req, res, arg) {
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

		return result;
	}

	renderer (mimetype, fn) {
		this.renderers.set(mimetype, fn);

		return this;
	}

	serializer (mimetype, fn) {
		this.serializers.set(mimetype, fn);

		return this;
	}

	start () {
		if (this.server === null) {
			if (this.config.ssl.cert === null && this.config.ssl.pfx === null && this.config.ssl.key === null) {
				this.server = http.createServer(this.router.route).listen(this.config.port, this.config.host, () => this.drop());
			} else {
				this.server = https.createServer({
					cert: this.config.ssl.cert ? fs.readFileSync(this.config.ssl.cert) : void 0,
					pfx: this.config.ssl.pfx ? fs.readFileSync(this.config.ssl.pfx) : void 0,
					key: this.config.ssl.key ? fs.readFileSync(this.config.ssl.key) : void 0,
					port: this.config.port,
					host: this.config.host
				}, this.router.route).listen(this.config.port, this.config.host, () => this.drop());
			}

			this.log(`Started server on port ${this.config.host}:${this.config.port}`, "debug");
		}

		return this;
	}

	"static" (uri = "", localPath = "", folder = "") {
		this.router.serve(uri, localPath, folder);

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
