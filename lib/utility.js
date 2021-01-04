"use strict";

const path = require("path"),
	{STATUS_CODES} = require("http"),
	{URL} = require("url"),
	retsu = require("retsu"),
	keysort = require("keysort"),
	redis = require("redis"),
	session = require("express-session"),
	cookie = require("cookie-parser"),
	lusca = require("lusca"),
	uuid = require("tiny-uuid4"),
	woodland = require("woodland"),
	middleware = require(path.join(__dirname, "middleware.js")),
	regex = require(path.join(__dirname, "regex.js")),
	serializers = require(path.join(__dirname, "serializers.js")),
	passport = require("passport"),
	jwt = require("passport-jwt"),
	BasicStrategy = require("passport-http").BasicStrategy,
	BearerStrategy = require("passport-http-bearer").Strategy,
	JWTStrategy = jwt.Strategy,
	ExtractJwt = jwt.ExtractJwt,
	LocalStrategy = require("passport-local").Strategy,
	OAuth2Strategy = require("passport-oauth2").Strategy,
	SAMLStrategy = require("passport-saml").Strategy,
	RedisStore = require("connect-redis")(session),
	groups = ["protect", "unprotect"];

function explode (arg = "", delimiter = ",") {
	return arg.trim().split(new RegExp(`\\s*${delimiter}\\s*`));
}

function capitalize (obj, e = false, delimiter = " ") {
	return e ? explode(obj, delimiter).map(capitalize).join(delimiter) : obj.charAt(0).toUpperCase() + obj.slice(1);
}

function clone (arg) {
	return JSON.parse(JSON.stringify(arg));
}

function isEmpty (obj) {
	return obj.length === 0;
}

function random (n = 100) {
	return Math.floor(Math.random() * n) + 1;
}

function delay (fn = () => void 0, n = 0) {
	if (n === 0) {
		fn();
	} else {
		setTimeout(fn, random(n));
	}
}

