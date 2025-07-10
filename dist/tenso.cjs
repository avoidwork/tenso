/**
 * tenso
 *
 * @copyright 2025 Jason Mulligan <jason.mulligan@avoidwork.com>
 * @license BSD-3-Clause
 * @version 17.2.5
 */
'use strict';

var node_fs = require('node:fs');
var http = require('node:http');
var https = require('node:https');
var node_module = require('node:module');
var node_path = require('node:path');
var node_url = require('node:url');
var woodland = require('woodland');
var tinyMerge = require('tiny-merge');
var tinyEventsource = require('tiny-eventsource');
var tinyJsonl = require('tiny-jsonl');
var tinyCoerce = require('tiny-coerce');
var YAML = require('yamljs');
var fastXmlParser = require('fast-xml-parser');
var sync = require('csv-stringify/sync');
var keysort = require('keysort');
var url = require('url');
var promClient = require('prom-client');
var redis = require('ioredis');
var cookie = require('cookie-parser');
var session = require('express-session');
var passport = require('passport');
var passportJWT = require('passport-jwt');
var passportHttp = require('passport-http');
var passportHttpBearer = require('passport-http-bearer');
var passportOauth2 = require('passport-oauth2');
var lusca = require('lusca');
var node_crypto = require('node:crypto');
var connectRedis = require('connect-redis');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
// =============================================================================
// HTTP METHODS
// =============================================================================

const CONNECT = "connect";
const DELETE = "DELETE";
const GET = "GET";
const OPTIONS = "OPTIONS";
const PATCH = "PATCH";
const POST = "POST";
const PUT = "PUT";

// =============================================================================
// HTTP STATUS CODES
// =============================================================================

const INT_200 = 2e2;
const INT_204 = 204;
const INT_206 = 206;
const INT_300000 = 3e5;
const INT_304 = 304;
const INT_400 = 4e2;
const INT_401 = 401;
const INT_413 = 413;
const INT_429 = 429;
const INT_450 = 450;
const INT_500 = 5e2;

// =============================================================================
// CONTENT TYPES & HEADERS
// =============================================================================

const DEFAULT_CONTENT_TYPE = "application/json; charset=utf-8";
const DEFAULT_VARY = "accept, accept-encoding, accept-language, origin";

const HEADER_APPLICATION_JAVASCRIPT = "application/javascript";
const HEADER_APPLICATION_JSON = "application/json";
const HEADER_APPLICATION_JSONL = "application/jsonl";
const HEADER_APPLICATION_JSON_LINES = "application/json-lines";
const HEADER_APPLICATION_XML = "application/xml";
const HEADER_APPLICATION_X_WWW_FORM_URLENCODED = "application/x-www-form-urlencoded";
const HEADER_APPLICATION_YAML = "application/yaml";
const HEADER_TEXT_CSV = "text/csv";
const HEADER_TEXT_HTML = "text/html";
const HEADER_TEXT_JSON_LINES = "text/json-lines";
const HEADER_TEXT_PLAIN = "text/plain";

const HEADER_ALLOW_GET = "GET, HEAD, OPTIONS";
const HEADER_CONTENT_DISPOSITION = "content-disposition";
const HEADER_CONTENT_DISPOSITION_VALUE = "attachment; filename=\"download.csv\"";
const HEADER_CONTENT_TYPE = "content-type";
const HEADER_SPLIT = "\" <";
const HEADER_VARY = "vary";

const CACHE_CONTROL = "cache-control";
const CHARSET_UTF8 = "; charset=utf-8";
const EXPOSE_HEADERS = "cache-control, content-language, content-type, expires, last-modified, pragma";
const RETRY_AFTER = "retry-after";
const X_CSRF_TOKEN = "x-csrf-token";
const X_FORWARDED_PROTO = "x-forwarded-proto";
const X_POWERED_BY = "x-powered-by";
const X_RATELIMIT_LIMIT = "x-ratelimit-limit";
const X_RATELIMIT_REMAINING = "x-ratelimit-remaining";
const X_RATELIMIT_RESET = "x-ratelimit-reset";

// =============================================================================
// AUTHENTICATION & AUTHORIZATION
// =============================================================================

