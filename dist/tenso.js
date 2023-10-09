/**
 * tenso
 *
 * @copyright 2023 Jason Mulligan <jason.mulligan@avoidwork.com>
 * @license BSD-3-Clause
 * @version 17.0.0
 */
import {readFileSync}from'node:fs';import {createRequire}from'node:module';import {join,resolve}from'node:path';import {fileURLToPath,URL}from'node:url';import {Woodland}from'woodland';import defaults from'defaults';import {stringify}from'yaml';import {STATUS_CODES}from'http';const __dirname$1 = fileURLToPath(new URL(".", import.meta.url));
const {name, version: version$1} = require(join(__dirname$1, "..", "..", "package.json"));

const config = {
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
	autoindex: false,
	cacheSize: 1e3,
	cacheTTL: 3e5,
	catchAll: true,
	charset: "utf-8",
	corsExpose: "cache-control, content-language, content-type, expires, last-modified, pragma, x-csrf-token",
	defaultHeaders: {
		"content-type": "application/json; charset=utf-8",
		"vary": "accept, accept-encoding, accept-language, origin"
	},
	digit: 3,
	etags: true,
	host: "0.0.0.0",
	index: [],
	json: 0,
	logging: {
		enabled: true,
		format: "%h %l %u %t \"%r\" %>s %b",
		level: "debug",
		stack: true
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
	renderHeaders: true,
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
			secure: "auto"
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
	webroot: {
		root: "",
		static: "/assets",
		template: ""
	},
	title: name,
	version: version$1
};const bodySplit = /&|=/;const parsers = new Map([
	[
		"application/x-www-form-urlencoded",
		arg => {
			const args = arg ? chunk(arg.split(bodySplit), 2) : [],
				result = {};

			for (const i of args) {
				result[decodeURIComponent(i[0].replace(/\+/g, "%20"))] = coerce(decodeURIComponent(i[1].replace(/\+/g, "%20")));
			}

			return result;
		}
	],
	[
		"application/json",
		arg => JSON.parse(arg)
	]
]);function indent (arg = "", fallback = 0) {
	return arg.includes("indent=") ? parseInt(arg.match(/indent=(\d+)/)[1], 10) : fallback;
}function json (req, res, arg) {
	return JSON.stringify(arg, null, indent(req.headers.accept, req.server.config.json))
}function yaml (req, res, arg) {
	return stringify(arg);
}// @todo replace with a good library
function serialize$1 (arg) {
	return arg;
}

function xml (req, res, arg) {
	return serialize$1(arg)
}function plain$1 (req, res, arg) {
	return Array.isArray(arg) ? arg.map(i => text(req, res, i)).join(",") : arg instanceof Object ? JSON.stringify(arg, null, indent(req.headers.accept, req.server.config.json)) : arg.toString()
}function javascript (req, res, arg) {
	req.headers.accept = "application/javascript";
	res.header("content-type", "application/javascript");

	return `${req.parsed.searchParams.get("callback") || "callback"}(${JSON.stringify(arg, null, 0)});`;
}// @todo replace with a good library
function serialize (arg) {
	return arg;
}

function csv (req, res, arg) {
	return serialize(arg)
}function html (req, res, arg, tpl = "") {
	const protocol = "x-forwarded-proto" in req.headers ? req.headers["x-forwarded-proto"] + ":" : req.parsed.protocol,
		headers = res.getHeaders();

	return tpl.length > 0 ? tpl.replace(/\{\{title\}\}/g, req.server.config.title)
		.replace("{{url}}", req.parsed.href.replace(req.parsed.protocol, protocol))
		.replace("{{headers}}", Object.keys(headers).sort().map(i => `<tr><td>${i}</td><td>${sanitize(headers[i])}</td></tr>`).join("\n"))
		.replace("{{formats}}", `<option value=''></option>${Array.from(renderers.keys()).filter(i => i.indexOf("html") === -1).map(i => `<option value='${i.trim()}'>${i.replace(/^.*\//, "").toUpperCase()}</option>`).join("\n")}`)
		.replace("{{body}}", sanitize(JSON.stringify(arg, null, 2)))
		.replace("{{year}}", new Date().getFullYear())
		.replace("{{version}}", req.server.config.version)
		.replace("{{allow}}", headers.allow)
		.replace("{{methods}}", utility.explode((headers.allow || "").replace("GET, HEAD, OPTIONS", "")).filter(i => i !== "").map(i => `<option value='${i.trim()}'>$i.trim()}</option>`).join("\n"))
		.replace("{{csrf}}", headers["x-csrf-token"] || "")
		.replace("class=\"headers", req.server.config.renderHeaders === false ? "class=\"headers dr-hidden" : "class=\"headers") : "";
}const renderers$1 = new Map([
	["application/json", json],
	["application/yaml", yaml],
	["application/xml", xml],
	["text/plain", plain$1],
	["application/javascript", javascript],
	["text/csv", csv],
	["text/html", html]
]);function custom (arg, err, status = 200, stack = false) {
	return {
		data: arg,
		error: err !== null ? (stack ? err.stack : err.message) || err || STATUS_CODES[status] : null,
		links: [],
		status: status
	};
}function plain (arg, err, status = 200, stack = false) {
	return err !== null ? (stack ? err.stack : err.message) || err || STATUS_CODES[status] : arg;
}const serializers = new Map([
	["application/json", custom],
	["application/yaml", custom],
	["application/xml", custom],
	["text/plain", plain],
	["application/javascript", custom],
	["text/csv", custom],
	["text/html", custom]
]);const __dirname = fileURLToPath(new URL(".", import.meta.url));
const require$1 = createRequire(import.meta.url);
const {version} = require$1(join(__dirname, "..", "..", "package.json"));

class Tenso extends Woodland {
	constructor (config$1 = config) {
		super(config$1);
		this.config = config$1;
		this.parsers = parsers;
		this.rates = new Map();
		this.renderers = renderers$1;
		this.serializers = serializers;
		this.server = null;
		this.version = config$1.version;
	}

	bootstrap () {}

	start () {}

	stop () {}
}

function tenso (userConfig = {}) {
	const config$1 = defaults(userConfig, structuredClone(config));

	if ((/^[^\d+]$/).test(config$1.port) && config$1.port < 1) {
		console.error("Invalid configuration");
		process.exit(1);
	}

	config$1.webroot.root = resolve(config$1.webroot.root || join(__dirname, "www"));
	config$1.webroot.template = readFileSync(config$1.webroot.template || join(config$1.webroot.root, "template.html"), {encoding: "utf8"});

	if (config$1.silent !== true) {
		config$1.defaultHeaders.server = `tenso/${version}`;
		config$1.defaultHeaders["x-powered-by"] = `nodejs/${process.version}, ${process.platform}/${process.arch}`;
	}

	const app = new Tenso(config$1);

	process.on("SIGTERM", async () => {
		await app.server.close();
		process.exit(0);
	});

	return app.bootstrap().start();
}export{tenso};