import {readFileSync} from "node:fs";
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

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const require = createRequire(import.meta.url);
const {name, version} = require(join(__dirname, "..", "package.json"));
import {hasBody} from "./utils/shared.js";
import http from "http";
import https from "https";
import fs from "fs";

class Tenso extends Woodland {
	constructor (config = defaultConfig) {
		super(config);
		for (const [key, value] of Object.entries(config)) {
			this[key] = value;
		}
		this.config = config; // @todo remove once all code is updated
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
		req.csrf = this.canModify(req.method) === false && this.canModify(req.allow) && this.config.security.csrf === true;
		req.hypermedia = true;
		req.private = false;
		req.protect = false;
		req.protectAsync = false;
		req.unprotect = false;
		req.server = this;

		if (req.cors) {
			const header = `access-control-${req.method === "OPTIONS" ? "allow" : "expose"}-headers`;

			res.removeHeader(header);
			res.header(header, `cache-control, content-language, content-type, expires, last-modified, pragma${req.csrf ? `, ${this.config.security.key}` : ""}${this.config.corsExpose.length > 0 ? `, ${this.config.corsExpose}` : ""}`);
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

	parser (mediatype = "", fn = arg => arg) {
		this.parsers.set(mediatype, fn);

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
			const lmimetype = media.replace(mimetype, "");

			if (renderers.has(lmimetype)) {
				format = lmimetype;
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

	renderer (mediatype, fn) {
		this.renderers.set(mediatype, fn);

		return this;
	}

	serializer (mediatype, fn) {
		this.serializers.set(mediatype, fn);

		return this;
	}

	start () {
		if (this.server === null) {
			if (this.config.ssl.cert === null && this.config.ssl.pfx === null && this.config.ssl.key === null) {
				this.server = http.createServer(this.route).listen(this.config.port, this.config.host, () => this.drop());
			} else {
				this.server = https.createServer({
					cert: this.config.ssl.cert ? fs.readFileSync(this.config.ssl.cert) : void 0,
					pfx: this.config.ssl.pfx ? fs.readFileSync(this.config.ssl.pfx) : void 0,
					key: this.config.ssl.key ? fs.readFileSync(this.config.ssl.key) : void 0,
					port: this.config.port,
					host: this.config.host
				}, this.route).listen(this.config.port, this.config.host, () => this.drop());
			}

			this.log(`Started server on port ${this.config.host}:${this.config.port}`);
		}

		return this;
	}

	"static" (uri = "", localPath = "", folder = "") {
		this.serve(uri, localPath, folder);

		return this;
	}

	stop () {
		if (this.server !== null) {
			this.server.close();
			this.server = null;
		}

		this.log(`Stopped server on port ${this.config.host}:${this.config.port}`);

		return this;
	}
}

export function tenso (userConfig = {}) {
	const config = defaults(userConfig, structuredClone(defaultConfig));

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

	process.on("SIGTERM", async () => {
		await app.server.close();
		process.exit(0);
	});

	return app;
}