const ACCESS_CONTROL = "access-control";
const ALGORITHMS = "algorithms";
const ALLOW = "allow";
const AUDIENCE = "audience";
const AUTH = "auth";
const BASIC = "basic";
const BEARER = "Bearer";
const COOKIE_NAME = "tenso.sid";
const EXPOSE = "expose";
const ISSUER = "issuer";
const JWT = "jwt";
const OAUTH2 = "oauth2";
const PRIVATE = "private";
const PROTECT = "protect";
const read = "read";
const SAMEORIGIN = "SAMEORIGIN";
const SESSION_SECRET = "tensoABC";
const UNPROTECT = "unprotect";

// JWT Algorithms
const HS256 = "HS256";
const HS384 = "HS384";
const HS512 = "HS512";

// =============================================================================
// URLS & PATHS
// =============================================================================

const IP_0000 = "0.0.0.0";
const IP_127001 = "127.0.0.1";
const URL_127001 = "http://127.0.0.1";
const URL_AUTH_LOGIN = "/auth/login";
const URL_AUTH_LOGOUT = "/auth/logout";
const URL_AUTH_ROOT = "/auth";
const PATH_ASSETS = "/assets";
const METRICS_PATH = "/metrics";

// =============================================================================
// TEMPLATE CONSTANTS
// =============================================================================

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

// =============================================================================
// PAGINATION & QUERY PARAMETERS
// =============================================================================

const ORDER_BY = "order_by";
const PAGE = "page";
const PAGE_SIZE = "page_size";
const FIRST = "first";
const LAST = "last";
const NEXT = "next";
const PREV = "prev";
const DESC = "desc";

// =============================================================================
// DATA STRUCTURE KEYS
// =============================================================================

const COLLECTION = "collection";
const DATA = "data";
const HEADERS = "headers";
const ID = "id";
const ID_2 = "_id";
const ITEM = "item";
const LINK = "link";
const RELATED = "related";
const REL_URI = "rel, uri";
const URI = "uri";

// =============================================================================
// NUMERIC CONSTANTS
// =============================================================================

const INT_NEG_1 = -1;
const INT_0 = 0;
const INT_1 = 1;
const INT_2 = 2;
const INT_3 = 3;
const INT_5 = 5;
const INT_10 = 10;
const INT_80 = 80;
const INT_100 = 1e2;
const INT_443 = 443;
const INT_900 = 9e2;
const INT_1000 = 1e3;
const INT_6379 = 6379;
const INT_8000 = 8e3;

// =============================================================================
// STRING LITERALS & SYMBOLS
// =============================================================================

const AUTO = "auto";
const BOOLEAN = "boolean";
const CALLBACK = "callback";
const COLON = ":";
const COMMA = ",";
const COMMA_SPACE$1 = ", ";
const DEBUG = "debug";
const DOUBLE_SLASH = "//";
const EMPTY = "";
const ENCODED_SPACE = "%20";
const END = "end";
const EQ = "=";
const ERROR = "error";
const FALSE = "false";
const FORMAT = "format";
const FUNCTION = "function";
const G = "g";
const GT = "&gt;";
const HTML = "html";
const HYPHEN = "-";
const I = "i";
const IDENT_VAR = "indent=";
const IE = "ie";
const LT = "&lt;";
const NL = "\n";
const NULL = "null";
const NUMBER = "number";
const PERIOD = ".";
const PIPE = "|";
const PREV_DIR = "..";
const S = "s";
const SLASH = "/";
const SPACE = " ";
const STRING = "string";
const TENSO = "tenso";
const TRUE = "true";
const UNDEFINED = "undefined";
const UNDERSCORE = "_";
const URI_SCHEME = "://";
const UTF8 = "utf8";
const UTF_8 = "utf-8";
const WILDCARD = "*";
const WWW = "www";

// =============================================================================
// XML CONSTANTS
// =============================================================================

const XML_ARRAY_NODE_NAME = "item";
const XML_PROLOG = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";

// =============================================================================
// CONFIGURATION & SYSTEM
// =============================================================================

const INVALID_CONFIGURATION = "Invalid configuration";
const LOG_FORMAT = "%h %l %u %t \"%r\" %>s %b";
const MEMORY = "memory";
const MULTIPART = "multipart";
const REDIS = "redis";
const REGEX_REPLACE = ")).*$";

// System signals
const SIGHUP = "SIGHUP";
const SIGINT = "SIGINT";
const SIGTERM = "SIGTERM";

// =============================================================================
// MESSAGES
// =============================================================================

const MSG_LOGIN = "POST 'username' & 'password' to authenticate";
const MSG_PROMETHEUS_ENABLED = "Prometheus metrics enabled";
const MSG_TOO_MANY_REQUESTS = "Too many requests";