function auth (obj, config) {
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
				if (err === void 0) {
					if (typeof req.csrfToken === "function" && req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
						res.header(req.server.config.security.key, req.csrfToken());
					}
				}

				next(err);
			});
		}
	}

	function redirect (req, res) {
		res.redirect(config.auth.uri.redirect, false);
	}

	obj.router.ignore(middleware.asyncFlag);

	for (const k of groups) {
		config.auth[k] = (config.auth[k] || []).map(i => new RegExp(`^${i !== config.auth.uri.login ? i.replace(/\.\*/g, "*").replace(/\*/g, ".*") : ""}(\/|$)`, "i"));
	}

	for (const i of Object.keys(config.auth)) {
		if (config.auth[i].enabled) {
			authMap[`${i}_uri`] = `/auth/${i}`;
			authUris.push(`/auth/${i}`);
			config.auth.protect.push(new RegExp(`^/auth/${i}(\/|$)`));
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

		obj.always(fnSession).ignore(fnSession);
		obj.always(fnCookie).ignore(fnCookie);
		obj.always(middleware.bypass).ignore(middleware.bypass);

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
	obj.always(middleware.zuul).ignore(middleware.zuul);

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
			callbackURL: realm + "/auth/oauth2/callback"
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

		obj.get("/auth/oauth2", middleware.asyncFlag);
		obj.get("/auth/oauth2", passport.authenticate("oauth2"));
		obj.get("/auth/oauth2/callback", middleware.asyncFlag);
		obj.get("/auth/oauth2/callback", passport.authenticate("oauth2", {failureRedirect: config.auth.uri.login}));
		obj.get("/auth/oauth2/callback", redirect);
	} else if (config.auth.saml.enabled) {
		let arg = config.auth.saml;

		arg.callbackURL = realm + "/auth/saml/callback";
		delete arg.enabled;
		delete arg.path;

		passport.use(new SAMLStrategy(arg, (profile, done) => {
			delay(() => {
				config.auth.saml.auth(profile, (err, user) => {
					if (err !== null) {
						done(err);
					} else {
						done(null, user);
					}
				});
			}, authDelay);
		}));

		obj.get("/auth/saml", middleware.asyncFlag);
		obj.get("/auth/saml", passport.authenticate("saml"));
		obj.get("/auth/saml/callback", middleware.asyncFlag);
		obj.get("/auth/saml/callback", passport.authenticate("saml", {failureRedirect: config.auth.uri.login}));
		obj.get("/auth/saml/callback", redirect);
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
		obj.always(r, middleware.guard).ignore(middleware.guard);

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

function bootstrap (obj) {
	const authorization = Object.keys(obj.config.auth).filter(i => {
		const x = obj.config.auth[i];

		return x instanceof Object && x.enabled === true;
	}).length > 0 || obj.config.rate.enabled || obj.config.security.csrf;

	obj.version = obj.config.version;

	// Creating router
	obj.router = woodland({
		cacheSize: obj.config.cacheSize,
		cacheTTL: obj.config.cacheTTL,
		corsExpose: obj.config.corsExpose,
		defaultHeaders: obj.config.headers,
		indexes: obj.config.index,
		logging: obj.config.logging,
		origins: obj.config.origins,
		sendError: true,
		time: true
	});

	// Setting up router
	obj.router.addListener("connect", obj.connect.bind(obj));
	obj.router.onsend = (req, res, body = "", status = 200, headers) => {
		res.statusCode = status;

		if (status !== 204 && status !== 304 && (body === null || typeof body.on !== "function")) {
			body = obj.render(req, res, obj.final(req, res, hypermedia(req, res, serialize(req, res, body)))); // eslint-disable-line no-use-before-define
		}

		return [body, status, headers];
	};

	// Payload handling
	obj.always(middleware.payload).ignore(middleware.payload);
	obj.always(middleware.parse).ignore(middleware.parse);

	// Setting 'always' routes before authorization runs
	const routes = obj.config.routes.always || {};

	for (const i of Object.keys(routes)) {
		if (typeof routes[i] === "function") {
			obj.always(i, routes[i]).ignore(routes[i]);
		}
	}

	delete obj.config.routes.always;

	if (authorization) {
		auth(obj, obj.config);
	}

	// Static assets on disk for browseable interface
	if (obj.config.static !== "") {
		const spath = obj.config.static.endsWith("/") ? obj.config.static.replace(/\/$/, "") : obj.config.static,
			sfolder = path.join(__dirname, "..", "www", obj.config.static),
			sregex = new RegExp(`${spath.replace(/\//g, "\\/")}(\\/)?`);

		obj.config.routes.get[`${spath}(/.*)?`] = (req, res) => req.server.router.serve(req, res, req.url.replace(sregex, ""), sfolder);
	}

	// Setting routes
	for (const method of Object.keys(obj.config.routes)) {
		const lroutes = obj.config.routes[method];

		for (const i of Object.keys(lroutes)) {
			if (typeof lroutes[i] === "function") {
				obj[method](i, lroutes[i]);
			} else {
				obj[method](i, (req, res) => res.send(lroutes[i]));
			}
		}
	}

	return obj;
}

function id (arg = "") {
	return arg === "id" || arg === "_id" || arg === "ID" || arg === "_ID";
}

function scheme (arg = "") {
	return arg.includes("://") || arg[0] === "/";
}

function hypermedia (req, res, rep) {
	const server = req.server,
		headers = res.getHeaders(),
		collection = req.parsed.pathname,
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
					if (lid || regex.hypermedia.test(i)) {
						const lkey = obj[i].toString();

						if (lid === false) {
							lcollection = i.replace(regex.trailing, "").replace(regex.trailingS, "").replace(regex.trailingY, "ie") + "s";
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
	page_size = Number(query.get("page_size")) || server.config.pageSize || 5;

	if (page < 1) {
		page = 1;
	}

	if (page_size < 1) {
		page_size = server.config.pageSize || 5;
	}

	root = new URL(`http://127.0.0.1${req.parsed.pathname}${req.parsed.search}`);
	root.searchParams.delete("page");
	root.searchParams.delete("page_size");

	if (root.pathname !== "/") {
		const proot = root.pathname.replace(regex.trailingSlash, "").replace(regex.collection, "$1") || "/";

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
					rep.data = retsu.limit(rep.data, (page - 1) * page_size, page_size);
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
						marshal(i, "item", req.parsed.pathname.replace(regex.trailingSlash, ""));
					} else {
						const li = i.toString();

						if (li !== collection) {
							const uri = li.indexOf("//") >= 0 ? li : `${collection.replace(/\s/g, "%20")}/${li.replace(/\s/g, "%20")}`.replace(/^\/\//, "/");

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

			rep.data = marshal(rep.data, void 0, retsu.last(parent));
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
}

function sort (arg, req) {
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
}

function serialize (req, res, arg) {
	const status = res.statusCode;
	let format = req.server.config.mimeType,
		accepts = explode(req.parsed.searchParams.get("format") || req.headers.accept || res.getHeader("content-type") || format, ","),
		errz = arg instanceof Error,
		result, serializer;

	for (const i of accepts) {
		let mimetype = i.replace(regex.mimetype, "");

		if (serializers.has(mimetype)) {
			format = mimetype;
			break;
		}
	}

	serializer = serializers.get(format);
	res.removeHeader("content-type");
	res.header("content-type", `${format}; charset=utf-8`);

	if (errz) {
		result = serializer(null, arg, status < 400 ? 500 : status, req.server.config.logging.stackWire);
	} else {
		result = serializer(sort(arg, req), null, status);
	}

	return result;
}

module.exports = {
	auth,
	bootstrap,
	capitalize,
	clone,
	explode,
	hypermedia,
	serialize,
	sort
};
