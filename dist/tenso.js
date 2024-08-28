/**
 * tenso
 *
 * @copyright 2024 Jason Mulligan <jason.mulligan@avoidwork.com>
 * @license BSD-3-Clause
 * @version 17.0.0
 */
import {readFileSync}from'node:fs';import http,{STATUS_CODES}from'node:http';import https from'node:https';import {createRequire}from'node:module';import {join,resolve}from'node:path';import {fileURLToPath,URL as URL$1}from'node:url';import {Woodland}from'woodland';import {merge}from'tiny-merge';import {eventsource}from'tiny-eventsource';import {coerce}from'tiny-coerce';import YAML from'yamljs';import {XMLBuilder}from'fast-xml-parser';import {stringify}from'csv-stringify/sync';import {stringify as stringify$1}from'tiny-jsonl';import {keysort}from'keysort';import {URL}from'url';import redis from'ioredis';import cookie from'cookie-parser';import session from'express-session';import passport from'passport';import passportJWT from'passport-jwt';import {BasicStrategy}from'passport-http';import {Strategy}from'passport-http-bearer';import {Strategy as Strategy$1}from'passport-local';import {Strategy as Strategy$2}from'passport-oauth2';import lusca from'lusca';import {randomInt,randomUUID}from'node:crypto';import RedisStore from'connect-redis';const config = {
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
	initRoutes: {},
	jsonIndent: 0,
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
	time: true,
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
	}
};const CALLBACK = "callback";
const COMMA = ",";
const COLON = ":";
const DATA = "data";
const EMPTY = "";
const ENCODED_SPACE = "%20";
const END = "end";
const HEADER_ALLOW_GET = "GET, HEAD, OPTIONS";
const HEADER_APPLICATION_JSON = "application/json";
const HEADER_CONTENT_TYPE = "content-type";
const HTML = "html";
const INT_0 = 0;
const INT_200 = 200;
const INT_204 = 204;
const INT_304 = 304;
const INT_413 = 413;
const INT_429 = 429;
const MULTIPART = "multipart";
const OPTIONS = "OPTIONS";
const RETRY_AFTER = "retry-after";
const UTF8 = "utf8";
const X_CSRF_TOKEN = "x-csrf-token";
const X_RATELIMIT_LIMIT = "x-ratelimit-limit";
const X_RATELIMIT_REMAINING = "x-ratelimit-remaining";
const X_RATELIMIT_RESET = "x-ratelimit-reset";
const X_FORWARDED_PROTO = "x-forwarded-proto";
const SIGHUP = "SIGHUP";
const SIGINT = "SIGINT";
const SIGTERM = "SIGTERM";
const STRING = "string";
const LESS_THAN = "&lt;";
const GREATER_THAN = "&gt;";
const XML_PROLOG = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
const XML_ARRAY_NODE_NAME = "item";
const PROTECT = "protect";
const UNPROTECT = "unprotect";
const FUNCTION = "function";
const CONNECT = "connect";function json$1 (arg = EMPTY) {
	return JSON.parse(arg);
}const bodySplit = /&|=/;
const collection = /(.*)(\/.*)$/;
const hypermedia$1 = /(([a-z]+(_)?)?id|url|uri)$/i;
const mimetype = /;.*/;
const trailing = /_.*$/;
const trailingS = /s$/;
const trailingSlash = /\/$/;
const trailingY = /y$/;function chunk (arg = [], size = 2) {
	const result = [];
	const nth = Math.ceil(arg.length / size);
	let i = 0;

	while (i < nth) {
		result.push(arg.slice(i * size, ++i * size));
	}

	return result;
}function xWwwFormURLEncoded (arg) {
	const args = arg ? chunk(arg.split(bodySplit), 2) : [],
		result = {};

	for (const i of args) {
		result[decodeURIComponent(i[0].replace(/\+/g, ENCODED_SPACE))] = coerce(decodeURIComponent(i[1].replace(/\+/g, ENCODED_SPACE)));
	}

	return result;
}const parsers = new Map([
	[
		"application/x-www-form-urlencoded",
		xWwwFormURLEncoded
	],
	[
		"application/json",
		json$1
	]
]);const str_indent = "indent=";