/**
 * Default configuration object for Tenso framework
 * 
 * This configuration object contains all the default settings for a Tenso server instance.
 * It includes settings for authentication, security, logging, caching, middleware, and more.
 * 
 * @typedef {Object} TensoConfig
 * @property {Object} auth - Authentication configuration
 * @property {number} auth.delay - Authentication delay in milliseconds
 * @property {Array<string>} auth.protect - Routes to protect with authentication
 * @property {Array<string>} auth.unprotect - Routes to exclude from authentication
 * @property {Object} auth.basic - Basic authentication settings
 * @property {Object} auth.bearer - Bearer token authentication settings
 * @property {Object} auth.jwt - JWT authentication settings
 * @property {Object} auth.oauth2 - OAuth2 authentication settings
 * @property {Object} auth.saml - SAML authentication settings
 * @property {Object} auth.uri - Authentication URI endpoints
 * @property {boolean} autoindex - Enable automatic directory indexing
 * @property {number} cacheSize - Maximum number of items in cache
 * @property {number} cacheTTL - Cache time-to-live in milliseconds
 * @property {boolean} catchAll - Enable catch-all route handling
 * @property {string} charset - Default character encoding
 * @property {string} corsExpose - CORS exposed headers
 * @property {Object} defaultHeaders - Default HTTP headers to include in responses
 * @property {number} digit - Number of decimal places for numeric formatting
 * @property {boolean} etags - Enable ETag generation
 * @property {Array} exit - Exit handlers
 * @property {string} host - Server host address
 * @property {Object} hypermedia - Hypermedia/HATEOAS configuration
 * @property {Array} index - Index route configuration
 * @property {Object} initRoutes - Initial route definitions
 * @property {number} jsonIndent - JSON response indentation level
 * @property {Object} logging - Logging configuration
 * @property {number} maxBytes - Maximum request body size in bytes
 * @property {string} mimeType - Default MIME type for responses
 * @property {Array<string>} origins - Allowed CORS origins
 * @property {number} pageSize - Default pagination page size
 * @property {number} port - Server port number
 * @property {Object} prometheus - Prometheus metrics configuration
 * @property {Object} rate - Rate limiting configuration
 * @property {boolean} renderHeaders - Include headers in rendered output
 * @property {boolean} time - Include timing information in responses
 * @property {Object} security - Security-related settings (CSRF, CSP, etc.)
 * @property {Object} session - Session management configuration
 * @property {boolean} silent - Suppress console output
 * @property {Object} ssl - SSL/TLS configuration
 * @property {Object} webroot - Web root and static file serving configuration
 * 
 * @type {TensoConfig}
 */
