import {createServer as http} from "node:http";
import {createServer as https} from "node:https";
import * as fs from "node:fs";
import {eventsource} from "tiny-eventsource";
import {parsers} from "./parsers.js";
import {hasBody} from "./utility.js";
import {renderers} from "./renderers.js";
import {serializers} from "./serializers.js";
import {Base} from "./base.js";
import config from "../config.json" assert {type: "json"};

class Tenso extends Base {
	constructor () {
		super();
		this.config = config;
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

		if ((req.protect || req.csrf || req.private) && cache.includes("private") === false) {
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

	parser (mimetype, fn) {
		this.parsers.set(mimetype, fn);

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
			const mimetype = media.replace(mimetype, "");

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
