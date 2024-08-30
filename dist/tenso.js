/**
 * tenso
 *
 * @copyright 2024 Jason Mulligan <jason.mulligan@avoidwork.com>
 * @license BSD-3-Clause
 * @version 17.0.4
 */
import {readFileSync}from'node:fs';import http,{STATUS_CODES}from'node:http';import https from'node:https';import {createRequire}from'node:module';import {join,resolve}from'node:path';import {fileURLToPath,URL as URL$1}from'node:url';import {Woodland}from'woodland';import {merge}from'tiny-merge';import {eventsource}from'tiny-eventsource';import {parse as parse$1,stringify as stringify$1}from'tiny-jsonl';import {coerce}from'tiny-coerce';import YAML from'yamljs';import {XMLBuilder}from'fast-xml-parser';import {stringify}from'csv-stringify/sync';import {keysort}from'keysort';import {URL}from'url';import promBundle from'express-prom-bundle';import redis from'ioredis';import cookie from'cookie-parser';import session from'express-session';import passport from'passport';import passportJWT from'passport-jwt';import {BasicStrategy}from'passport-http';import {Strategy}from'passport-http-bearer';import {Strategy as Strategy$1}from'passport-oauth2';import lusca from'lusca';import {randomInt,randomUUID}from'node:crypto';import RedisStore from'connect-redis';const ACCESS_CONTROL = "access-control";
const ALGORITHMS = "algorithms";
const ALLOW = "allow";
const AUDIENCE = "audience";
const AUTH = "auth";
const AUTO = "auto";
const BASIC = "basic";
const BEARER = "Bearer";
const BOOLEAN = "boolean";
const CACHE_CONTROL = "cache-control";
const CALLBACK = "callback";
const CHARSET_UTF8 = "; charset=utf-8";
const COLLECTION = "collection";
const COLON = ":";
const COMMA = ",";
const COMMA_SPACE$1 = ", ";
const CONNECT = "connect";
const COOKIE_NAME = "tenso.sid";
const DATA = "data";
const DEBUG = "debug";
const DEFAULT_CONTENT_TYPE = "application/json; charset=utf-8";
const DEFAULT_VARY = "accept, accept-encoding, accept-language, origin";
const DELETE = "DELETE";
const DESC = "desc";
const DOUBLE_SLASH = "//";
const EMPTY = "";
const ENCODED_SPACE = "%20";
const END = "end";
const EQ = "=";
const EXPOSE = "expose";
const EXPOSE_HEADERS = "cache-control, content-language, content-type, expires, last-modified, pragma";
const FALSE = "false";
const FIRST = "first";
const FORMAT = "format";
const FUNCTION = "function";
const G = "g";
const GET = "GET";
const GT = "&gt;";
const HEADERS = "headers";
const HEADER_ALLOW_GET = "GET, HEAD, OPTIONS";
const HEADER_APPLICATION_JAVASCRIPT = "application/javascript";
const HEADER_APPLICATION_JSON = "application/json";
const HEADER_APPLICATION_JSONL = "application/jsonl";
const HEADER_APPLICATION_JSON_LINES = "application/json-lines";
const HEADER_APPLICATION_XML = "application/xml";
const HEADER_APPLICATION_X_WWW_FORM_URLENCODED = "application/x-www-form-urlencoded";
const HEADER_APPLICATION_YAML = "application/yaml";
const HEADER_CONTENT_DISPOSITION = "content-disposition";
const HEADER_CONTENT_DISPOSITION_VALUE = "attachment; filename=\"download.csv\"";
const HEADER_CONTENT_TYPE = "content-type";
const HEADER_SPLIT = "\" <";
const HEADER_TEXT_CSV = "text/csv";
const HEADER_TEXT_HTML = "text/html";
const HEADER_TEXT_JSON_LINES = "text/json-lines";
const HEADER_TEXT_PLAIN = "text/plain";
const HEADER_VARY = "vary";
const HS256 = "HS256";
const HS384 = "HS384";
const HS512 = "HS512";
const HTML = "html";
const HYPHEN = "-";
const I = "i";
const ID = "id";
const IDENT_VAR = "indent=";
const ID_2 = "_id";
const IE = "ie";
const INT_0 = 0;
const INT_1 = 1;
const INT_10 = 10;
const INT_100 = 1e2;
const INT_1000 = 1e3;
const INT_2 = 2;
const INT_200 = 2e2;
const INT_204 = 204;
const INT_206 = 206;
const INT_3 = 3;
const INT_300000 = 3e5;
const INT_304 = 304;
const INT_400 = 4e2;
const INT_401 = 401;
const INT_413 = 413;
const INT_429 = 429;
const INT_443 = 443;
const INT_450 = 450;
const INT_5 = 5;
const INT_500 = 5e2;
const INT_6379 = 6379;
const INT_80 = 80;
const INT_8000 = 8e3;
const INT_900 = 9e2;
const INT_NEG_1 = -1;
const INVALID_CONFIGURATION = "Invalid configuration";
const IP_0000 = "0.0.0.0";
const IP_127001 = "127.0.0.1";
const ISSUER = "issuer";
const ITEM = "item";
const JWT = "jwt";
const LAST = "last";
const LT = "&lt;";
const LINK = "link";
const LOG_FORMAT = "%h %l %u %t \"%r\" %>s %b";
const MEMORY = "memory";
const METRICS_PATH = "/metrics";
const MSG_LOGIN = "POST 'username' & 'password' to authenticate";
const MSG_PROMETHEUS_ENABLED = "Prometheus metrics enabled";
const MSG_TOO_MANY_REQUESTS = "Too many requests";
const MULTIPART = "multipart";
const NEXT = "next";
const NL = "\n";
const NULL = "null";
const NUMBER = "number";
const OAUTH2 = "oauth2";
const OPTIONS = "OPTIONS";
const ORDER_BY = "order_by";
const PAGE = "page";
const PAGE_SIZE = "page_size";
const PATCH = "PATCH";
const PATH_ASSETS = "/assets";
const PERIOD = ".";
const PIPE = "|";
const POST = "POST";
const PREV = "prev";
const PREV_DIR = "..";
const PRIVATE = "private";
const PROTECT = "protect";
const PUT = "PUT";
const READ = "read";
const REDIS = "redis";
const REGEX_REPLACE = ")).*$";
const RELATED = "related";
const REL_URI = "rel, uri";
const RETRY_AFTER = "retry-after";
const S = "s";
const SAMEORIGIN = "SAMEORIGIN";
const SESSION_SECRET = "tensoABC";
const SIGHUP = "SIGHUP";
const SIGINT = "SIGINT";
const SIGTERM = "SIGTERM";
const SLASH = "/";
const SPACE = " ";
const STRING = "string";
const TEMPLATE_ALLOW = "{{allow}}";
const TEMPLATE_BODY = "{{body}}";
const TEMPLATE_CSRF = "{{csrf}}";
const TEMPLATE_FILE = "template.html";
const TEMPLATE_FORMATS = "{{formats}}";
const TEMPLATE_HEADERS = "{{headers}}";
const TEMPLATE_METHODS = "{{methods}}";
const TEMPLATE_TITLE = "{{title}}";
const TEMPLATE_URL = "{{url}}";
const TEMPLATE_VERSION = "{{version}}";
const TEMPLATE_YEAR = "{{year}}";
const TENSO = "tenso";
const TRUE = "true";
const UNDEFINED = "undefined";
const UNDERSCORE = "_";
const UNPROTECT = "unprotect";
const URI = "uri";
const URI_SCHEME = "://";
const URL_127001 = "http://127.0.0.1";
const URL_AUTH_LOGIN = "/auth/login";
const URL_AUTH_LOGOUT = "/auth/logout";
const URL_AUTH_ROOT = "/auth";
const UTF8 = "utf8";
const UTF_8 = "utf-8";
const WILDCARD = "*";
const WWW = "www";
const XML_ARRAY_NODE_NAME = "item";
const XML_PROLOG = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
const X_CSRF_TOKEN = "x-csrf-token";
const X_FORWARDED_PROTO = "x-forwarded-proto";
const X_POWERED_BY = "x-powered-by";
const X_RATELIMIT_LIMIT = "x-ratelimit-limit";
const X_RATELIMIT_REMAINING = "x-ratelimit-remaining";
const X_RATELIMIT_RESET = "x-ratelimit-reset";const config = {
	auth: {
		delay: INT_0,
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
			audience: EMPTY,
			algorithms: [
				HS256,
				HS384,
				HS512
			],
			ignoreExpiration: false,
			issuer: EMPTY,
			scheme: BEARER,
			secretOrKey: EMPTY
		},
		msg: {
			login: MSG_LOGIN
		},
		oauth2: {
			enabled: false,
			auth: null,
			auth_url: EMPTY,
			token_url: EMPTY,
			client_id: EMPTY,
			client_secret: EMPTY
		},
		uri: {
			login: URL_AUTH_LOGIN,
			logout: URL_AUTH_LOGOUT,
			redirect: SLASH,
			root: URL_AUTH_ROOT
		},
		saml: {
			enabled: false,
			auth: null
		}
	},
	autoindex: false,
	cacheSize: INT_1000,
	cacheTTL: INT_300000,
	catchAll: true,
	charset: UTF_8,
	corsExpose: EXPOSE_HEADERS,
	defaultHeaders: {
		[HEADER_CONTENT_TYPE]: DEFAULT_CONTENT_TYPE,
		[HEADER_VARY]: DEFAULT_VARY
	},
	digit: INT_3,
	etags: true,
	host: IP_0000,
	index: [],
	initRoutes: {},
	jsonIndent: INT_0,
	logging: {
		enabled: true,
		format: LOG_FORMAT,
		level: DEBUG,
		stack: true
	},
	maxBytes: INT_0,
	mimeType: HEADER_APPLICATION_JSON,
	origins: [WILDCARD],
	pageSize: INT_5,
	port: INT_8000,
	prometheus: {
		enabled: true,
		metrics: {
			includeMethod: true,
			includePath: true,
			includeStatusCode: true,
			includeUp: true,
			buckets: [0.001, 0.01, 0.1, 1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 35, 40, 50, 70, 100, 200],
			customLabels: { model: "No" }
		}
	},
	rate: {
		enabled: false,
		limit: INT_450,
		message: MSG_TOO_MANY_REQUESTS,
		override: null,
		reset: INT_900,
		status: INT_429
	},
	renderHeaders: true,
	time: true,
	security: {
		key: X_CSRF_TOKEN,
		secret: TENSO,
		csrf: true,
		csp: null,
		xframe: SAMEORIGIN,
		p3p: EMPTY,
		hsts: null,
		xssProtection: true,
		nosniff: true
	},
	session: {
		cookie: {
			httpOnly: true,
			path: SLASH,
			sameSite: true,
			secure: AUTO
		},
		name: COOKIE_NAME,
		proxy: true,
		redis: {
			host: IP_127001,
			port: INT_6379
		},
		rolling: true,
		resave: true,
		saveUninitialized: true,
		secret: SESSION_SECRET,
		store: MEMORY
	},
	silent: false,
	ssl: {
		cert: null,
		key: null,
		pfx: null
	},
	webroot: {
		root: EMPTY,
		static: PATH_ASSETS,
		template: EMPTY
	}
};function json$1 (arg = EMPTY) {
	return JSON.parse(arg);
}function jsonl$1 (arg = EMPTY) {
	return parse$1(arg);
}const bodySplit = /&|=/;
const collection = /(.*)(\/.*)$/;
const hypermedia$1 = /(([a-z]+(_)?)?id|url|uri)$/i;
const mimetype = /;.*/;
const trailing = /_.*$/;
const trailingS = /s$/;
const trailingSlash = /\/$/;
const trailingY = /y$/;function chunk (arg = [], size = INT_2) {
	const result = [];
	const nth = Math.ceil(arg.length / size);
	let i = INT_0;

	while (i < nth) {
		result.push(arg.slice(i * size, ++i * size));
	}

	return result;
}function xWwwFormURLEncoded (arg) {
	const args = arg ? chunk(arg.split(bodySplit), INT_2) : [],
		result = {};

	for (const i of args) {
		result[decodeURIComponent(i[INT_0].replace(/\+/g, ENCODED_SPACE))] = coerce(decodeURIComponent(i[INT_1].replace(/\+/g, ENCODED_SPACE)));
	}

	return result;
}const parsers = new Map([
	[
		HEADER_APPLICATION_X_WWW_FORM_URLENCODED,
		xWwwFormURLEncoded
	],
	[
		HEADER_APPLICATION_JSON,
		json$1
	],
	[
		HEADER_APPLICATION_JSON_LINES,
		jsonl$1
	],
	[
		HEADER_APPLICATION_JSONL,
		jsonl$1
	],
	[
		HEADER_TEXT_JSON_LINES,
		jsonl$1
	]
]);function indent (arg = EMPTY, fallback = INT_0) {
	return arg.includes(IDENT_VAR) ? parseInt(arg.match(/indent=(\d+)/)[INT_1], INT_10) : fallback;
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
	return Array.isArray(arg) ? arg.map(i => plain$1(req, res, i)).join(COMMA) : arg instanceof Object ? JSON.stringify(arg, null, indent(req.headers.accept, req.server.json)) : arg.toString();
}function javascript (req, res, arg) {
	req.headers.accept = HEADER_APPLICATION_JAVASCRIPT;
	res.header(HEADER_CONTENT_TYPE, HEADER_APPLICATION_JAVASCRIPT);

	return `${req.parsed.searchParams.get(CALLBACK) ?? CALLBACK}(${JSON.stringify(arg, null, INT_0)});`;
}function csv (req, res, arg) {
	const filename = req.parsed.pathname.split("/").pop().split(".")[0];
	const input = res.statusCode < 400 ? Array.isArray(arg) ? arg : [arg] : [{Error: arg}];

	res.header(HEADER_CONTENT_DISPOSITION, HEADER_CONTENT_DISPOSITION_VALUE.replace("download", filename));

	return stringify(input, {
		cast: {
			boolean: value => value ? TRUE : FALSE,
			date: value => value.toISOString(),
			number: value => value.toString()
		},
		delimiter: COMMA,
		header: true,
		quoted: false
	});
}function explode (arg = EMPTY, delimiter = COMMA) {
	return arg.trim().split(new RegExp(`\\s*${delimiter}\\s*`));
}function sanitize (arg) {
	return typeof arg === STRING ? arg.replace(/</g, LT).replace(/>/g, GT) : arg;
}function html (req, res, arg, tpl = EMPTY) {
	const protocol = X_FORWARDED_PROTO in req.headers ? req.headers[X_FORWARDED_PROTO] + COLON : req.parsed.protocol,
		headers = res.getHeaders();

	return tpl.length > INT_0 ? tpl.replace(new RegExp(TEMPLATE_TITLE, G), req.server.title)
		.replace(TEMPLATE_URL, req.parsed.href.replace(req.parsed.protocol, protocol))
		.replace(TEMPLATE_HEADERS, Object.keys(headers).sort().map(i => `<tr><td>${i}</td><td>${sanitize(headers[i])}</td></tr>`).join(NL))
		.replace(TEMPLATE_FORMATS, `<option value=''></option>${Array.from(renderers.keys()).filter(i => i.indexOf(HTML) === INT_NEG_1).map(i => `<option value='${i.trim()}'>${i.replace(/^.*\//, EMPTY).toUpperCase()}</option>`).join(NL)}`)
		.replace(TEMPLATE_BODY, sanitize(JSON.stringify(arg, null, INT_2)))
		.replace(TEMPLATE_YEAR, new Date().getFullYear())
		.replace(TEMPLATE_VERSION, req.server.version)
		.replace(TEMPLATE_ALLOW, headers.allow)
		.replace(TEMPLATE_METHODS, explode((headers?.allow ?? EMPTY).replace(HEADER_ALLOW_GET, EMPTY)).filter(i => i !== EMPTY).map(i => `<option value='${i.trim()}'>$i.trim()}</option>`).join(NL))
		.replace(TEMPLATE_CSRF, headers?.[X_CSRF_TOKEN] ?? EMPTY)
		.replace("class=\"headers", req.server.renderHeaders === false ? "class=\"headers dr-hidden" : "class=\"headers") : EMPTY;
}function jsonl (req, res, arg) {
	return stringify$1(arg);
}const renderers = new Map([
	[HEADER_APPLICATION_JSON, json],
	[HEADER_APPLICATION_YAML, yaml],
	[HEADER_APPLICATION_XML, xml],
	[HEADER_TEXT_PLAIN, plain$1],
	[HEADER_APPLICATION_JAVASCRIPT, javascript],
	[HEADER_TEXT_CSV, csv],
	[HEADER_TEXT_HTML, html],
	[HEADER_APPLICATION_JSON_LINES, jsonl],
	[HEADER_APPLICATION_JSONL, jsonl],
	[HEADER_TEXT_JSON_LINES, jsonl]
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
	[HEADER_APPLICATION_JSON, custom],
	[HEADER_APPLICATION_YAML, custom],
	[HEADER_APPLICATION_XML, custom],
	[HEADER_TEXT_PLAIN, plain],
	[HEADER_APPLICATION_JAVASCRIPT, custom],
	[HEADER_TEXT_CSV, plain],
	[HEADER_TEXT_HTML, custom],
	[HEADER_APPLICATION_JSON_LINES, plain],
	[HEADER_APPLICATION_JSONL, plain],
	[HEADER_TEXT_JSON_LINES, plain]
]);function hasBody (arg) {
	return arg.includes(PATCH) || arg.includes(POST) || arg.includes(PUT);
}const clone = arg => JSON.parse(JSON.stringify(arg));const ORDER_BY_EQ_DESC = `${ORDER_BY}${EQ}${DESC}`;
const COMMA_SPACE = `${COMMA}${SPACE}`;

function sort (arg, req) {
	let output = clone(arg);

	if (typeof req.parsed.search === STRING && req.parsed.searchParams.has(ORDER_BY) && Array.isArray(arg)) {
		const type = typeof arg[INT_0];

		if (type !== BOOLEAN && type !== NUMBER && type !== STRING && type !== UNDEFINED && arg[INT_0] !== null) {
			const args = req.parsed.searchParams.getAll(ORDER_BY).filter(i => i !== DESC).join(COMMA_SPACE);

			if (args.length > INT_0) {
				output = keysort(output, args);
			}
		}

		if (req.parsed.search.includes(ORDER_BY_EQ_DESC)) {
			output = output.reverse();
		}
	}

	return output;
}function serialize (req, res, arg) {
	const status = res.statusCode;
	let format = req.server.mimeType,
		accepts = explode(req.parsed.searchParams.get(FORMAT) || req.headers.accept || res.getHeader(HEADER_CONTENT_TYPE) || format, COMMA),
		errz = arg instanceof Error || status >= INT_400,
		result, serializer;

	for (const i of accepts) {
		let mimetype$1 = i.replace(mimetype, EMPTY);

		if (serializers.has(mimetype$1)) {
			format = mimetype$1;
			break;
		}
	}

	serializer = serializers.get(format);
	res.removeHeader(HEADER_CONTENT_TYPE);
	res.header(HEADER_CONTENT_TYPE, `${format}${CHARSET_UTF8}`);

	if (errz) {
		result = serializer(null, arg, status < INT_400 ? INT_500 : status, req.server.logging.stackWire);
	} else {
		result = serializer(sort(arg, req), null, status);
	}

	return result;
}const pattern = new RegExp(`${ID}|${ID_2}$`, I);

function id (arg = EMPTY) {
	return pattern.test(arg);
}function scheme (arg = EMPTY) {
	return arg.includes(SLASH) || arg[0] === URI_SCHEME;
}// Parsing the object for hypermedia properties
function marshal (obj, rel, item_collection, root, seen, links, server) {
	let keys = Object.keys(obj),
		lrel = rel || RELATED,
		result;

	if (keys.length === INT_0) {
		result = null;
	} else {
		for (const i of keys) {
			if (obj[i] !== void 0 && obj[i] !== null) {
				const lid = id(i);
				const isLinkable = hypermedia$1.test(i);

				// If ID like keys are found, and are not URIs, they are assumed to be root collections
				if (lid || isLinkable) {
					const lkey = obj[i].toString();
					let lcollection, uri;

					if (isLinkable) {
						lcollection = i.replace(trailing, EMPTY).replace(trailingS, EMPTY).replace(trailingY, IE) + S;
						lrel = RELATED;
					} else {
						lcollection = item_collection;
						lrel = ITEM;
					}

					if (scheme(lkey) === false) {
						uri = `${lcollection[0] === SLASH ? EMPTY : SLASH}${lcollection.replace(/\s/g, ENCODED_SPACE)}/${lkey.replace(/\s/g, ENCODED_SPACE)}`;

						if (uri !== root && seen.has(uri) === false) {
							seen.add(uri);

							if (server.allowed(GET, uri)) {
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
}function hypermedia (req, res, rep) {
	const server = req.server,
		headers = res.getHeaders(),
		collection$1 = req.parsed.pathname,
		links = [],
		seen = new Set(),
		exists = rep !== null;
	let query, page, page_size, nth, root, parent;

	query = req.parsed.searchParams;
	page = Number(query.get(PAGE)) || INT_1;
	page_size = Number(query.get(PAGE_SIZE)) || server.pageSize || INT_5;

	if (page < INT_1) {
		page = INT_1;
	}

	if (page_size < INT_1) {
		page_size = server.pageSize || INT_5;
	}

	root = new URL(`${URL_127001}${req.parsed.pathname}${req.parsed.search}`);
	root.searchParams.delete(PAGE);
	root.searchParams.delete(PAGE_SIZE);

	if (root.pathname !== SLASH) {
		const proot = root.pathname.replace(trailingSlash, EMPTY).replace(collection, "$1") || SLASH;

		if (server.allowed(GET, proot)) {
			links.push({uri: proot, rel: COLLECTION});
			seen.add(proot);
		}
	}

	if (exists) {
		if (Array.isArray(rep.data)) {
			if (req.method === GET && (rep.status >= INT_200 && rep.status <= INT_206)) {
				nth = Math.ceil(rep.data.length / page_size);

				if (nth > INT_1) {
					const start = (page - INT_1) * page_size,
						end = start + page_size;

					rep.data = rep.data.slice(start, end);
					root.searchParams.set(PAGE, INT_0);
					root.searchParams.set(PAGE_SIZE, page_size);

					if (page > INT_1) {
						root.searchParams.set(PAGE, INT_1);
						links.push({uri: `${root.pathname}${root.search}`, rel: FIRST});
					}

					if (page - INT_1 > INT_1 && page <= nth) {
						root.searchParams.set(PAGE, page - INT_1);
						links.push({uri: `${root.pathname}${root.search}`, rel: PREV});
					}

					if (page + INT_1 < nth) {
						root.searchParams.set(PAGE, page + INT_1);
						links.push({uri: `${root.pathname}${root.search}`, rel: NEXT});
					}

					if (nth > INT_0 && page !== nth) {
						root.searchParams.set(PAGE, nth);
						links.push({uri: `${root.pathname}${root.search}`, rel: LAST});
					}
				}
			}

			if (req.hypermedia) {
				for (const i of rep.data) {
					if (i instanceof Object) {
						marshal(i, ITEM, req.parsed.pathname.replace(trailingSlash, EMPTY), root, seen, links, server);
					} else {
						const li = i.toString();

						if (li !== collection$1) {
							const uri = li.indexOf(DOUBLE_SLASH) >= INT_0 ? li : `${collection$1.replace(/\s/g, ENCODED_SPACE)}/${li.replace(/\s/g, ENCODED_SPACE)}`.replace(/^\/\//, SLASH);

							if (uri !== collection$1 && server.allowed(GET, uri)) {
								links.push({uri: uri, rel: ITEM});
							}
						}
					}
				}
			}
		} else if (rep.data instanceof Object && req.hypermedia) {
			parent = req.parsed.pathname.split(SLASH).filter(i => i !== EMPTY);

			if (parent.length > INT_1) {
				parent.pop();
			}

			rep.data = marshal(rep.data, void 0, parent[parent.length - INT_1], root, seen, links, server);
		}
	}

	if (links.length > INT_0) {
		if (headers.link !== void 0) {
			for (const i of headers.link.split(HEADER_SPLIT)) {
				links.push({
					uri: i.replace(/(^<|>.*$)/g, EMPTY),
					rel: i.replace(/(^.*rel="|"$)/g, EMPTY)
				});
			}
		}

		if (req.hypermediaHeader) {
			res.header(LINK, keysort(links, REL_URI).map(i => `<${i.uri}>; rel="${i.rel}"`).join(COMMA_SPACE$1));
		}

		if (exists && Array.isArray(rep?.links ?? EMPTY)) {
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

				if (max > INT_0 && Buffer.byteLength(body) > max) {
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

	if (req.body !== EMPTY) {
		const type = req.headers?.[HEADER_CONTENT_TYPE]?.replace(/\s.*$/, EMPTY) ?? EMPTY;
		const parsers = req.server.parsers;

		if (type.length > INT_0 && parsers.has(type)) {
			try {
				req.body = parsers.get(type)(req.body);
			} catch (err) {
				valid = false;
				exception = err;
			}
		}
	}

	next(valid === false ? exception : void 0);
}// Prometheus metrics
const prometheus = config => promBundle(config);function asyncFlag (req, res, next) {
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
		res.error(INT_401);
	}
}function redirect (req, res) {
	res.redirect(req.server.auth.uri.redirect, false);
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
		const results = req.server.rateLimit(req, config.override),
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
			req.exit();
		}
	});
}function random (n = INT_100) {
	return randomInt(INT_1, n);
}function delay (fn = () => void 0, n = INT_0) {
	if (n === INT_0) {
		fn();
	} else {
		setTimeout(fn, random(n));
	}
}function isEmpty (arg = EMPTY) {
	return arg === EMPTY;
}const {Strategy: JWTStrategy, ExtractJwt} = passportJWT,
	groups = [PROTECT, UNPROTECT];

function auth (obj) {
	const ssl = obj.ssl.cert && obj.ssl.key,
		realm = `http${ssl ? S : EMPTY}://${obj.host}${obj.port !== INT_80 && obj.port !== INT_443 ? COLON + obj.port : EMPTY}`,
		async = obj.auth.oauth2.enabled || obj.auth.saml.enabled,
		stateless = obj.rate.enabled === false && obj.security.csrf === false,
		authDelay = obj.auth.delay,
		authMap = {},
		authUris = [];

	let sesh, fnCookie, fnSession, passportInit, passportSession;

	obj.ignore(asyncFlag);

	for (const k of groups) {
		obj.auth[k] = (obj.auth[k] || []).map(i => new RegExp(`^${i !== obj.auth.uri.login ? i.replace(/\.\*/g, WILDCARD).replace(/\*/g, `${PERIOD}${WILDCARD}`) : EMPTY}(/|$)`, I));
	}

	for (const i of Object.keys(obj.auth)) {
		if (obj.auth[i].enabled) {
			const uri = `${SLASH}${AUTH}${SLASH}${i}`;

			authMap[`${i}${UNDERSCORE}${URI}`] = uri;
			authUris.push(uri);
			obj.auth.protect.push(new RegExp(`^/auth/${i}(/|$)`));
		}
	}

	if (stateless === false) {
		const objSession = clone(obj.session);

		delete objSession.redis;
		delete objSession.store;

		sesh = Object.assign({secret: randomUUID()}, objSession);

		if (obj.session.store === REDIS) {
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

	if (isEmpty(obj.security.xframe || EMPTY) === false) {
		const luscaXframe = lusca.xframe(obj.security.xframe);

		obj.always(luscaXframe).ignore(luscaXframe);
	}

	if (isEmpty(obj.security.p3p || EMPTY) === false) {
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
				cb(new Error(STATUS_CODES[INT_401]), null);
			}
		};

		for (const i of obj.auth.basic.list || []) {
			let args = i.split(COLON);

			if (args.length > INT_0) {
				x[args[INT_0]] = {password: args[INT_1]};
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

		const passportAuth = passport.authenticate(BASIC, {session: stateless === false});

		if (async) {
			const uri = `${SLASH}${AUTH}${SLASH}${BASIC}`;

			obj.get(uri, passportAuth).ignore(passportAuth);
			obj.get(uri, redirect);
		} else {
			obj.always(passportAuth).ignore(passportAuth);
		}
	} else if (obj.auth.bearer.enabled) {
		const validate = (arg, cb) => {
			if (obj.auth.bearer.tokens.includes(arg)) {
				cb(null, arg);
			} else {
				cb(new Error(STATUS_CODES[INT_401]), null);
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
						done(null, user, {scope: READ});
					}
				});
			}, authDelay);
		}));

		const passportAuth = passport.authenticate(BEARER.toLowerCase(), {session: stateless === false});

		if (async) {
			const uri = `${SLASH}${AUTH}${SLASH}${BEARER.toLowerCase()}`;

			obj.get(uri, passportAuth).ignore(passportAuth);
			obj.get(uri, redirect);
		} else {
			obj.always(passportAuth).ignore(passportAuth);
		}
	} else if (obj.auth.jwt.enabled) {
		const opts = {
			jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme(obj.auth.jwt.scheme),
			secretOrKey: obj.auth.jwt.secretOrKey,
			ignoreExpiration: obj.auth.jwt.ignoreExpiration === true
		};

		for (const i of [ALGORITHMS, AUDIENCE, ISSUER]) {
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

		const passportAuth = passport.authenticate(JWT, {session: false});
		obj.always(passportAuth).ignore(passportAuth);
	} else if (obj.auth.oauth2.enabled) {
		const uri = `${SLASH}${AUTH}${SLASH}${OAUTH2}`;
		const uri_callback = `${uri}${SLASH}${CALLBACK}`;

		passport.use(new Strategy$1({
			authorizationURL: obj.auth.oauth2.auth_url,
			tokenURL: obj.auth.oauth2.token_url,
			clientID: obj.auth.oauth2.client_id,
			clientSecret: obj.auth.oauth2.client_secret,
			callbackURL: `${realm}${uri_callback}`
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

		obj.get(uri, asyncFlag);
		obj.get(uri, passport.authenticate(OAUTH2));
		obj.get(uri_callback, asyncFlag);
		obj.get(uri_callback, passport.authenticate(OAUTH2, {failureRedirect: obj.auth.uri.login}));
		obj.get(uri_callback, redirect);
	}

	if (authUris.length > INT_0) {
		if (Object.keys(authMap).length > INT_0) {
			obj.get(obj.auth.uri.root, authMap);
		}

		let r = `(?!${obj.auth.uri.root}/(`;

		for (const i of authUris) {
			r += i.replace(`${UNDERSCORE}${URI}`, EMPTY) + PIPE;
		}

		r = r.replace(/\|$/, EMPTY) + REGEX_REPLACE;
		obj.always(r, guard).ignore(guard);

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

function tenso (userConfig = {}) {
	const config$1 = merge(clone(config), userConfig);

	if ((/^[^\d+]$/).test(config$1.port) && config$1.port < INT_1) {
		console.error(INVALID_CONFIGURATION);
		process.exit(INT_1);
	}

	config$1.title = name;
	config$1.version = version;
	config$1.webroot.root = resolve(config$1.webroot.root || join(__dirname, PREV_DIR, WWW));
	config$1.webroot.template = readFileSync(config$1.webroot.template || join(config$1.webroot.root, TEMPLATE_FILE), {encoding: UTF8});

	if (config$1.silent !== true) {
		config$1.defaultHeaders.server = `tenso/${config$1.version}`;
		config$1.defaultHeaders[X_POWERED_BY] = `nodejs/${process.version}, ${process.platform}/${process.arch}`;
	}

	const app = new Tenso(config$1);

	return app.init();
}export{tenso};