const config = {
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
	exit: [],
	host: IP_0000,
	hypermedia: {
		enabled: true,
		header: true
	},
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
		enabled: false,
		metrics: {
			includeMethod: true,
			includePath: true,
			includeStatusCode: true,
			includeUp: true,
			buckets: [0.001, 0.01, 0.1, 1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 35, 40, 50, 70, 100, 200],
			customLabels: {}
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
};

/**
 * Parses JSON string into JavaScript object
 * @param {string} [arg=EMPTY] - The JSON string to parse
 * @returns {*} The parsed JavaScript object or value
 * @throws {SyntaxError} When the JSON string is invalid
 */
function json$1 (arg = EMPTY) {
	return JSON.parse(arg);
}

/**
 * Parses JSON Lines (JSONL) string into JavaScript array
 * Each line should contain a valid JSON object
 * @param {string} [arg=EMPTY] - The JSONL string to parse
 * @returns {Array} Array of parsed JavaScript objects
 * @throws {Error} When any line contains invalid JSON
 */
function jsonl$1 (arg = EMPTY) {
	return tinyJsonl.parse(arg);
}

/**
 * Regular expression for splitting request body parameters on & and = characters
 * @type {RegExp}
 */
const bodySplit = /&|=/;

/**
 * Regular expression for matching collection patterns in URLs
 * @type {RegExp}
 */
const collection = /(.*)(\/.*)$/;

/**
 * Regular expression for matching hypermedia-related field names (id, url, uri patterns)
 * @type {RegExp}
 */
const hypermedia$1 = /(([a-z]+(_)?)?id|url|uri)$/i;

/**
 * Regular expression for matching MIME type parameters (semicolon and beyond)
 * @type {RegExp}
 */
const mimetype = /;.*/;

/**
 * Regular expression for matching trailing underscore patterns
 * @type {RegExp}
 */
const trailing = /_.*$/;

/**
 * Regular expression for matching trailing 's' character
 * @type {RegExp}
 */
const trailingS = /s$/;

/**
 * Regular expression for matching trailing slash character
 * @type {RegExp}
 */
const trailingSlash = /\/$/;

/**
 * Regular expression for matching trailing 'y' character
 * @type {RegExp}
 */
const trailingY = /y$/;

/**
 * Splits an array into chunks of specified size
 * @param {Array} [arg=[]] - The array to chunk
 * @param {number} [size=INT_2] - The size of each chunk
 * @returns {Array<Array>} Array of chunks, each containing up to 'size' elements
 */
function chunk (arg = [], size = INT_2) {
	const result = [];
	const nth = Math.ceil(arg.length / size);
	let i = INT_0;

	while (i < nth) {
		result.push(arg.slice(i * size, ++i * size));
	}

	return result;
}

/**
 * Parses URL-encoded form data into JavaScript object
 * Decodes URL-encoded strings and converts values to appropriate types
 * @param {string} arg - The URL-encoded form data string to parse
 * @returns {Object} Object containing the parsed form data with decoded keys and coerced values
 */
function xWwwFormURLEncoded (arg) {
	const args = arg ? chunk(arg.split(bodySplit), INT_2) : [],
		result = {};

	for (const i of args) {
		result[decodeURIComponent(i[INT_0].replace(/\+/g, ENCODED_SPACE))] = tinyCoerce.coerce(decodeURIComponent(i[INT_1].replace(/\+/g, ENCODED_SPACE)));
	}

	return result;
}

/**
 * Map of content types to their corresponding parser functions
 * Maps MIME types to functions that can parse request bodies of that type
 * @type {Map<string, Function>}
 */
const parsers = new Map([
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
]);

/**
 * Extracts indentation value from a string or returns fallback
 * Looks for "indent=number" pattern in the input string
 * @param {string} [arg=EMPTY] - The string to parse for indentation value
 * @param {number} [fallback=INT_0] - The fallback value if no indent pattern is found
 * @returns {number} The parsed indentation value or fallback
 */
function indent (arg = EMPTY, fallback = INT_0) {
	return arg.includes(IDENT_VAR) ? parseInt(arg.match(/indent=(\d+)/)[INT_1], INT_10) : fallback;
}

/**
 * Renders data as JSON with configurable indentation
 * Uses server configuration and request headers to determine indentation level
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to render as JSON
 * @returns {string} The JSON formatted string
 */
function json (req, res, arg) {
	return JSON.stringify(arg, null, indent(req.headers.accept, req.server.jsonIndent));
}

/**
 * Renders data as YAML format
 * Converts JavaScript objects and arrays to YAML string representation
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to render as YAML
 * @returns {string} The YAML formatted string
 */
function yaml (req, res, arg) {
	return YAML.stringify(arg);
}

/**
 * Renders data as XML format with proper formatting and entity processing
 * Handles arrays with special array node names and includes XML prolog
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to render as XML
 * @returns {string} The XML formatted string with prolog
 */
function xml (req, res, arg) {
	const builder = new fastXmlParser.XMLBuilder({
		processEntities: true,
		format: true,
		ignoreAttributes: false,
		arrayNodeName: Array.isArray(arg) ? XML_ARRAY_NODE_NAME : undefined
	});

	return `${XML_PROLOG}\n${builder.build({output: arg})}`;
}

/**
 * Renders data as plain text with recursive handling of arrays and objects
 * Arrays are joined with commas, objects are JSON stringified, primitives are converted to strings
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to render as plain text
 * @returns {string} The plain text representation
 */
function plain$1 (req, res, arg) {
	return Array.isArray(arg) ? arg.map(i => plain$1(req, res, i)).join(COMMA) : arg instanceof Object ? JSON.stringify(arg, null, indent(req.headers.accept, req.server.json)) : arg.toString();
}

/**
 * Renders data as JSONP callback for JavaScript consumption
 * Wraps JSON data in a callback function for cross-domain requests
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to render as JSONP
 * @returns {string} The JSONP callback string
 */
function javascript (req, res, arg) {
	req.headers.accept = HEADER_APPLICATION_JAVASCRIPT;
	res.header(HEADER_CONTENT_TYPE, HEADER_APPLICATION_JAVASCRIPT);

	return `${req.parsed.searchParams.get(CALLBACK) ?? CALLBACK}(${JSON.stringify(arg, null, INT_0)});`;
}

/**
 * Renders data as CSV format with headers and download attachment
 * Converts arrays and objects to CSV format with proper casting for different data types
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to render as CSV
 * @returns {string} The CSV formatted string
 */
function csv (req, res, arg) {
	const filename = req.url.split("/").pop().split(".")[0];
	const input = res.statusCode < 400 ? Array.isArray(arg) ? arg : [arg] : [{Error: arg}];

	res.header(HEADER_CONTENT_DISPOSITION, HEADER_CONTENT_DISPOSITION_VALUE.replace("download", filename));

	return sync.stringify(input, {
		cast: {
			boolean: value => value ? TRUE : FALSE,
			date: value => value.toISOString(),
			number: value => value.toString()
		},
		delimiter: COMMA,
		header: true,
		quoted: false
	});
}

/**
 * Splits a string by delimiter and trims whitespace around each piece
 * @param {string} [arg=EMPTY] - The string to split
 * @param {string} [delimiter=COMMA] - The delimiter to split by
 * @returns {Array<string>} Array of trimmed string pieces
 */
function explode (arg = EMPTY, delimiter = COMMA) {
	return arg.trim().split(new RegExp(`\\s*${delimiter}\\s*`));
}

/**
 * Sanitizes HTML by escaping < and > characters
 * @param {*} arg - The value to sanitize
 * @returns {*} The sanitized value with HTML entities escaped, or original value if not a string
 */
function sanitize (arg) {
	return typeof arg === STRING ? arg.replace(/</g, LT).replace(/>/g, GT) : arg;
}

/**
 * Renders data as HTML using template replacement
 * Replaces template placeholders with actual values including headers, body, and metadata
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to render in the HTML template
 * @param {string} [tpl=EMPTY] - The HTML template string with placeholders
 * @returns {string} The rendered HTML string
 */
function html (req, res, arg, tpl = EMPTY) {
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
}

/**
 * Renders data as JSON Lines format
 * Each object is serialized as a separate line of JSON
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to render as JSON Lines
 * @returns {string} The JSON Lines formatted string
 */
function jsonl (req, res, arg) {
	return tinyJsonl.stringify(arg);
}

/**
 * Map of content types to their corresponding renderer functions
 * Maps MIME types to functions that can render data in that format
 * @type {Map<string, Function>}
 */
const renderers = new Map([
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
]);

/**
 * Custom serializer that creates a structured response object with metadata
 * Returns an object containing data, error, links, and status fields
 * @param {*} arg - The data to serialize
 * @param {Error|string|null} err - The error object or message, null if no error
 * @param {number} [status=INT_200] - HTTP status code
 * @param {boolean} [stack=false] - Whether to include error stack trace
 * @returns {Object} Structured response object with data, error, links, and status
 */
function custom (arg, err, status = INT_200, stack = false) {
	return {
		data: arg,
		error: err !== null ? (stack ? err.stack : err.message) || err || http.STATUS_CODES[status] : null,
		links: [],
		status: status
	};
}

/**
 * Plain serializer that returns data directly or error information
 * Returns the original data if no error, otherwise returns error message or stack trace
 * @param {*} arg - The data to serialize
 * @param {Error|string|null} err - The error object or message, null if no error
 * @param {number} [status=INT_200] - HTTP status code (used for fallback error message)
 * @param {boolean} [stack=false] - Whether to return error stack trace instead of message
 * @returns {*} The original data or error information
 */
function plain (arg, err, status = INT_200, stack = false) {
	return err !== null ? (stack ? err.stack : err.message) || err || http.STATUS_CODES[status] : arg;
}

/**
 * Map of content types to their corresponding serializer functions
 * Maps MIME types to functions that can serialize data for that format
 * @type {Map<string, Function>}
 */
const serializers = new Map([
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
]);

/**
 * Checks if an HTTP method typically has a request body
 * @param {string} arg - The HTTP method string to check
 * @returns {boolean} True if the method can have a body (PATCH, POST, PUT), false otherwise
 */
function hasBody (arg) {
	return arg.includes(PATCH) || arg.includes(POST) || arg.includes(PUT);
}

/**
 * Deep clones an object using JSON serialization/deserialization
 * @param {*} arg - The object to clone
 * @returns {*} A deep clone of the input object
 */
const clone = arg => JSON.parse(JSON.stringify(arg));

const ORDER_BY_EQ_DESC = `${ORDER_BY}${EQ}${DESC}`;
const COMMA_SPACE = `${COMMA}${SPACE}`;

/**
 * Sorts an array based on query parameters in the request
 * Supports ordering by object keys and reverse ordering
 * @param {*} arg - The data to sort (typically an array)
 * @param {Object} req - The HTTP request object containing parsed query parameters
 * @returns {*} The sorted data or original data if not sortable
 */
function sort (arg, req) {
	let output = clone(arg);

	if (typeof req.parsed.search === STRING && req.parsed.searchParams.has(ORDER_BY) && Array.isArray(arg)) {
		const type = typeof arg[INT_0];

		if (type !== BOOLEAN && type !== NUMBER && type !== STRING && type !== UNDEFINED && arg[INT_0] !== null) {
			const args = req.parsed.searchParams.getAll(ORDER_BY).filter(i => i !== DESC).join(COMMA_SPACE);

			if (args.length > INT_0) {
				output = keysort.keysort(output, args);
			}
		}

		if (req.parsed.search.includes(ORDER_BY_EQ_DESC)) {
			output = output.reverse();
		}
	}

	return output;
}

/**
 * Serializes response data based on content type negotiation
 * Handles format selection, sorting, and error serialization
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to serialize
 * @returns {*} The serialized data
 */
function serialize (req, res, arg) {
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
}

const pattern = new RegExp(`${ID}|${ID_2}$`, I);

/**
 * Checks if a string matches common ID patterns
 * @param {string} [arg=EMPTY] - The string to test for ID patterns
 * @returns {boolean} True if the string matches ID patterns, false otherwise
 */
function id (arg = EMPTY) {
	return pattern.test(arg);
}

/**
 * Checks if a string contains a URI scheme indicator
 * @param {string} [arg=EMPTY] - The string to check for URI scheme
 * @returns {boolean} True if the string contains a slash or starts with URI scheme character
 */
function scheme (arg = EMPTY) {
	return arg.includes(SLASH) || arg[0] === URI_SCHEME;
}

/**
 * Parses objects for hypermedia properties and generates links
 * Identifies ID-like and linkable properties to create hypermedia links
 * @param {Object} obj - The object to parse for hypermedia properties
 * @param {string} rel - The relationship type for links
 * @param {string} item_collection - The collection name for items
 * @param {string} root - The root URL for relative links
 * @param {Set} seen - Set of already processed URIs to avoid duplicates
 * @param {Array} links - Array to collect generated links
 * @param {Object} server - The server object for permission checking
 * @returns {Object|null} The processed object or null if empty
 */
// Parsing the object for hypermedia properties
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
}