function indent (arg = "", fallback = 0) {
	return arg.includes(str_indent) ? parseInt(arg.match(/indent=(\d+)/)[1], 10) : fallback;
}function json (req, res, arg) {
	return JSON.stringify(arg, null, indent(req.headers.accept, req.server.jsonIndent));
}function yaml (req, res, arg) {
	return YAML.stringify(arg);
}function xml (req, res, arg) {
	const builder = new XMLBuilder({
		processEntities: true,
		format: true,
		ignoreAttributes: false,
		arrayNodeName: Array.isArray(arg) ? XML_ARRAY_NODE_NAME : undefined
	});

	return `${XML_PROLOG}\n${builder.build({output: arg})}`;
}function plain$1 (req, res, arg) {
	return Array.isArray(arg) ? arg.map(i => text(req, res, i)).join(COMMA) : arg instanceof Object ? JSON.stringify(arg, null, indent(req.headers.accept, req.server.json)) : arg.toString()
}function javascript (req, res, arg) {
	req.headers.accept = HEADER_APPLICATION_JSON;
	res.header(HEADER_CONTENT_TYPE, HEADER_APPLICATION_JSON);

	return `${req.parsed.searchParams.get(CALLBACK) ?? CALLBACK}(${JSON.stringify(arg, null, INT_0)});`;
}function csv (req, res, arg) {
	return stringify(Array.isArray(arg) ? arg : [arg], {
		cast: {
			boolean: value => value ? "true" : "false",
			date: value => value.toISOString(),
			number: value => value.toString()
		},
		delimiter: ",",
		header: true,
		quoted: false
	});
}function explode (arg = "", delimiter = ",") {
	return arg.trim().split(new RegExp(`\\s*${delimiter}\\s*`));
}function sanitize (arg) {
	return typeof arg === STRING ? arg.replace(/</g, LESS_THAN).replace(/>/g, GREATER_THAN) : arg;
}function html (req, res, arg, tpl = "") {
	const protocol = X_FORWARDED_PROTO in req.headers ? req.headers[X_FORWARDED_PROTO] + COLON : req.parsed.protocol,
		headers = res.getHeaders();

	return tpl.length > 0 ? tpl.replace(/\{\{title\}\}/g, req.server.title)
		.replace("{{url}}", req.parsed.href.replace(req.parsed.protocol, protocol))
		.replace("{{headers}}", Object.keys(headers).sort().map(i => `<tr><td>${i}</td><td>${sanitize(headers[i])}</td></tr>`).join("\n"))
		.replace("{{formats}}", `<option value=''></option>${Array.from(renderers.keys()).filter(i => i.indexOf(HTML) === -1).map(i => `<option value='${i.trim()}'>${i.replace(/^.*\//, "").toUpperCase()}</option>`).join("\n")}`)
		.replace("{{body}}", sanitize(JSON.stringify(arg, null, 2)))
		.replace("{{year}}", new Date().getFullYear())
		.replace("{{version}}", req.server.version)
		.replace("{{allow}}", headers.allow)
		.replace("{{methods}}", explode((headers?.allow ?? EMPTY).replace(HEADER_ALLOW_GET, EMPTY)).filter(i => i !== EMPTY).map(i => `<option value='${i.trim()}'>$i.trim()}</option>`).join("\n"))
		.replace("{{csrf}}", headers?.[X_CSRF_TOKEN] ?? EMPTY)
		.replace("class=\"headers", req.server.renderHeaders === false ? "class=\"headers dr-hidden" : "class=\"headers") : EMPTY;
}function jsonl (req, res, arg) {
	return stringify$1(arg);
}const renderers = new Map([
	["application/json", json],
	["application/yaml", yaml],
	["application/xml", xml],
	["text/plain", plain$1],
	["application/javascript", javascript],
	["text/csv", csv],
	["text/html", html],
	["application/json-lines", jsonl],
	["application/jsonl", jsonl],
	["text/jsonl", jsonl]
]);function custom (arg, err, status = INT_200, stack = false) {
	return {
		data: arg,
		error: err !== null ? (stack ? err.stack : err.message) || err || STATUS_CODES[status] : null,
		links: [],
		status: status
	};
}function plain (arg, err, status = INT_200, stack = false) {
	return err !== null ? (stack ? err.stack : err.message) || err || STATUS_CODES[status] : arg;
}const serializers = new Map([
	["application/json", custom],
	["application/yaml", custom],
	["application/xml", custom],
	["text/plain", plain],
	["application/javascript", custom],
	["text/csv", custom],
	["text/html", custom]
]);function hasBody (arg) {
	return arg.includes("PATCH") || arg.includes("POST") || arg.includes("PUT");
}const clone = arg => JSON.parse(JSON.stringify(arg));function sort (arg, req) {
	let output = clone(arg);

	if (typeof req.parsed.search === "string" && req.parsed.searchParams.has("order_by") && Array.isArray(arg)) {
		const type = typeof arg[0];

		if (type !== "boolean" && type !== "number" && type !== "string" && type !== "undefined" && arg[0] !== null) {
			const args = req.parsed.searchParams.getAll("order_by").filter(i => i !== "desc").join(", ");

			if (args.length > 0) {
				output = keysort(output, args);
			}
		}

		if (req.parsed.search.includes("order_by=desc")) {
			output = output.reverse();
		}
	}

	return output;
}function serialize (req, res, arg) {
	const status = res.statusCode;
	let format = req.server.mimeType,
		accepts = explode(req.parsed.searchParams.get("format") || req.headers.accept || res.getHeader("content-type") || format, ","),
		errz = arg instanceof Error || status >= 400,
		result, serializer;

	for (const i of accepts) {
		let mimetype$1 = i.replace(mimetype, "");

		if (serializers.has(mimetype$1)) {
			format = mimetype$1;
			break;
		}
	}

	serializer = serializers.get(format);
	res.removeHeader("content-type");
	res.header("content-type", `${format}; charset=utf-8`);

	if (errz) {
		result = serializer(null, arg, status < 400 ? 500 : status, req.server.logging.stackWire);
	} else {
		result = serializer(sort(arg, req), null, status);
	}

	return result;
}const str_id = "id";
const str_id_2 = "_id";
const str_id_3 = "ID";
const str_id_4 = "_ID";

function id (arg = "") {
	return arg === str_id || arg === str_id_2 || arg === str_id_3 || arg === str_id_4;
}const str_slash = "/";
const str_scheme = "://";

function scheme (arg = "") {
	return arg.includes(str_slash) || arg[0] === str_scheme;
}function hypermedia (req, res, rep) {
	const server = req.server,
		headers = res.getHeaders(),
		collection$1 = req.parsed.pathname,
		links = [],
		seen = new Set(),
		exists = rep !== null;
	let query, page, page_size, nth, root, parent;

	// Parsing the object for hypermedia properties
	function marshal (obj, rel, item_collection) {
		let keys = Object.keys(obj),
			lrel = rel || "related",
			result;

		if (keys.length === 0) {
			result = null;
		} else {
			for (const i of keys) {
				if (obj[i] !== void 0 && obj[i] !== null) {
					const lid = id(i);
					let lcollection, uri;

					// If ID like keys are found, and are not URIs, they are assumed to be root collections
					if (lid || hypermedia$1.test(i)) {
						const lkey = obj[i].toString();

						if (lid === false) {
							lcollection = i.replace(trailing, "").replace(trailingS, "").replace(trailingY, "ie") + "s";
							lrel = "related";
						} else {
							lcollection = item_collection;
							lrel = "item";
						}

						if (scheme(lkey) === false) {
							uri = `${lcollection[0] === "/" ? "" : "/"}${lcollection.replace(/\s/g, "%20")}/${lkey.replace(/\s/g, "%20")}`;

							if (uri !== root && seen.has(uri) === false) {
								seen.add(uri);

								if (server.allowed("GET", uri)) {
									links.push({uri: uri, rel: lrel});
								}
							}
						}
					}
				}
			}

			result = obj;
		}

		return result;
	}

	query = req.parsed.searchParams;
	page = Number(query.get("page")) || 1;
	page_size = Number(query.get("page_size")) || server.pageSize || 5;

	if (page < 1) {
		page = 1;
	}

	if (page_size < 1) {
		page_size = server.pageSize || 5;
	}

	root = new URL(`http://127.0.0.1${req.parsed.pathname}${req.parsed.search}`);
	root.searchParams.delete("page");
	root.searchParams.delete("page_size");

	if (root.pathname !== "/") {
		const proot = root.pathname.replace(trailingSlash, "").replace(collection, "$1") || "/";

		if (server.allowed("GET", proot)) {
			links.push({uri: proot, rel: "collection"});
			seen.add(proot);
		}
	}

	if (exists) {
		if (Array.isArray(rep.data)) {
			if (req.method === "GET" && (rep.status >= 200 && rep.status <= 206)) {
				if (isNaN(page) || page <= 0) {
					page = 1;
				}

				nth = Math.ceil(rep.data.length / page_size);

				if (nth > 1) {
					const start = (page - 1) * page_size,
						end = start + page_size;

					rep.data = rep.data.slice(start, end);
					root.searchParams.set("page", 0);
					root.searchParams.set("page_size", page_size);

					if (page > 1) {
						root.searchParams.set("page", 1);
						links.push({uri: `${root.pathname}${root.search}`, rel: "first"});
					}

					if (page - 1 > 1 && page <= nth) {
						root.searchParams.set("page", page - 1);
						links.push({uri: `${root.pathname}${root.search}`, rel: "prev"});
					}

					if (page + 1 < nth) {
						root.searchParams.set("page", page + 1);
						links.push({uri: `${root.pathname}${root.search}`, rel: "next"});
					}

					if (nth > 0 && page !== nth) {
						root.searchParams.set("page", nth);
						links.push({uri: `${root.pathname}${root.search}`, rel: "last"});
					}
				}
			}

			if (req.hypermedia) {
				for (const i of rep.data) {
					if (i instanceof Object) {
						marshal(i, "item", req.parsed.pathname.replace(trailingSlash, ""));
					} else {
						const li = i.toString();

						if (li !== collection$1) {
							const uri = li.indexOf("//") >= 0 ? li : `${collection$1.replace(/\s/g, "%20")}/${li.replace(/\s/g, "%20")}`.replace(/^\/\//, "/");

							if (server.allowed("GET", uri)) {
								links.push({uri: uri, rel: "item"});
							}
						}
					}
				}
			}
		} else if (rep.data instanceof Object && req.hypermedia) {
			parent = req.parsed.pathname.split("/").filter(i => i !== "");

			if (parent.length > 1) {
				parent.pop();
			}

			rep.data = marshal(rep.data, void 0, parent[parent.length - 1]);
		}
	}

	if (links.length > 0) {
		if (headers.link !== void 0) {
			for (const i of headers.link.split('" <')) {
				links.push({
					uri: i.replace(/(^\<|\>.*$)/g, ""),
					rel: i.replace(/(^.*rel\=\"|\"$)/g, "")
				});
			}
		}

		res.header("link", keysort(links, "rel, uri").map(i => `<${i.uri}>; rel="${i.rel}"`).join(", "));

		if (exists && rep.links !== void 0) {
			rep.links = links;
		}
	}

	return rep;
}function payload (req, res, next) {
	if (hasBody(req.method) && req.headers?.[HEADER_CONTENT_TYPE]?.includes(MULTIPART) === false) {
		const max = req.server.maxBytes;
		let body = EMPTY,
			invalid = false;

		req.setEncoding(UTF8);

		req.on(DATA, data => {
			if (invalid === false) {
				body += data;

				if (max > 0 && Buffer.byteLength(body) > max) {
					invalid = true;
					res.error(INT_413);
				}
			}
		});

		req.on(END, () => {
			if (invalid === false) {
				req.body = body;
				next();
			}
		});
	} else {
		next();
	}
}function parse (req, res, next) {
	let valid = true,
		exception;

	if (req.body !== "") {
		const type = req.headers?.[HEADER_CONTENT_TYPE]?.replace(/\s.*$/, EMPTY) ?? EMPTY;
		const parsers = req.server.parsers;

		if (type.length > 0 && parsers.has(type)) {
			try {
				req.body = parsers.get(type)(req.body);
			} catch (err) {
				valid = false;
				exception = err;
			}
		}
	}

	next(valid === false ? exception : void 0);
}function asyncFlag (req, res, next) {
	req.protectAsync = true;
	next();
}function bypass (req, res, next) {
	req.unprotect = req.cors && req.method === OPTIONS || req.server.auth.unprotect.some(i => i.test(req.url));
	next();
}let memoized = false,
	cachedFn, cachedKey;

function csrfWrapper (req, res, next) {
	if (memoized === false) {
		cachedKey = req.server.security.key;
		cachedFn = lusca.csrf({key: cachedKey, secret: req.server.security.secret});
		memoized = true;
	}

	if (req.unprotect) {
		next();
	} else {
		cachedFn(req, res, err => {
			if (err === void 0 && req.csrf && cachedKey in res.locals) {
				res.header(req.server.security.key, res.locals[cachedKey]);
			}

			next(err);
		});
	}
}function guard (req, res, next) {
	const login = req.server.auth.uri.login;

	if (req.parsed.pathname === login || req.isAuthenticated()) {
		next();
	} else {
		res.error(401);
	}
}function redirect (req, res) {
	res.redirect(req.config.auth.uri.redirect, false);
}const rateHeaders = [
	X_RATELIMIT_LIMIT,
	X_RATELIMIT_REMAINING,
	X_RATELIMIT_RESET
];

function rate (req, res, next) {
	const config = req.server.rate;

	if (config.enabled === false || req.unprotect) {
		next();
	} else {
		const results = req.server.rate(req, config.override),
			good = results.shift();

		if (good) {
			for (const [idx, i] of rateHeaders.entries()) {
				res.header(i, results[idx]);
			}

			next();
		} else {
			res.header(RETRY_AFTER, config.reset);
			res.error(config.status || INT_429);
		}
	}
}function keymaster (req, res) {
	if (req.protect === false || req.protectAsync === false || req.session !== void 0 && req.isAuthenticated()) {
		req.exit();
	} else {
		res.error(401);
	}
}function zuul (req, res, next) {
	const uri = req.parsed.pathname;
	let protect = false;

	if (req.unprotect === false) {
		for (const i of req.server.auth.protect) {
			if (i.test(uri)) {
				protect = true;
				break;
			}
		}
	}

	// Setting state so the connection can be terminated properly
	req.protect = protect;
	req.protectAsync = false;

	rate(req, res, e => {
		if (e !== void 0) {
			res.error(e);
		} else if (protect) {
			next();
		} else {
			keymaster(req, res);
		}
	});
}function random (n = 1e2) {
	return randomInt(1, n);
}function delay (fn = () => void 0, n = 0) {
	if (n === 0) {
		fn();
	} else {
		setTimeout(fn, random(n));
	}
}function isEmpty (arg = EMPTY) {
	return arg === EMPTY;
}// @todo audit redis
// @todo audit the function - it's probably too complex

const {Strategy: JWTStrategy, ExtractJwt} = passportJWT,
	groups = [PROTECT, UNPROTECT];

function auth (obj) {
	const ssl = obj.ssl.cert && obj.ssl.key,
		realm = `http${ssl ? "s" : ""}://${obj.host}${obj.port !== 80 && obj.port !== 443 ? ":" + obj.port : ""}`,
		async = obj.auth.oauth2.enabled || obj.auth.saml.enabled,
		stateless = obj.rate.enabled === false && obj.security.csrf === false && obj.auth.local.enabled === false,
		authDelay = obj.auth.delay,
		authMap = {},
		authUris = [];

	let sesh, fnCookie, fnSession, passportInit, passportSession;

	obj.ignore(asyncFlag);

	for (const k of groups) {
		obj.auth[k] = (obj.auth[k] || []).map(i => new RegExp(`^${i !== obj.auth.uri.login ? i.replace(/\.\*/g, "*").replace(/\*/g, ".*") : ""}(\/|$)`, "i"));
	}

	for (const i of Object.keys(obj.auth)) {
		if (obj.auth[i].enabled) {
			authMap[`${i}_uri`] = `/auth/${i}`;
			authUris.push(`/auth/${i}`);
			obj.auth.protect.push(new RegExp(`^/auth/${i}(/|$)`));
		}
	}

	if (obj.auth.local.enabled) {
		authUris.push(obj.auth.uri.redirect);
		authUris.push(obj.auth.uri.login);
	}

	if (stateless === false) {
		const objSession = clone(obj.session);

		delete objSession.redis;
		delete objSession.store;

		sesh = Object.assign({secret: randomUUID()}, objSession);

		if (obj.session.store === "redis") {
			const client = redis.createClient(clone(obj.session.redis));

			sesh.store = new RedisStore({client});
		}

		fnCookie = cookie();
		fnSession = session(sesh);

		obj.always(fnCookie).ignore(fnCookie);
		obj.always(fnSession).ignore(fnSession);
		obj.always(bypass).ignore(bypass);

		if (obj.security.csrf) {
			obj.always(csrfWrapper).ignore(csrfWrapper);
		}
	}

	if (obj.security.csp instanceof Object) {
		const luscaCsp = lusca.csp(obj.security.csp);

		obj.always(luscaCsp).ignore(luscaCsp);
	}

	if (isEmpty(obj.security.xframe || "") === false) {
		const luscaXframe = lusca.xframe(obj.security.xframe);

		obj.always(luscaXframe).ignore(luscaXframe);
	}

	if (isEmpty(obj.security.p3p || "") === false) {
		const luscaP3p = lusca.p3p(obj.security.p3p);

		obj.always(luscaP3p).ignore(luscaP3p);
	}

	if (obj.security.hsts instanceof Object) {
		const luscaHsts = lusca.hsts(obj.security.hsts);

		obj.always(luscaHsts).ignore(luscaHsts);
	}

	if (obj.security.xssProtection) {
		const luscaXssProtection = lusca.xssProtection(obj.security.xssProtection);

		obj.always(luscaXssProtection).ignore(luscaXssProtection);
	}

	if (obj.security.nosniff) {
		const luscaNoSniff = lusca.nosniff();

		obj.always(luscaNoSniff).ignore(luscaNoSniff);
	}

	// Can fork to `middleware.keymaster()`
	obj.always(zuul).ignore(zuul);

	passportInit = passport.initialize();
	obj.always(passportInit).ignore(passportInit);

	if (stateless === false) {
		passportSession = passport.session();
		obj.always(passportSession).ignore(passportSession);
	}

	passport.serializeUser((user, done) => done(null, user));
	passport.deserializeUser((arg, done) => done(null, arg));

	if (obj.auth.basic.enabled) {
		let x = {};

		const validate = (arg, cb) => {
			if (x[arg] !== void 0) {
				cb(null, x[arg]);
			} else {
				cb(new Error(STATUS_CODES[401]), null);
			}
		};

		for (const i of obj.auth.basic.list || []) {
			let args = i.split(":");

			if (args.length > 0) {
				x[args[0]] = {password: args[1]};
			}
		}

		passport.use(new BasicStrategy((username, password, done) => {
			delay(() => {
				validate(username, (err, user) => {
					if (err !== null) {
						return done(err);
					}

					if (user === void 0 || user.password !== password) {
						return done(null, false);
					}

					return done(null, user);
				});
			}, authDelay);
		}));

		const passportAuth = passport.authenticate("basic", {session: stateless === false});

		if (async || obj.auth.local.enabled) {
			obj.get("/auth/basic", passportAuth).ignore(passportAuth);
			obj.get("/auth/basic", redirect);
		} else {
			obj.always(passportAuth).ignore(passportAuth);
		}
	} else if (obj.auth.bearer.enabled) {
		const validate = (arg, cb) => {
			if (obj.obj.auth.bearer.tokens.includes(arg)) {
				cb(null, arg);
			} else {
				cb(new Error(STATUS_CODES[401]), null);
			}
		};

		passport.use(new Strategy((token, done) => {
			delay(() => {
				validate(token, (err, user) => {
					if (err !== null) {
						done(err);
					} else if (user === void 0) {
						done(null, false);
					} else {
						done(null, user, {scope: "read"});
					}
				});
			}, authDelay);
		}));

		const passportAuth = passport.authenticate("bearer", {session: stateless === false});

		if (async || obj.auth.local.enabled) {
			obj.get("/auth/bearer", passportAuth).ignore(passportAuth);
			obj.get("/auth/bearer", redirect);
		} else {
			obj.always(passportAuth).ignore(passportAuth);
		}
	} else if (obj.auth.jwt.enabled) {
		const opts = {
			jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme(obj.auth.jwt.scheme),
			secretOrKey: obj.auth.jwt.secretOrKey,
			ignoreExpiration: obj.auth.jwt.ignoreExpiration === true
		};

		for (const i of ["algorithms", "audience", "issuer"]) {
			if (obj.auth.jwt[i] !== void 0) {
				opts[i] = obj.auth.jwt[i];
			}
		}

		passport.use(new JWTStrategy(opts, (token, done) => {
			delay(() => {
				obj.auth.jwt.auth(token, (err, user) => {
					if (err !== null) {
						done(err);
					} else {
						done(null, user);
					}
				});
			}, authDelay);
		}));

		const passportAuth = passport.authenticate("jwt", {session: false});
		obj.always(passportAuth).ignore(passportAuth);
	} else if (obj.auth.local.enabled) {
		passport.use(new Strategy$1((username, password, done) => {
			delay(() => {
				obj.auth.local.auth(username, password, (err, user) => {
					if (err !== null) {
						done(err);
					} else {
						done(null, user);
					}
				});
			}, authDelay);
		}));

		obj.post(obj.auth.uri.login, (req, res) => {
			function final () {
				passport.authenticate("local")(req, res, e => {
					if (e !== void 0) {
						res.error(401, STATUS_CODES[401]);
					} else if (req.cors && req.headers["x-requested-with"] === "XMLHttpRequest") {
						res.send("Success");
					} else {
						redirect(req, res);
					}
				});
			}

			function mid () {
				passportSession(req, res, final);
			}

			passportInit(req, res, mid);
		});
	} else if (obj.auth.oauth2.enabled) {
		passport.use(new Strategy$2({
			authorizationURL: obj.auth.oauth2.auth_url,
			tokenURL: obj.auth.oauth2.token_url,
			clientID: obj.auth.oauth2.client_id,
			clientSecret: obj.auth.oauth2.client_secret,
			callbackURL: `${realm}/auth/oauth2/callback`
		}, (accessToken, refreshToken, profile, done) => {
			delay(() => {
				obj.auth.oauth2.auth(accessToken, refreshToken, profile, (err, user) => {
					if (err !== null) {
						done(err);
					} else {
						done(null, user);
					}
				});
			}, authDelay);
		}));

		obj.get("/auth/oauth2", asyncFlag);
		obj.get("/auth/oauth2", passport.authenticate("oauth2"));
		obj.get("/auth/oauth2/callback", asyncFlag);
		obj.get("/auth/oauth2/callback", passport.authenticate("oauth2", {failureRedirect: obj.auth.uri.login}));
		obj.get("/auth/oauth2/callback", redirect);
	}

	if (authUris.length > 0) {
		if (Object.keys(authMap).length > 0) {
			obj.get(obj.auth.uri.root, authMap);
		}

		let r = `(?!${obj.auth.uri.root}/(`;

		for (const i of authUris) {
			r += i.replace("_uri", "") + "|";
		}

		r = r.replace(/\|$/, "") + ")).*$";
		obj.always(r, guard).ignore(guard);

		obj.get(obj.auth.uri.login, (req, res) => res.json({instruction: obj.auth.msg.login}));
	} else if (obj.auth.local.enabled) {
		obj.get(obj.auth.uri.login, (req, res) => res.json({instruction: obj.auth.msg.login}));
	}

	obj.get(obj.auth.uri.logout, (req, res) => {
		if (req.session !== void 0) {
			req.session.destroy();
		}

		redirect(req, res);
	});

	return obj;
}const __dirname = fileURLToPath(new URL$1(".", import.meta.url));
const require = createRequire(import.meta.url);
const {name, version} = require(join(__dirname, "..", "package.json"));

class Tenso extends Woodland {
	constructor (config$1 = config) {
		super(config$1);

		for (const [key, value] of Object.entries(config$1)) {
			if (key in this === false) {
				this[key] = value;
			}
		}

		this.parsers = parsers;
		this.rates = new Map();
		this.renderers = renderers;
		this.serializers = serializers;
		this.server = null;
		this.version = config$1.version;
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
		const authorization = Object.keys(this.auth).filter(i => this.auth?.[i]?.enabled === true).length > 0 || this.rate.enabled || this.security.csrf;

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
				if (typeof target === FUNCTION) {
					this[method](route, target);
				} else {
					this[method](route, (req, res) => res.send(target));
				}
			}
		}

		delete this.initRoutes;

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

			if (this.renderers.has(lmimetype)) {
				format = lmimetype;
				break;
			}
		}

		if (format.length === 0) {
			format = this.mimeType;
		}

		renderer = this.renderers.get(format);
		res.header("content-type", format);
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
					cert: this.ssl.cert ? readFileSync(this.ssl.cert) : void 0,
					pfx: this.ssl.pfx ? readFileSync(this.ssl.pfx) : void 0,
					key: this.ssl.key ? readFileSync(this.ssl.key) : void 0,
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

function tenso (userConfig = {}) {
	const config$1 = merge(clone(config), userConfig);

	if ((/^[^\d+]$/).test(config$1.port) && config$1.port < 1) {
		console.error("Invalid configuration");
		process.exit(1);
	}

	config$1.title = name;
	config$1.version = version;
	config$1.webroot.root = resolve(config$1.webroot.root || join(__dirname, "..", "www"));
	config$1.webroot.template = readFileSync(config$1.webroot.template || join(config$1.webroot.root, "template.html"), {encoding: "utf8"});

	if (config$1.silent !== true) {
		config$1.defaultHeaders.server = `tenso/${config$1.version}`;
		config$1.defaultHeaders["x-powered-by"] = `nodejs/${process.version}, ${process.platform}/${process.arch}`;
	}

	const app = new Tenso(config$1);

	return app.init();
}export{tenso};