import redis from "ioredis";
import cookie from "cookie-parser";
import session from "express-session";
import passport from "passport";
import jwt from "passport-jwt";
import {BasicStrategy} from "passport-http";
import {Strategy as BearerStrategy} from "passport-http-bearer";
import {Strategy as LocalStrategy} from "passport-local";
import {Strategy as OAuth2Strategy} from "passport-oauth2";
import {STATUS_CODES} from "node:http";
import {asyncFlag} from "../middleware/asyncFlag.js";
import {bypass} from "../middleware/bypass.js";
import {guard} from "../middleware/guard.js";
import {zuul} from "../middleware/zuul.js";
import {clone} from "./clone.js";
import {delay} from "./delay.js";
import {isEmpty} from "./isEmpty.js";
import {randomUUID as uuid} from "node:crypto";
import {PROTECT, UNPROTECT} from "./constants.js";

const {JWTStrategy, ExtractJwt} = jwt.Strategy,
	RedisStore = require("connect-redis")(session),
	groups = [PROTECT, UNPROTECT];

export function auth (obj, config) {
	const ssl = config.ssl.cert && config.ssl.key,
		realm = `http${ssl ? "s" : ""}://${config.host}${config.port !== 80 && config.port !== 443 ? ":" + config.port : ""}`,
		async = config.auth.oauth2.enabled || config.auth.saml.enabled,
		stateless = config.rate.enabled === false && config.security.csrf === false && config.auth.local.enabled === false,
		authDelay = config.auth.delay,
		authMap = {},
		authUris = [];

	let sesh, fnCookie, fnSession, luscaCsp, luscaCsrf, luscaXframe, luscaP3p, luscaHsts, luscaXssProtection,
		luscaNoSniff,
		passportInit, passportSession;

	function csrfWrapper (req, res, next) {
		if (req.unprotect) {
			next();
		} else {
			luscaCsrf(req, res, err => {
				const key = req.server.config.security.key;

				if (err === void 0 && req.csrf && key in res.locals) {
					res.header(req.server.config.security.key, res.locals[key]);
				}

				next(err);
			});
		}
	}

	function redirect (req, res) {
		res.redirect(config.auth.uri.redirect, false);
	}

	obj.router.ignore(asyncFlag);

	for (const k of groups) {
		config.auth[k] = (config.auth[k] || []).map(i => new RegExp(`^${i !== config.auth.uri.login ? i.replace(/\.\*/g, "*").replace(/\*/g, ".*") : ""}(\/|$)`, "i"));
	}

	for (const i of Object.keys(config.auth)) {
		if (config.auth[i].enabled) {
			authMap[`${i}_uri`] = `/auth/${i}`;
			authUris.push(`/auth/${i}`);
			config.auth.protect.push(new RegExp(`^/auth/${i}(/|$)`));
		}
	}

	if (config.auth.local.enabled) {
		authUris.push(config.auth.uri.redirect);
		authUris.push(config.auth.uri.login);
	}

	if (stateless === false) {
		const configSession = clone(config.session);

		delete configSession.redis;
		delete configSession.store;

		sesh = Object.assign({secret: uuid()}, configSession);

		if (config.session.store === "redis") {
			const client = redis.createClient(clone(config.session.redis));

			sesh.store = new RedisStore({client});
		}

		fnCookie = cookie();
		fnSession = session(sesh);

		obj.always(fnCookie).ignore(fnCookie);
		obj.always(fnSession).ignore(fnSession);
		obj.always(bypass).ignore(bypass);

		if (config.security.csrf) {
			luscaCsrf = lusca.csrf({key: config.security.key, secret: config.security.secret});
			obj.always(csrfWrapper).ignore(csrfWrapper);
		}
	}

	if (config.security.csp instanceof Object) {
		luscaCsp = lusca.csp(config.security.csp);
		obj.always(luscaCsp).ignore(luscaCsp);
	}

	if (isEmpty(config.security.xframe || "") === false) {
		luscaXframe = lusca.xframe(config.security.xframe);
		obj.always(luscaXframe).ignore(luscaXframe);
	}

	if (isEmpty(config.security.p3p || "") === false) {
		luscaP3p = lusca.p3p(config.security.p3p);
		obj.always(luscaP3p).ignore(luscaP3p);
	}

	if (config.security.hsts instanceof Object) {
		luscaHsts = lusca.hsts(config.security.hsts);
		obj.always(luscaHsts).ignore(luscaHsts);
	}

	if (config.security.xssProtection) {
		luscaXssProtection = lusca.xssProtection(config.security.xssProtection);
		obj.always(luscaXssProtection).ignore(luscaXssProtection);
	}

	if (config.security.nosniff) {
		luscaNoSniff = lusca.nosniff();
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

	if (config.auth.basic.enabled) {
		let x = {};

		const validate = (arg, cb) => {
			if (x[arg] !== void 0) {
				cb(null, x[arg]);
			} else {
				cb(new Error(STATUS_CODES[401]), null);
			}
		};

		for (const i of config.auth.basic.list || []) {
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

		if (async || config.auth.local.enabled) {
			obj.get("/auth/basic", passportAuth).ignore(passportAuth);
			obj.get("/auth/basic", redirect);
		} else {
			obj.always(passportAuth).ignore(passportAuth);
		}
	} else if (config.auth.bearer.enabled) {
		const validate = (arg, cb) => {
			if (obj.config.auth.bearer.tokens.includes(arg)) {
				cb(null, arg);
			} else {
				cb(new Error(STATUS_CODES[401]), null);
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
						done(null, user, {scope: "read"});
					}
				});
			}, authDelay);
		}));

		const passportAuth = passport.authenticate("bearer", {session: stateless === false});

		if (async || config.auth.local.enabled) {
			obj.get("/auth/bearer", passportAuth).ignore(passportAuth);
			obj.get("/auth/bearer", redirect);
		} else {
			obj.always(passportAuth).ignore(passportAuth);
		}
	} else if (config.auth.jwt.enabled) {
		const opts = {
			jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme(config.auth.jwt.scheme),
			secretOrKey: config.auth.jwt.secretOrKey,
			ignoreExpiration: config.auth.jwt.ignoreExpiration === true
		};

		for (const i of ["algorithms", "audience", "issuer"]) {
			if (config.auth.jwt[i] !== void 0) {
				opts[i] = config.auth.jwt[i];
			}
		}

		passport.use(new JWTStrategy(opts, (token, done) => {
			delay(() => {
				config.auth.jwt.auth(token, (err, user) => {
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
	} else if (config.auth.local.enabled) {
		passport.use(new LocalStrategy((username, password, done) => {
			delay(() => {
				config.auth.local.auth(username, password, (err, user) => {
					if (err !== null) {
						done(err);
					} else {
						done(null, user);
					}
				});
			}, authDelay);
		}));

		config.routes.post = config.routes.post || {};
		config.routes.post[config.auth.uri.login] = (req, res) => {
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
		};
	} else if (config.auth.oauth2.enabled) {
		passport.use(new OAuth2Strategy({
			authorizationURL: config.auth.oauth2.auth_url,
			tokenURL: config.auth.oauth2.token_url,
			clientID: config.auth.oauth2.client_id,
			clientSecret: config.auth.oauth2.client_secret,
			callbackURL: `${realm}/auth/oauth2/callback`
		}, (accessToken, refreshToken, profile, done) => {
			delay(() => {
				config.auth.oauth2.auth(accessToken, refreshToken, profile, (err, user) => {
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
		obj.get("/auth/oauth2/callback", passport.authenticate("oauth2", {failureRedirect: config.auth.uri.login}));
		obj.get("/auth/oauth2/callback", redirect);
	}

	if (authUris.length > 0) {
		if (Object.keys(authMap).length > 0) {
			config.routes.get[config.auth.uri.root] = authMap;
		}

		let r = `(?!${config.auth.uri.root}/(`;

		for (const i of authUris) {
			r += i.replace("_uri", "") + "|";
		}

		r = r.replace(/\|$/, "") + ")).*$";
		obj.always(r, guard).ignore(guard);

		config.routes.get[config.auth.uri.login] = {
			instruction: config.auth.msg.login
		};
	} else if (config.auth.local.enabled) {
		config.routes.get[config.auth.uri.login] = {
			instruction: config.auth.msg.login
		};
	}

	config.routes.get[config.auth.uri.logout] = (req, res) => {
		if (req.session !== void 0) {
			req.session.destroy();
		}

		redirect(req, res);
	};

	return config;
}