/**
 * Processes hypermedia links for responses including pagination and resource links
 * Handles collection pagination, resource linking, and hypermedia header generation
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {Object} rep - The response representation object
 * @returns {Object} The processed response with hypermedia links
 */
function hypermedia (req, res, rep) {
	const server = req.server,
		headers = res.getHeaders(),
		collection$1 = req.url,
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

	root = new url.URL(`${URL_127001}${req.url}${req.parsed.search}`);
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
						marshal(i, ITEM, req.url.replace(trailingSlash, EMPTY), root, seen, links, server);
					} else {
						const li = i.toString();

						if (li !== collection$1) {
							const uri = li.startsWith(SLASH) || li.indexOf(DOUBLE_SLASH) >= INT_0 ? li : `${collection$1.replace(/\s/g, ENCODED_SPACE)}/${li.replace(/\s/g, ENCODED_SPACE)}`.replace(/^\/\//, SLASH);

							if (uri !== collection$1 && server.allowed(GET, uri)) {
								links.push({uri: uri, rel: ITEM});
							}
						}
					}
				}
			}
		} else if (rep.data instanceof Object && req.hypermedia) {
			parent = req.url.split(SLASH).filter(i => i !== EMPTY);

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
			res.header(LINK, keysort.keysort(links, REL_URI).map(i => `<${i.uri}>; rel="${i.rel}"`).join(COMMA_SPACE$1));
		}

		if (exists && Array.isArray(rep?.links ?? EMPTY)) {
			rep.links = links;
		}
	}

	return rep;
}

