import {
	AUTO,
	BEARER,
	COOKIE_NAME,
	DEBUG,
	DEFAULT_CONTENT_TYPE,
	DEFAULT_VARY,
	EMPTY,
	EXPOSE_HEADERS,
	HEADER_APPLICATION_JSON,
	HEADER_CONTENT_TYPE,
	HEADER_VARY,
	HS256,
	HS384,
	HS512,
	INT_0,
	INT_1000,
	INT_25,
	INT_3,
	INT_300000,
	INT_429,
	INT_450,
	INT_5,
	INT_6379,
	INT_8000,
	INT_900,
	IP_0000,
	IP_127001,
	LOG_FORMAT,
	MEMORY,
	MSG_LOGIN,
	MSG_TOO_MANY_REQUESTS,
	PATH_ASSETS,
	SAMEORIGIN,
	SESSION_SECRET,
	SLASH,
	TENSO,
	URL_AUTH_LOGIN,
	URL_AUTH_LOGOUT,
	URL_AUTH_ROOT,
	UTF_8,
	WILDCARD,
	X_CSRF_TOKEN,
	VERSION
} from "./constants.js";

/**
 * Default configuration object for Tenso framework
 *
 * This configuration object contains all the default settings for a Tenso server instance.
 * It includes settings for authentication, security, logging, caching, middleware, and more.
 *
 * @typedef {Object} TensoConfig
 * @property {Object} auth - Authentication configuration
 * @property {number} auth.delay - Authentication delay in milliseconds (default: 0)
 * @property {Array<string>} auth.protect - Routes to protect with authentication
 * @property {Array<string>} auth.unprotect - Routes to exclude from authentication
 * @property {Object} auth.basic - Basic authentication settings
 * @property {boolean} auth.basic.enabled - Enable basic authentication
 * @property {Array} auth.basic.list - List of basic auth credentials
 * @property {Object} auth.bearer - Bearer token authentication settings
 * @property {boolean} auth.bearer.enabled - Enable bearer token authentication
 * @property {Array} auth.bearer.tokens - Valid bearer tokens
 * @property {Object} auth.jwt - JWT authentication settings
 * @property {boolean} auth.jwt.enabled - Enable JWT authentication
 * @property {Function|null} auth.jwt.auth - Custom JWT authentication function
 * @property {string} auth.jwt.audience - JWT audience claim
 * @property {Array<string>} auth.jwt.algorithms - Allowed JWT signing algorithms
 * @property {boolean} auth.jwt.ignoreExpiration - Ignore JWT expiration
 * @property {string} auth.jwt.issuer - JWT issuer claim
 * @property {string} auth.jwt.scheme - JWT authentication scheme
 * @property {string} auth.jwt.secretOrKey - JWT secret or private key
 * @property {Object} auth.msg - Authentication messages
 * @property {string} auth.msg.login - Login message
 * @property {Object} auth.oauth2 - OAuth2 authentication settings
 * @property {boolean} auth.oauth2.enabled - Enable OAuth2 authentication
 * @property {Function|null} auth.oauth2.auth - Custom OAuth2 authentication function
 * @property {string} auth.oauth2.auth_url - OAuth2 authorization URL
 * @property {string} auth.oauth2.token_url - OAuth2 token URL
 * @property {string} auth.oauth2.client_id - OAuth2 client ID
 * @property {string} auth.oauth2.client_secret - OAuth2 client secret
 * @property {Object} auth.uri - Authentication URI endpoints
 * @property {string} auth.uri.login - Login endpoint URI
 * @property {string} auth.uri.logout - Logout endpoint URI
 * @property {string} auth.uri.redirect - Post-authentication redirect URI
 * @property {string} auth.uri.root - Authentication root URI
 * @property {Object} auth.saml - SAML authentication settings
 * @property {boolean} auth.saml.enabled - Enable SAML authentication
 * @property {Function|null} auth.saml.auth - Custom SAML authentication function
 * @property {boolean} autoindex - Enable automatic directory indexing for static files
 * @property {number} cacheSize - Maximum number of items in memory cache (default: 1000)
 * @property {number} cacheTTL - Cache time-to-live in milliseconds (default: 300000)
 * @property {boolean} catchAll - Enable catch-all route handling for unmatched requests
 * @property {string} charset - Default character encoding for responses (default: "utf-8")
 * @property {string} corsExpose - CORS exposed headers
 * @property {Object} defaultHeaders - Default HTTP headers to include in all responses
 * @property {string} defaultHeaders["content-type"] - Default content type header
 * @property {string} defaultHeaders.vary - Default vary header
 * @property {number} digit - Number of decimal places for numeric formatting (default: 3)
 * @property {boolean} etags - Enable ETag generation for response caching
 * @property {Array} exit - Exit handlers to execute on server shutdown
 * @property {string} host - Server host address to bind to (default: "0.0.0.0")
 * @property {Object} hypermedia - Hypermedia/HATEOAS configuration
 * @property {boolean} hypermedia.enabled - Enable hypermedia links in responses
 * @property {boolean} hypermedia.header - Include hypermedia links in response headers
 * @property {Array} index - Index route configuration for root path handling
 * @property {Object} initRoutes - Initial route definitions to register on startup
 * @property {number} jsonIndent - JSON response indentation level (default: 0 for minified)
 * @property {Object} logging - Logging configuration
 * @property {boolean} logging.enabled - Enable logging output
 * @property {string} logging.format - Log message format
 * @property {string} logging.level - Minimum log level to output
 * @property {boolean} logging.stack - Include stack traces in error logs
 * @property {number} maxBytes - Maximum request body size in bytes (0 = unlimited)
 * @property {number} maxListeners - Maximum number of event listeners (default: 25)
 * @property {string} mimeType - Default MIME type for responses
 * @property {Array<string>} origins - Allowed CORS origins (default: ["*"])
 * @property {number} pageSize - Default pagination page size (default: 5)
 * @property {number} port - Server port number to listen on (default: 8000)
 * @property {Object} prometheus - Prometheus metrics configuration
 * @property {boolean} prometheus.enabled - Enable Prometheus metrics collection
 * @property {Object} prometheus.metrics - Metrics collection settings
 * @property {boolean} prometheus.metrics.includeMethod - Include HTTP method in metrics
 * @property {boolean} prometheus.metrics.includePath - Include request path in metrics
 * @property {boolean} prometheus.metrics.includeStatusCode - Include status code in metrics
 * @property {boolean} prometheus.metrics.includeUp - Include uptime metrics
 * @property {Array<number>} prometheus.metrics.buckets - Histogram buckets for response times
 * @property {Object} prometheus.metrics.customLabels - Custom metric labels
 * @property {Object} rate - Rate limiting configuration
 * @property {boolean} rate.enabled - Enable rate limiting
 * @property {number} rate.limit - Maximum requests per time window (default: 450)
 * @property {string} rate.message - Rate limit exceeded message
 * @property {Function|null} rate.override - Custom rate limit override function
 * @property {number} rate.reset - Rate limit reset window in seconds (default: 900)
 * @property {number} rate.status - HTTP status code for rate limit responses (default: 429)
 * @property {boolean} renderHeaders - Include headers in rendered output responses
 * @property {boolean} time - Include timing information in response headers
 * @property {Object} security - Security-related settings
 * @property {string} security.key - CSRF token header name
 * @property {string} security.secret - CSRF secret key
 * @property {boolean} security.csrf - Enable CSRF protection
 * @property {string|null} security.csp - Content Security Policy header value
 * @property {string} security.xframe - X-Frame-Options header value
 * @property {string} security.p3p - P3P privacy policy header value
 * @property {string|null} security.hsts - HTTP Strict Transport Security header value
 * @property {boolean} security.xssProtection - Enable X-XSS-Protection header
 * @property {boolean} security.nosniff - Enable X-Content-Type-Options: nosniff header
 * @property {Object} session - Session management configuration
 * @property {Object} session.cookie - Session cookie settings
 * @property {boolean} session.cookie.httpOnly - Set httpOnly flag on session cookies
 * @property {string} session.cookie.path - Session cookie path
 * @property {boolean} session.cookie.sameSite - Enable SameSite cookie attribute
 * @property {string} session.cookie.secure - Secure cookie setting ("auto", true, false)
 * @property {string} session.name - Session cookie name
 * @property {boolean} session.proxy - Trust proxy for secure cookies
 * @property {Object} session.redis - Redis session store configuration
 * @property {string} session.redis.host - Redis host address
 * @property {number} session.redis.port - Redis port number
 * @property {boolean} session.rolling - Enable rolling session expiration
 * @property {boolean} session.resave - Force session save even if not modified
 * @property {boolean} session.saveUninitialized - Save uninitialized sessions
 * @property {string} session.secret - Session signing secret
 * @property {string} session.store - Session store type ("memory", "redis", etc.)
 * @property {boolean} silent - Suppress console output and logging
 * @property {Object} ssl - SSL/TLS configuration
 * @property {string|null} ssl.cert - SSL certificate file path or content
 * @property {string|null} ssl.key - SSL private key file path or content
 * @property {string|null} ssl.pfx - SSL PFX file path or content
 * @property {Object} webroot - Web root and static file serving configuration
 * @property {string} webroot.root - Document root directory for static files
 * @property {string} webroot.static - Static assets directory path
 * @property {string} webroot.template - Template file path for rendered responses
 * @property {string} version - Framework version string
 *
 * @type {TensoConfig}
 */
export const config = {
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
	maxListeners: INT_25,
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
	},
	version: VERSION
};
