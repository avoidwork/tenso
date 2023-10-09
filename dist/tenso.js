/**
 * tenso
 *
 * @copyright 2023 Jason Mulligan <jason.mulligan@avoidwork.com>
 * @license BSD-3-Clause
 * @version 17.0.0
 */
import {Woodland}from'woodland';import defaults from'defaults';import {join}from'node:path';import {fileURLToPath,URL}from'node:url';const __dirname = fileURLToPath(new URL(".", import.meta.url));
const {name, version} = require(join(__dirname, "..", "..", "package.json"));

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
	version
};const parsers = new Map();
const renderers = new Map();
const serializers = new Map();

class Tenso extends Woodland {
	constructor (config$1 = config) {
		super(config$1);
		this.config = config$1;
		this.parsers = parsers;
		this.rates = new Map();
		this.renderers = renderers;
		this.serializers = serializers;
		this.server = null;
		this.version = config$1.version;
	}
}

function tenso (userConfig = {}) {
	return new Tenso(defaults(userConfig, structuredClone(config)));
}export{tenso};