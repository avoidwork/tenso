import redis from "ioredis";
import cookie from "cookie-parser";
import session from "express-session";
import passport from "passport";
import passportJWT from "passport-jwt";
import {BasicStrategy} from "passport-http";
import {Strategy as BearerStrategy} from "passport-http-bearer";
import {Strategy as OAuth2Strategy} from "passport-oauth2";
import {STATUS_CODES} from "node:http";
import {asyncFlag} from "../middleware/asyncFlag.js";
import {bypass} from "../middleware/bypass.js";
import {csrfWrapper} from "../middleware/csrf.js";
import {guard} from "../middleware/guard.js";
import {redirect} from "../middleware/redirect.js";
import {zuul} from "../middleware/zuul.js";
import {clone} from "./clone.js";
import {delay} from "./delay.js";
import {isEmpty} from "./isEmpty.js";
import {randomUUID as uuid} from "node:crypto";
import {
	ALGORITHMS,
	AUDIENCE,
	AUTH,
	BASIC,
	BEARER,
	CALLBACK,
	COLON,
	EMPTY,
	I,
	INT_0,
	INT_1,
	INT_401,
	INT_443,
	INT_80,
	ISSUER,
	JWT,
	OAUTH2,
	PERIOD,
	PIPE,
	PROTECT,
	read,
	REDIS,
	REGEX_REPLACE,
	S,
	SLASH,
	UNDERSCORE,
	UNPROTECT,
	URI,
	WILDCARD
} from "../core/constants.js";
import {RedisStore} from "connect-redis";
import helmet from "helmet";

const {Strategy: JWTStrategy, ExtractJwt} = passportJWT,
	groups = [PROTECT, UNPROTECT];

// Regex cache to avoid recompiling the same patterns
const regexCache = new Map();

/**
 * Creates a cached regex pattern to avoid recompiling
 * @param {string} pattern - The regex pattern string
 * @param {string} flags - The regex flags
 * @returns {RegExp} The compiled regex pattern
 */
function createCachedRegex (pattern, flags = "") {
	const key = `${pattern}|${flags}`;

	if (!regexCache.has(key)) {
		regexCache.set(key, new RegExp(pattern, flags));
	}

	return regexCache.get(key);
}

/**
 * Converts a pattern string to a regex pattern with wildcard handling
 * @param {string} pattern - The pattern string
 * @param {string} loginUri - The login URI to compare against
 * @returns {string} The converted regex pattern
 */
function convertPatternToRegex (pattern, loginUri) {
	if (pattern === loginUri) {
		return `^${EMPTY}(/|$)`;
	}

	return `^${pattern.replace(/\.\*/g, WILDCARD).replace(/\*/g, `${PERIOD}${WILDCARD}`)}(/|$)`;
}

/**
 * Configures authentication middleware and strategies for the server
 * Sets up various authentication methods (Basic, Bearer, JWT, OAuth2) and security middleware
 * @param {Object} obj - The server configuration object
 * @returns {Object} The configured server object with authentication middleware
 */
export function auth (obj) {
	const ssl = obj.ssl.cert && obj.ssl.key,
		realm = `http${ssl ? S : EMPTY}://${obj.host}${obj.port !== INT_80 && obj.port !== INT_443 ? COLON + obj.port : EMPTY}`,
		async = obj.auth.oauth2.enabled || obj.auth.saml.enabled,
		stateless = obj.rate.enabled === false && obj.security.csrf === false,
		authDelay = obj.auth.delay,
		authMap = {},
		authUris = [];

	let sesh, fnCookie, fnSession, passportInit, passportSession;

	obj.ignore(asyncFlag);

	// Use cached regex compilation for auth patterns
	for (const k of groups) {
		obj.auth[k] = (obj.auth[k] || []).map(i => {
			const pattern = convertPatternToRegex(i, obj.auth.uri.login);

			return createCachedRegex(pattern, I);
		});
	}

	for (const i of Object.keys(obj.auth)) {
		if (obj.auth[i].enabled) {
			const uri = `${SLASH}${AUTH}${SLASH}${i}`;

			authMap[`${i}${UNDERSCORE}${URI}`] = uri;
			authUris.push(uri);
			obj.auth.protect.push(createCachedRegex(`^/auth/${i}(/|$)`));
		}
	}

	if (stateless === false) {
		const objSession = clone(obj.session);

		delete objSession.redis;
		delete objSession.store;

		sesh = Object.assign({secret: uuid(), resave: false, saveUninitialized: false}, objSession);

		if (obj.session.store === REDIS && !process.env.TEST_MODE) {
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
		// Handle both direct directives and nested policy structure
		const directives = obj.security.csp.policy || obj.security.csp;
		const helmetCsp = helmet.contentSecurityPolicy({
			directives: directives,
			useDefaults: true
		});

		obj.always(helmetCsp).ignore(helmetCsp);
	}

	if (isEmpty(obj.security.xframe || EMPTY) === false) {
		const helmetXFrame = helmet.xFrameOptions({
			action: obj.security.xframe
		});

		obj.always(helmetXFrame).ignore(helmetXFrame);
	}

	if (isEmpty(obj.security.p3p || EMPTY) === false) {
		// P3P is deprecated, but we can use xPermittedCrossDomainPolicies for similar functionality
		const helmetCrossDomain = helmet.xPermittedCrossDomainPolicies({
			permittedPolicies: obj.security.p3p === "none" ? "none" : "by-content-type"
		});

		obj.always(helmetCrossDomain).ignore(helmetCrossDomain);
	}

	if (obj.security.hsts instanceof Object) {
		const helmetHsts = helmet.strictTransportSecurity({
			maxAge: obj.security.hsts.maxAge || 31536000,
			includeSubDomains: obj.security.hsts.includeSubDomains !== false,
			preload: obj.security.hsts.preload === true
		});

		obj.always(helmetHsts).ignore(helmetHsts);
	}

	if (obj.security.xssProtection) {
		// Note: Helmet sets X-XSS-Protection to 0 by default (which is safer)
		// But if the config explicitly enables it, we'll respect that
		const helmetXss = helmet.xXssProtection();

		obj.always(helmetXss).ignore(helmetXss);
	}

	if (obj.security.nosniff) {
		const helmetNoSniff = helmet.xContentTypeOptions();

		obj.always(helmetNoSniff).ignore(helmetNoSniff);
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

		passport.use(new BearerStrategy((token, done) => {
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

		passport.use(new OAuth2Strategy({
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