/**
 * Middleware that terminates the request if the URL matches configured exit patterns
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
function exit (req, res, next) {
	if (req.server.exit.includes(req.url)) {
		req.exit();
	} else {
		next();
	}
}

/**
 * Request payload collection middleware that handles request body data
 * Collects request body data for non-multipart requests and enforces size limits
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
function payload (req, res, next) {
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
}

/**
 * Request body parsing middleware that uses registered parsers based on content type
 * Attempts to parse the request body and handles parsing errors
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
function parse (req, res, next) {
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
}

/**
 * Prometheus metrics setup
 * Creates histogram and counter metrics for HTTP requests
 * @param {Object} config - The Prometheus configuration object
 * @returns {Object} Object containing middleware function and metrics registry
 */
function prometheus(config) {
	// Create a Registry to register metrics
	const register = new promClient.Registry();

	// Add default metrics (process stats, etc.)
	if (config.includeUp) {
		promClient.collectDefaultMetrics({ register });
	}

	// Create histogram for request duration
	const httpRequestDuration = new promClient.Histogram({
		name: 'http_request_duration_seconds',
		help: 'Duration of HTTP requests in seconds',
		labelNames: ['method', 'route', 'status_code', ...Object.keys(config.customLabels || {})],
		buckets: config.buckets || [0.001, 0.01, 0.1, 1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 35, 40, 50, 70, 100, 200]
	});

	// Create counter for request count
	const httpRequestsTotal = new promClient.Counter({
		name: 'http_requests_total',
		help: 'Total number of HTTP requests',
		labelNames: ['method', 'route', 'status_code', ...Object.keys(config.customLabels || {})]
	});

	// Register metrics
	register.registerMetric(httpRequestDuration);
	register.registerMetric(httpRequestsTotal);

	// Middleware function
	const middleware = (req, res, next) => {
		const startTime = Date.now();
		
		// Store original end method
		const originalEnd = res.end;
		
		// Override end method to capture metrics
		res.end = function(...args) {
			const duration = (Date.now() - startTime) / 1000; // Convert to seconds
			const route = req.route || req.url || 'unknown';
			const method = req.method || 'unknown';
			const statusCode = res.statusCode || 0;
			
			// Build labels object
			const labels = {
				method: config.includeMethod ? method : 'HTTP',
				route: config.includePath ? route : '',
				status_code: config.includeStatusCode ? statusCode.toString() : '',
				...config.customLabels
			};
			
			// Record metrics
			httpRequestDuration.observe(labels, duration);
			httpRequestsTotal.inc(labels);
			
			// Call original end method
			originalEnd.apply(this, args);
		};
		
		if (typeof next === 'function') {
			next();
		}
	};

	// Return middleware function and register for metrics endpoint
	middleware.register = register;
	return middleware;
}

