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
	X_CSRF_TOKEN
} from "./constants.js";

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
