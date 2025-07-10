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
	ERROR,
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
	INVALID_CONFIGURATION,
	METRICS_PATH,
	MSG_PROMETHEUS_ENABLED,
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
import {exit} from "./middleware/exit.js";
import {payload} from "./middleware/payload.js";
import {parse} from "./middleware/parse.js";
import {prometheus} from "./middleware/prometheus.js";
import {auth} from "./utils/auth.js";
import {clone} from "./utils/clone.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const require = createRequire(import.meta.url);
const {name, version} = require(join(__dirname, "..", "package.json"));

/**
 * Tenso web framework class that extends Woodland
 * @class Tenso
 * @extends {Woodland}
 */
class Tenso extends Woodland {
	/**
	 * Creates an instance of Tenso
	 * @param {Object} [config=defaultConfig] - Configuration object for the Tenso instance
	 */
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

	/**
	 * Checks if a given HTTP method can modify data
	 * @param {string} arg - HTTP method to check
	 * @returns {boolean} True if the method can modify data, false otherwise
	 */
	canModify (arg) {
		return arg.includes(DELETE) || hasBody(arg);
	}

	/**
	 * Handles connection setup for incoming requests
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @returns {void}
	 */
	connect (req, res) {
		req.csrf = this.canModify(req.method) === false && this.canModify(req.allow) && this.security.csrf === true;
		req.hypermedia = this.hypermedia.enabled;
		req.hypermediaHeader = this.hypermedia.header;
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

	/**
	 * Creates an EventSource instance
	 * @param {...any} args - Arguments to pass to the eventsource function
	 * @returns {*} Result of the eventsource function
	 */
	eventsource (...args) {
		return eventsource(...args);
	}

	/**
	 * Final processing step in the request pipeline
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {*} arg - Data to be processed
	 * @returns {*} The processed data
	 */
	final (req, res, arg) {
		return arg;
	}

	/**
	 * Handles response headers, particularly caching headers
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @returns {void}
	 */
	headers (req, res) {
		const key = CACHE_CONTROL,
			cache = res.getHeader(key) || EMPTY;

		if ((req.protect || req.csrf || req.private) && cache.includes(PRIVATE) === false) {
			const lcache = cache.replace(/(private|public)(,\s)?/g, EMPTY);

			res.removeHeader(key);
			res.header(key, `${PRIVATE}${lcache.length > INT_0 ? `${COMMA}${EMPTY}` : EMPTY}${lcache || EMPTY}`);
		}
	}

	/**
	 * Initializes the Tenso server with middleware, routes, and configuration
	 * @returns {Tenso} The Tenso instance for method chaining
	 */
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
			const metricsHandler = prometheus(this.prometheus.metrics);
			const middleware = metricsHandler;

			this.log(`type=init, message"${MSG_PROMETHEUS_ENABLED}"`);
			this.always(middleware).ignore(middleware);

			// Registering a route for metrics endpoint
			this.get(METRICS_PATH, (req, res) => {
				res.setHeader('Content-Type', metricsHandler.register.contentType);
				metricsHandler.register.metrics().then(metrics => {
					res.end(metrics);
				}).catch(err => {
					res.statusCode = 500;
					res.end(`Error collecting metrics: ${err.message}`);
				});
			});

			// Hooking events that might bypass middleware
			this.on(ERROR, (req, res) => {
				if (req.valid === false) {
					middleware(req, res, () => void 0);
				}
			});
		}

		// Early exit after prometheus metrics (for GETs only)
		this.always(exit).ignore(exit);

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

	/**
	 * Registers a parser for a specific media type
	 * @param {string} [mediatype=EMPTY] - The media type to register the parser for
	 * @param {Function} [fn=arg => arg] - The parser function
	 * @returns {Tenso} The Tenso instance for method chaining
	 */
	parser (mediatype = EMPTY, fn = arg => arg) {
		this.parsers.set(mediatype, fn);

		return this;
	}

	/**
	 * Handles rate limiting for incoming requests
	 * @param {Object} req - Request object
	 * @param {Function} fn - Optional function to modify rate limit state
	 * @returns {Array} Array containing [valid, limit, remaining, reset]
	 */
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

	/**
	 * Renders the response based on the accepted content type
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {*} arg - Data to be rendered
	 * @returns {*} The rendered response
	 */
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

	/**
	 * Registers a renderer for a specific media type
	 * @param {string} mediatype - The media type to register the renderer for
	 * @param {Function} fn - The renderer function
	 * @returns {Tenso} The Tenso instance for method chaining
	 */
	renderer (mediatype, fn) {
		this.renderers.set(mediatype, fn);

		return this;
	}

	/**
	 * Registers a serializer for a specific media type
	 * @param {string} mediatype - The media type to register the serializer for
	 * @param {Function} fn - The serializer function
	 * @returns {Tenso} The Tenso instance for method chaining
	 */
	serializer (mediatype, fn) {
		this.serializers.set(mediatype, fn);

		return this;
	}

	/**
	 * Sets up signal handlers for graceful server shutdown
	 * @returns {Tenso} The Tenso instance for method chaining
	 */
	signals () {
		for (const signal of [SIGHUP, SIGINT, SIGTERM]) {
			process.on(signal, () => {
				this.stop();
				process.exit(0);
			});
		}

		return this;
	}

	/**
	 * Starts the HTTP or HTTPS server
	 * @returns {Tenso} The Tenso instance for method chaining
	 */
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

	/**
	 * Stops the server
	 * @returns {Tenso} The Tenso instance for method chaining
	 */
	stop () {
		if (this.server !== null) {
			this.server.close();
			this.server = null;
			this.log(`Stopped server on ${this.host}:${this.port}`);
		}

		return this;
	}
}

/**
 * Factory function that creates and initializes a Tenso server instance
 * @param {Object} [userConfig={}] - User configuration object to override defaults
 * @returns {Tenso} An initialized Tenso server instance
 */
export function tenso (userConfig = {}) {
	const config = merge(clone(defaultConfig), userConfig);

	if ((/^[^\d+]$/).test(config.port) && config.port < INT_1) {
		console.error(INVALID_CONFIGURATION);
		process.exit(INT_1);
	}

	config.title = config.title ?? name;
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