/**
 * Middleware that sets the async protection flag on the request object
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
function asyncFlag (req, res, next) {
	req.protectAsync = true;
	next();
}

/**
 * Middleware that determines if request should bypass protection based on CORS/OPTIONS or auth patterns
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
function bypass (req, res, next) {
	req.unprotect = req.cors && req.method === OPTIONS || req.server.auth.unprotect.some(i => i.test(req.url));
	next();
}

let memoized = false,
	cachedFn, cachedKey;

/**
 * CSRF protection middleware wrapper using lusca
 * Memoizes the CSRF function for performance and handles unprotected requests
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
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
}

/**
 * Authentication guard middleware that protects routes requiring authentication
 * Allows access to login URL or for authenticated users, otherwise returns 401
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
function guard (req, res, next) {
	const login = req.server.auth.uri.login;

	if (req.url === login || req.isAuthenticated()) {
		next();
	} else {
		res.error(INT_401);
	}
}

/**
 * Authentication redirect middleware that redirects to the configured auth redirect URI
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {void}
 */
function redirect (req, res) {
	res.redirect(req.server.auth.uri.redirect, false);
}

const rateHeaders = [
	X_RATELIMIT_LIMIT,
	X_RATELIMIT_REMAINING,
	X_RATELIMIT_RESET
];

/**
 * Rate limiting middleware that enforces request rate limits
 * Tracks request rates and returns 429 status when limits are exceeded
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
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
}

/**
 * Main protection middleware that coordinates authentication and rate limiting
 * Determines if a request should be protected based on auth patterns and handles rate limiting
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
function zuul (req, res, next) {
	const uri = req.url;
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
}

/**
 * Generates a random integer between 1 and n (inclusive)
 * @param {number} [n=INT_100] - The upper bound for the random number
 * @returns {number} A random integer between 1 and n
 */
