import {readFileSync} from "node:fs";
import http from "node:http";
import https from "node:https";
import {createRequire} from "node:module";
import {join, resolve} from "node:path";
import {fileURLToPath, URL} from "node:url";
import {Woodland} from "woodland";
import defaults from "defaults";
import {eventsource} from "tiny-eventsource";
import {config as defaultConfig} from "./utils/config.js";
import {parsers} from "./utils/parsers.js";
import {renderers} from "./utils/renderers.js";
import {serializers} from "./utils/serializers.js";
import {mimetype} from "./utils/regex.js";
import {hasBody} from "./utils/hasbody.js";
import {CONNECT, EMPTY, FUNCTION, INT_200, INT_204, INT_304, SIGHUP, SIGINT, SIGTERM} from "./utils/constants.js";
import {serialize} from "./utils/serialize.js";
import {hypermedia} from "./utils/hypermedia.js";
import {payload} from "./middleware/payload.js";
import {parse} from "./middleware/parse.js";
import {auth} from "./utils/auth.js";
import {clone} from "./utils/clone.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const require = createRequire(import.meta.url);
const {name, version} = require(join(__dirname, "..", "package.json"));

class Tenso extends Woodland {
	constructor (config = defaultConfig) {
		super(config);

		for (const [key, value] of Object.entries(config)) {
			if (key in this === false) {
				this[key] = value;
			}
		}

		this.parsers = parsers;
		this.rates = new Map();
		this.renderers = renderers;
		this.serializers = serializers;
		this.server = null;
		this.version = config.version;
	}

	canModify (arg) {
		return arg.includes("DELETE") || hasBody(arg);
	}

	connect (req, res) {
		req.csrf = this.canModify(req.method) === false && this.canModify(req.allow) && this.security.csrf === true;
		req.hypermedia = true;
		req.private = false;
		req.protect = false;
		req.protectAsync = false;
		req.unprotect = false;
		req.server = this;

		if (req.cors) {
			const header = `access-control-${req.method === "OPTIONS" ? "allow" : "expose"}-headers`;

			res.removeHeader(header);
			res.header(header, `cache-control, content-language, content-type, expires, last-modified, pragma${req.csrf ? `, ${this.security.key}` : ""}${this.corsExpose.length > 0 ? `, ${this.corsExpose}` : ""}`);
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

		if ((req.protect || req.csrf || req.private) && cache.includes("private") === false) {
			const lcache = cache.replace(/(private|public)(,\s)?/g, "");

			res.removeHeader(key);
			res.header(key, `private${lcache.length > 0 ? ", " : ""}${lcache || ""}`);
		}
	}

	init () {
		const authorization = Object.keys(this.config.auth).filter(i => this.config.auth?.[i]?.enabled === true).length > 0 || this.config.rate.enabled || this.config.security.csrf;

		this.decorate = this.decorate.bind(this);
		this.route = this.route.bind(this);
		this.signals();
		this.version = this.config.version;
		this.addListener(CONNECT, this.connect.bind(this));
		this.onsend = (req, res, body = EMPTY, status = INT_200, headers) => {
			this.headers(req, res);
			res.statusCode = status;

			if (status !== INT_204 && status !== INT_304 && (body === null || typeof body.on !== FUNCTION)) {
				for (const fn of [serialize, hypermedia, this.final, this.render]) {
					body = fn(req, res, body);
				}
			}

			return [body, status, headers];
		};

		// Payload handling
		this.always(payload).ignore(payload);
		this.always(parse).ignore(parse);

		// Setting 'always' routes before authorization runs
		for (const [key, value] of Object.entries(this.config.routes.always ?? {})) {
			if (typeof value === FUNCTION) {
				this.always(key, value).ignore(value);
			}
		}

		delete this.config.routes.always;

		if (authorization) {
			auth(this, this.config);
		}

		// Static assets on disk for browsable interface
		if (this.config.static !== EMPTY) {
			this.staticFiles(join(__dirname, "..", "www", this.config.static));
		}

		// Setting routes
		for (const [method, routes] of Object.entries(this.config.routes ?? {})) {
			for (const [route, target] of Object.entries(routes ?? {})) {
				if (typeof target === FUNCTION) {
					this[method](route, target);
				} else {
					this[method](route, (req, res) => res.send(target));
				}
			}
		}

		return this;
	}

	parser (mediatype = "", fn = arg => arg) {
		this.parsers.set(mediatype, fn);

		return this;
	}

	rateLimit (req, fn) {
		const config = this.rate,
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
			const lmimetype = media.replace(mimetype, "");

			if (renderers.has(lmimetype)) {
				format = lmimetype;
				break;
			}
		}

		if (format.length === 0) {
			format = this.mimeType;
		}

		renderer = renderers.get(format);
		res.header("content-type", format);
		result = renderer(req, res, arg, this.template);

		return result;
	}

	renderer (mediatype, fn) {
		this.renderers.set(mediatype, fn);

		return this;
	}

	serializer (mediatype, fn) {
		this.serializers.set(mediatype, fn);

		return this;
	}

	signals () {
		for (const signal of [SIGHUP, SIGINT, SIGTERM]) {
			process.on(signal, () => {
				this.stop();
				process.exit(0);
			});
		}

		return this;
	}

	start () {
		if (this.server === null) {
			if (this.ssl.cert === null && this.ssl.pfx === null && this.ssl.key === null) {
				this.server = http.createServer(this.route).listen(this.port, this.host);
			} else {
				this.server = https.createServer({
					cert: this.ssl.cert ? readFileSync(this.ssl.cert) : void 0,
					pfx: this.ssl.pfx ? readFileSync(this.ssl.pfx) : void 0,
					key: this.ssl.key ? readFileSync(this.ssl.key) : void 0,
					port: this.port,
					host: this.host
				}, this.route).listen(this.port, this.host);
			}

			this.log(`Started server on port ${this.host}:${this.port}`);
		}

		return this;
	}

	stop () {
		if (this.server !== null) {
			this.server.close();
			this.server = null;
			this.log(`Stopped server on port ${this.host}:${this.port}`);
		}

		return this;
	}
}

export function tenso (userConfig = {}) {
	const config = defaults(userConfig, clone(defaultConfig));

	if ((/^[^\d+]$/).test(config.port) && config.port < 1) {
		console.error("Invalid configuration");
		process.exit(1);
	}

	config.title = name;
	config.version = version;
	config.webroot.root = resolve(config.webroot.root || join(__dirname, "..", "www"));
	config.webroot.template = readFileSync(config.webroot.template || join(config.webroot.root, "template.html"), {encoding: "utf8"});

	if (config.silent !== true) {
		config.defaultHeaders.server = `tenso/${config.version}`;
		config.defaultHeaders["x-powered-by"] = `nodejs/${process.version}, ${process.platform}/${process.arch}`;
	}

	const app = new Tenso(config);

	return app.init();
}
