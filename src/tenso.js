import {readFileSync} from "node:fs";
import http from "node:http";
import https from "node:https";
import {createRequire} from "node:module";
import {join, resolve} from "node:path";
import {fileURLToPath, URL} from "node:url";
import {Woodland} from "woodland";
import {merge} from "tiny-merge";
import {eventsource} from "tiny-eventsource";
import {config as defaultConfig} from "./core/config.js";
import {parsers} from "./utils/parsers.js";
import {renderers} from "./utils/renderers.js";
import {serializers} from "./utils/serializers.js";
import {mimetype} from "./utils/regex.js";
import {hasBody} from "./utils/hasBody.js";
import {
	ACCESS_CONTROL,
	ALLOW,
	CACHE_CONTROL,
	COMMA,
	CONNECT,
	DELETE,
	EMPTY,
	EXPOSE,
	EXPOSE_HEADERS,
	FORMAT,
	FUNCTION,
	HEADER_CONTENT_TYPE,
	HEADERS,
	HYPHEN,
	INT_0,
	INT_1,
	INT_1000,
	INT_200,
	INT_204,
	INT_304,
	INVALID_CONFIGURATION, METRICS_PATH, MSG_PROMETHEUS_ENABLED,
	NULL,
	OPTIONS,
	PREV_DIR,
	PRIVATE,
	SIGHUP,
	SIGINT,
	SIGTERM,
	TEMPLATE_FILE,
	UTF8,
	WWW,
	X_POWERED_BY
} from "./core/constants.js";
import {serialize} from "./utils/serialize.js";
import {hypermedia} from "./utils/hypermedia.js";
import {payload} from "./middleware/payload.js";
import {parse} from "./middleware/parse.js";
import {prometheus} from "./middleware/prometheus.js";
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
		return arg.includes(DELETE) || hasBody(arg);
	}

	connect (req, res) {
		req.csrf = this.canModify(req.method) === false && this.canModify(req.allow) && this.security.csrf === true;
		req.hypermedia = true;
		req.hypermediaHeader = true;
		req.private = false;
		req.protect = false;
		req.protectAsync = false;
		req.unprotect = false;
		req.url = req.parsed.pathname;
		req.server = this;

		if (req.cors) {
			const header = `${ACCESS_CONTROL}${HYPHEN}${req.method === OPTIONS ? ALLOW : EXPOSE}${HYPHEN}${HEADERS}`;

			res.removeHeader(header);
			res.header(header, `${EXPOSE_HEADERS}${req.csrf ? `, ${this.security.key}` : EMPTY}${this.corsExpose.length > INT_0 ? `, ${this.corsExpose}` : EMPTY}`);
		}
	}

	eventsource (...args) {
		return eventsource(...args);
	}

	final (req, res, arg) {
		return arg;
	}

	headers (req, res) {
		const key = CACHE_CONTROL,
			cache = res.getHeader(key) || EMPTY;

		if ((req.protect || req.csrf || req.private) && cache.includes(PRIVATE) === false) {
			const lcache = cache.replace(/(private|public)(,\s)?/g, EMPTY);

			res.removeHeader(key);
			res.header(key, `${PRIVATE}${lcache.length > INT_0 ? `${COMMA}${EMPTY}` : EMPTY}${lcache || EMPTY}`);
		}
	}

	init () {
		const authorization = Object.keys(this.auth).filter(i => this.auth?.[i]?.enabled === true).length > INT_0 || this.rate.enabled || this.security.csrf;

		this.decorate = this.decorate.bind(this);
		this.route = this.route.bind(this);
		this.render = this.render.bind(this);
		this.signals();
		this.addListener(CONNECT, this.connect.bind(this));
		this.onSend = (req, res, body = EMPTY, status = INT_200, headers) => {
			this.headers(req, res);
			res.statusCode = status;

			if (status !== INT_204 && status !== INT_304 && (body === null || typeof body.on !== FUNCTION)) {
				for (const fn of [serialize, hypermedia, this.final, this.render]) {
					body = fn(req, res, body);
				}
			}

			return [body, status, headers];
		};

		// Prometheus metrics
		if (this.prometheus.enabled) {
			const middleware = prometheus(this.prometheus.metrics);

			this.log(`type=init, message"${MSG_PROMETHEUS_ENABLED}"`);
			this.always(middleware).ignore(middleware);

			this.get(METRICS_PATH, (req, res) => {
				res.set(HEADER_CONTENT_TYPE, middleware.promRegistry.contentType);
				res.set("cache-control", "private, must-revalidate, no-cache, no-store");
				middleware.promRegistry.metrics().then(metrics => res.end(metrics));
			});
		}

		// Payload handling
		this.always(payload).ignore(payload);
		this.always(parse).ignore(parse);

		// Setting 'always' routes before authorization runs
		for (const [key, value] of Object.entries(this.initRoutes.always ?? {})) {
			if (typeof value === FUNCTION) {
				this.always(key, value).ignore(value);
			}
		}

		delete this.initRoutes.always;

		if (authorization) {
			auth(this);
		}

		// Static assets on disk for browsable interface
		if (this.webroot.static !== EMPTY) {
			this.files(this.webroot.static, this.webroot.root);
		}

		// Setting routes
		for (const [method, routes] of Object.entries(this.initRoutes ?? {})) {
			for (const [route, target] of Object.entries(routes ?? {})) {
				this[method](route, target);
			}
		}

		delete this.initRoutes;

		return this;
	}

	parser (mediatype = EMPTY, fn = arg => arg) {
		this.parsers.set(mediatype, fn);

		return this;
	}

	rateLimit (req, fn) {
		const reqId = req.sessionID || req.ip;
		let valid = true,
			seconds = Math.floor(new Date().getTime() / INT_1000),
			limit, remaining, reset, state;

		if (this.rates.has(reqId) === false) {
			this.rates.set(reqId, {
				limit: this.rate.limit,
				remaining: this.rate.limit,
				reset: seconds + this.rate.reset,
				time_reset: this.rate.reset
			});
		}

		if (typeof fn === FUNCTION) {
			this.rates.set(reqId, fn(req, this.rates.get(reqId)));
		}

		state = this.rates.get(reqId);
		limit = state.limit;
		remaining = state.remaining;
		reset = state.reset;

		if (seconds >= reset) {
			reset = state.reset = seconds + this.rate.reset;
			remaining = state.remaining = limit - INT_1;
		} else if (remaining > INT_0) {
			state.remaining--;
			remaining = state.remaining;
		} else {
			valid = false;
		}

		return [valid, limit, remaining, reset];
	}

	render (req, res, arg) {
		if (arg === null) {
			arg = NULL;
		}

		const accepts = (req.parsed.searchParams.get(FORMAT) || req.headers.accept || res.getHeader(HEADER_CONTENT_TYPE)).split(COMMA);
		let format = EMPTY,
			renderer, result;

		for (const media of accepts) {
			const lmimetype = media.replace(mimetype, EMPTY);

			if (this.renderers.has(lmimetype)) {
				format = lmimetype;
				break;
			}
		}

		if (format.length === INT_0) {
			format = this.mimeType;
		}

		renderer = this.renderers.get(format);
		res.header(HEADER_CONTENT_TYPE, format);
		result = renderer(req, res, arg, this.webroot.template);

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
					cert: this.ssl.cert ? readFileSync(this.ssl.cert) : void INT_0,
					pfx: this.ssl.pfx ? readFileSync(this.ssl.pfx) : void INT_0,
					key: this.ssl.key ? readFileSync(this.ssl.key) : void INT_0,
					port: this.port,
					host: this.host
				}, this.route).listen(this.port, this.host);
			}

			this.log(`Started server on ${this.host}:${this.port}`);
		}

		return this;
	}

	stop () {
		if (this.server !== null) {
			this.server.close();
			this.server = null;
			this.log(`Stopped server on ${this.host}:${this.port}`);
		}

		return this;
	}
}

export function tenso (userConfig = {}) {
	const config = merge(clone(defaultConfig), userConfig);

	if ((/^[^\d+]$/).test(config.port) && config.port < INT_1) {
		console.error(INVALID_CONFIGURATION);
		process.exit(INT_1);
	}

	config.title = name;
	config.version = version;
	config.webroot.root = resolve(config.webroot.root || join(__dirname, PREV_DIR, WWW));
	config.webroot.template = readFileSync(config.webroot.template || join(config.webroot.root, TEMPLATE_FILE), {encoding: UTF8});

	if (config.silent !== true) {
		config.defaultHeaders.server = `tenso/${config.version}`;
		config.defaultHeaders[X_POWERED_BY] = `nodejs/${process.version}, ${process.platform}/${process.arch}`;
	}

	const app = new Tenso(config);

	return app.init();
}