function random (n = INT_100) {
	return node_crypto.randomInt(INT_1, n);
}

/**
 * Executes a function after a random delay or immediately if no delay is specified
 * @param {Function} [fn=() => void 0] - The function to execute
 * @param {number} [n=INT_0] - Maximum delay in milliseconds (0 means execute immediately)
 * @returns {void}
 */
function delay (fn = () => void 0, n = INT_0) {
	if (n === INT_0) {
		fn();
	} else {
		setTimeout(fn, random(n));
	}
}

/**
 * Checks if a value is an empty string
 * @param {*} [arg=EMPTY] - The value to check
 * @returns {boolean} True if the value equals the EMPTY constant, false otherwise
 */
function isEmpty (arg = EMPTY) {
	return arg === EMPTY;
}

const {Strategy: JWTStrategy, ExtractJwt} = passportJWT,
	groups = [PROTECT, UNPROTECT];

/**
 * Configures authentication middleware and strategies for the server
 * Sets up various authentication methods (Basic, Bearer, JWT, OAuth2) and security middleware
 * @param {Object} obj - The server configuration object
 * @returns {Object} The configured server object with authentication middleware
 */
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

		sesh = Object.assign({secret: node_crypto.randomUUID()}, objSession);

		if (obj.session.store === REDIS) {
			const client = redis.createClient(clone(obj.session.redis));

			sesh.store = new connectRedis.RedisStore({client});
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
				cb(new Error(http.STATUS_CODES[INT_401]), null);
			}
		};

		for (const i of obj.auth.basic.list || []) {
			let args = i.split(COLON);

			if (args.length > INT_0) {
				x[args[INT_0]] = {password: args[INT_1]};
			}
		}

		passport.use(new passportHttp.BasicStrategy((username, password, done) => {
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
				cb(new Error(http.STATUS_CODES[INT_401]), null);
			}
		};

		passport.use(new passportHttpBearer.Strategy((token, done) => {
			delay(() => {
				validate(token, (err, user) => {
					if (err !== null) {
						done(err);
					} else if (user === void 0) {
						done(null, false);
					} else {
						done(null, user, {scope: read});
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

		passport.use(new passportOauth2.Strategy({
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
}

const __dirname$1 = node_url.fileURLToPath(new node_url.URL(".", (typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('tenso.cjs', document.baseURI).href))));
const require$1 = node_module.createRequire((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('tenso.cjs', document.baseURI).href)));
const {name, version} = require$1(node_path.join(__dirname$1, "..", "package.json"));

/**
 * Tenso web framework class that extends Woodland
 * @class Tenso
 * @extends {Woodland}
 */
class Tenso extends woodland.Woodland {
	/**
	 * Creates an instance of Tenso
	 * @param {Object} [config=defaultConfig] - Configuration object for the Tenso instance
	 */
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
		return tinyEventsource.eventsource(...args);
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
					cert: this.ssl.cert ? node_fs.readFileSync(this.ssl.cert) : void INT_0,
					pfx: this.ssl.pfx ? node_fs.readFileSync(this.ssl.pfx) : void INT_0,
					key: this.ssl.key ? node_fs.readFileSync(this.ssl.key) : void INT_0,
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
function tenso (userConfig = {}) {
	const config$1 = tinyMerge.merge(clone(config), userConfig);

	if ((/^[^\d+]$/).test(config$1.port) && config$1.port < INT_1) {
		console.error(INVALID_CONFIGURATION);
		process.exit(INT_1);
	}

	config$1.title = config$1.title ?? name;
	config$1.version = version;
	config$1.webroot.root = node_path.resolve(config$1.webroot.root || node_path.join(__dirname$1, PREV_DIR, WWW));
	config$1.webroot.template = node_fs.readFileSync(config$1.webroot.template || node_path.join(config$1.webroot.root, TEMPLATE_FILE), {encoding: UTF8});

	if (config$1.silent !== true) {
		config$1.defaultHeaders.server = `tenso/${config$1.version}`;
		config$1.defaultHeaders[X_POWERED_BY] = `nodejs/${process.version}, ${process.platform}/${process.arch}`;
	}

	const app = new Tenso(config$1);

	return app.init();
}

exports.tenso = tenso;
