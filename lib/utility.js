"use strict";

const path = require("path"),
	http = require("http"),
	retsu = require("retsu"),
	keysort = require("keysort"),
	session = require("express-session"),
	cookie = require("cookie-parser"),
	lusca = require("lusca"),
	uuid = require("tiny-uuid4"),
	woodland = require("woodland"),
	etag = require("tiny-etag"),
	middleware = require(path.join(__dirname, "middleware.js")),
	regex = require(path.join(__dirname, "regex.js")),
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
	all = "all",
	groups = ["protect", "unprotect"];

let uws, coap;

try {
	uws = require("uws");
	coap = require("coap");
} catch (e) {
	void 0;
}

function trim (obj) {
	return obj.replace(/^(\s+|\t+|\n+)|(\s+|\t+|\n+)$/g, "");
}

function explode (obj, arg = ",") {
	return trim(obj).split(new RegExp(`\s*${arg}`)).map(i => trim(i));
}

function capitalize (obj, each = false, delimiter = " ") {
	return each ? explode(obj, delimiter).map(capitalize).join(delimiter) : obj.charAt(0).toUpperCase() + obj.slice(1);
}

function clone (arg) {
	return JSON.parse(JSON.stringify(arg));
}

function isEmpty (obj) {
	return trim(obj) === "";
}

function random () {
	return Math.floor(Math.random() * 100) + 1;
}

function delay (fn) {
	setTimeout(fn, random());
}

function auth (obj, config) {
	const ssl = config.ssl.cert && config.ssl.key,
		realm = `http${(ssl ? "s" : "")}://${(config.hostname === "localhost" ? "127.0.0.1" : config.hostname)}${(config.port !== 80 && config.port !== 443 ? ":" + config.port : "")}`,
		async = (config.auth.facebook.enabled || config.auth.google.enabled || config.auth.linkedin.enabled || config.auth.twitter.enabled) !== false,
		stateless = (config.auth.basic.enabled || config.auth.bearer.enabled || config.auth.jwt.enabled) !== false,
		stateful = (async || config.auth.local.enabled || config.security.csrf) !== false,
		authMap = {},
		authUris = [];

	let keys, sesh, fnCookie, fnSession, luscaCsp, luscaCsrf, luscaXframe, luscaP3p, luscaHsts, luscaXssProtection, luscaNoSniff,
		passportAuth, passportInit, passportSession;

	function csrfWrapper (req, res, next) {
		if (req.unprotect === true) {
			next();
		} else {
			luscaCsrf(req, res, next);
		}
	}

	function init (sess) {
		passportInit = passport.initialize();
		obj.router.use(passportInit, all).blacklist(passportInit);

		if (sess === true) {
			passportSession = passport.session();
			obj.router.use(passportSession, all).blacklist(passportSession);
		}
	}

	function redirect (req, res) {
		res.redirect(config.auth.redirect);
	}

	obj.router.use(middleware.parse, all).blacklist(middleware.parse);
	obj.router.blacklist(middleware.asyncFlag);

	retsu.each(groups, k => {
		config.auth[k] = (config.auth[k] || []).map(i => new RegExp(`^${(i !== "/login" ? i.replace(/\.\*/g, "*").replace(/\*/g, ".*") : "$")}`, "i"));
	});

	if (async === true) {
		retsu.each(Object.keys(config.auth), i => {
			if (config.auth[i].enabled === true) {
				authMap[`${i}_uri`] = `/auth/${i}`;
				authUris.push(`/auth/${i}`);
				config.auth.protect.push(new RegExp(`^/auth/${i}`));
			}
		});
	}

	if (config.auth.local.enabled === true) {
		authUris.push(config.auth.redirect);
		authUris.push("/login");
	}

	if (stateful === true) {
		sesh = {
			cookie: config.session.cookie,
			secret: config.session.secret || uuid(),
			saveUninitialized: true,
			rolling: true,
			resave: true
		};

		if (config.session.store === "redis") {
			sesh.store = new RedisStore(config.session.redis);
		}

		fnCookie = cookie();
		fnSession = session(sesh);

		obj.router.use(fnSession, all).blacklist(fnSession);
		obj.router.use(fnCookie, all).blacklist(fnCookie);
		obj.router.use(middleware.bypass, all).blacklist(middleware.bypass);

		if (config.security.csrf === true) {
			luscaCsrf = lusca.csrf({key: config.security.key, secret: config.security.secret});
			obj.router.use(csrfWrapper, all).blacklist(csrfWrapper);
		}
	}

	if (config.security.csp instanceof Object) {
		luscaCsp = lusca.csp(config.security.csp);
		obj.router.use(luscaCsp, all).blacklist(luscaCsp);
	}

	if (isEmpty(config.security.xframe || "") === false) {
		luscaXframe = lusca.xframe(config.security.xframe);
		obj.router.use(luscaXframe, all).blacklist(luscaXframe);
	}

	if (isEmpty(config.security.p3p || "") === false) {
		luscaP3p = lusca.p3p(config.security.p3p);
		obj.router.use(luscaP3p, all).blacklist(luscaP3p);
	}

	if (config.security.hsts instanceof Object) {
		luscaHsts = lusca.hsts(config.security.hsts);
		obj.router.use(luscaHsts, all).blacklist(luscaHsts);
	}

	if (config.security.xssProtection === true) {
		luscaXssProtection = lusca.xssProtection(config.security.xssProtection);
		obj.router.use(luscaXssProtection, all).blacklist(luscaXssProtection);
	}

	if (config.security.nosniff === true) {
		luscaNoSniff = lusca.nosniff();
		obj.router.use(luscaNoSniff, all).blacklist(luscaNoSniff);
	}

	// Can fork to `middleware.keymaster()`
	obj.router.use(middleware.zuul, all).blacklist(middleware.zuul);

	if (stateless === true && stateful === false) {
		init(false);
	} else {
		init(true);
		passport.serializeUser((user, done) => done(null, user));
		passport.deserializeUser((arg, done) => done(null, arg));

		if (authUris.length > 0) {
			keys = Object.keys(authMap).length > 0;

			if (keys === true) {
				config.routes.get["/auth"] = authMap;
			}

			(function () {
				let r = "(?!/auth/(";

				retsu.each(authUris, i => {
					r += i.replace("_uri", "") + "|";
				});

				r = r.replace(/\|$/, "") + ")).*$";
				obj.router.use(r, middleware.guard, all).blacklist(middleware.guard);
			}());

			config.routes.get["/login"] = config.auth.local.enabled ? keys ? {
				login_uri: "/auth",
				instruction: "POST 'username' & 'password' to authenticate"
			} : {instruction: "POST 'username' & 'password' to authenticate"} : {login_uri: "/auth"};
		} else if (config.auth.local.enabled === true) {
			config.routes.get["/login"] = {instruction: "POST 'username' & 'password' to authenticate"};
		}

		config.routes.get["/logout"] = (req, res) => {
			if (req.session !== void 0) {
				req.session.destroy();
			}

			res.redirect(config.auth.redirect);
		};
	}

	if (config.auth.basic.enabled === true) {
		(function () {
			let x = {};

			function validate (arg, cb) {
				if (x[arg] !== void 0) {
					cb(null, x[arg]);
				} else {
					cb(new Error("Unauthorized"), null);
				}
			}

			retsu.each(config.auth.basic.list || [], i => {
				let args = i.split(":");

				if (args.length > 0) {
					x[args[0]] = {password: args[1]};
				}
			});

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
				});
			}));

			passportAuth = passport.authenticate("basic", {session: stateful});

			if (async === true || config.auth.local.enabled === true) {
				obj.get("/auth/basic", passportAuth).blacklist(passportAuth);
				obj.get("/auth/basic", redirect);
			} else {
				obj.router.use(passportAuth, all).blacklist(passportAuth);
			}
		}());
	}

	if (config.auth.bearer.enabled === true) {
		(function () {
			let x = config.auth.bearer.tokens || [];

			function validate (arg, cb) {
				if (x.includes(arg) === true) {
					cb(null, arg);
				} else {
					cb(new Error("Unauthorized"), null);
				}
			}

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
				});
			}));

			passportAuth = passport.authenticate("bearer", {session: stateful});

			if (async === true || config.auth.local.enabled === true) {
				obj.get("/auth/bearer", passportAuth).blacklist(passportAuth);
				obj.get("/auth/bearer", redirect);
			} else {
				obj.router.use(passportAuth, all).blacklist(passportAuth);
			}
		}());
	}

	if (config.auth.jwt.enabled === true) {
		(function () {
			const opts = {
				jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme(config.auth.jwt.scheme),
				secretOrKey: config.auth.jwt.secretOrKey,
				ignoreExpiration: config.auth.jwt.ignoreExpiration === true
			};

			retsu.each(["algorithms", "audience", "issuer"], i => {
				if (config.auth.jwt[i] !== void 0) {
					opts[i] = config.auth.jwt[i];
				}
			});

			passport.use(new JWTStrategy(opts, (token, done) => {
				delay(() => {
					config.auth.jwt.auth(token, (err, user) => {
						if (err !== null) {
							done(err);
						} else {
							done(null, user);
						}
					});
				});
			}));

			passportAuth = passport.authenticate("jwt", {session: false});
			obj.router.use(passportAuth, all).blacklist(passportAuth);
		}());
	}

	if (config.auth.local.enabled === true) {
		passport.use(new LocalStrategy((username, password, done) => {
			delay(() => {
				config.auth.local.auth(username, password, (err, user) => {
					if (err !== null) {
						done(err);
					} else {
						done(null, user);
					}
				});
			});
		}));

		config.routes.post = config.routes.post || {};
		config.routes.post["/login"] = (req, res) => {
			function final () {
				passport.authenticate("local")(req, res, e => {
					if (e !== void 0) {
						res.error(401, "Unauthorized");
					} else if (req.cors === true && req.headers["x-requested-with"] === "XMLHttpRequest") {
						res.send("Success");
					} else {
						res.redirect(config.auth.redirect);
					}
				});
			}

			function mid () {
				passportSession(req, res, final);
			}

			passportInit(req, res, mid);
		};
	}

	if (config.auth.oauth2.enabled === true) {
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
			});
		}));

		obj.get("/auth/oauth2", middleware.asyncFlag);
		obj.get("/auth/oauth2", passport.authenticate("oauth2"));
		obj.get("/auth/oauth2/callback", middleware.asyncFlag);
		obj.get("/auth/oauth2/callback", passport.authenticate("oauth2", {failureRedirect: "/login"}));
		obj.get("/auth/oauth2/callback", redirect);
	}

	if (config.auth.saml.enabled === true) {
		(function () {
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
				});
			}));
		}());

		obj.get("/auth/saml", middleware.asyncFlag);
		obj.get("/auth/saml", passport.authenticate("saml"));
		obj.get("/auth/saml/callback", middleware.asyncFlag);
		obj.get("/auth/saml/callback", passport.authenticate("saml", {failureRedirect: "/login"}));
		obj.get("/auth/saml/callback", redirect);
	}

	return config;
}

function bootstrap (obj) {
	obj.version = obj.config.version;

	obj.etags = etag({
		cacheSize: obj.config.cacheSize,
		cacheTTL: obj.config.cacheTTL,
		seed: obj.config.seed,
		notify: obj.config.etags.notify,
		onchange: obj.config.etags.onchange
	});

	if (typeof obj.config.etags.update === "function") {
		obj.etags.cache.update = obj.config.etags.update;
	}

	obj.router = woodland({
		cacheSize: obj.config.cacheSize,
		cacheTTL: obj.config.cacheTTL,
		coerce: obj.config.coerce,
		defaultHeaders: obj.config.headers,
		http2: obj.config.http2,
		seed: obj.config.seed
	});

	// Setting up router
	obj.router.onconnect = (req, res) => {
		req.protect = false;
		req.protectAsync = false;
		req.unprotect = false;
		req.server = obj;
		res.error = (status, body) => obj.respond(req, res, body !== void 0 ? body instanceof Error ? body : new Error(body) : new Error(http.STATUS_CODES[status]), status);
		res.json = (...args) => obj.respond(req, res, ...args);
		res.redirect = (uri, perm = false) => obj.redirect(req, res, uri, perm);
		res.send = (body, status, headers) => {
			const correct = typeof body !== "number" || typeof status === "number";

			return obj.respond(req, res, correct ? body : status, correct ? status : body, headers);
		};
	};

	obj.router.onerror = obj.error;
	obj.router.onfinish = (req, res) => obj.log(obj.clf(req, res, res.getHeaders()), "info");
	retsu.each([obj.etags.middleware, middleware.timer, middleware.payload], fn => obj.use("/.*", fn, "all", "all").blacklist(fn));

	// Bootstrapping configuration
	auth(obj, obj.config);

	// Starting WebSocket server
	if (obj.config.websocket.enabled && uws !== void 0) {
		obj.websocket = new uws.Server(obj.config.websocket.options);
		obj.log(`Started WebSocket server on ${obj.config.hostname}:${obj.config.websocket.options.port}`, "debug");
	}

	// Starting COAP server
	if (obj.config.coap.enabled && coap !== void 0) {
		obj.coap = coap.createServer({type: obj.config.coap.options.type});
		obj.coap.listen(obj.config.coap.options.port, obj.config.hostname);
		obj.log(`Started COAP (${obj.config.coap.options.type}) server on ${obj.config.hostname}:${obj.config.coap.options.port}`, "debug");
	}

	// Static assets on disk for browseable interface
	if (obj.config.static !== "") {
		obj.config.routes.get[obj.config.static] = middleware.static;
	}

	// Setting routes
	retsu.each(Object.keys(obj.config.routes), k => {
		const method = k,
			routes = obj.config.routes[method];

		if (method === "coap") {
			if (obj.coap !== null) {
				retsu.each(Object.keys(routes), i => {
					obj.log(`COAP event handler: '${i}'`, "debug");
					obj.coap.on(i, (req, res) => routes[i](req, res, obj.coap, obj));
				});
			}
		} else if (method === "socket") {
			if (obj.websocket !== null) {
				const noop = function () {};

				obj.websocket.on("connection", ws => {
					ws.on("message", arg => (routes.message || noop)(arg, ws));
					ws.on("close", routes.close || noop);
					(routes.connection || noop)(ws);
				});
			}
		} else {
			retsu.each(Object.keys(routes), i => {
				if (typeof routes[i] === "function") {
					obj[method](i, (...args) => routes[i](...args));
				} else {
					obj[method](i, (req, res) => res.send(routes[i]));
				}
			});
		}
	});

	// Disabling compression over SSL due to BREACH
	if (obj.config.ssl.cert !== null && obj.config.ssl.key !== null) {
		obj.config.compress = false;
		obj.log("Compression over SSL is disabled for your protection", "debug");
	}

	return obj;
}

function error (req, res, obj, reject, e, headers) {
	try {
		if (obj.config.http2 === false) {
			res.statusCode = 500;
			res.writeHead(500, headers);
			res.end(http.STATUS_CODES[500]);
		} else {
			obj.router.http2Send(req, res, http.STATUS_CODES[500], 500, headers);
		}

		obj.log(e.stack, "warn");
	} catch (err) {
		obj.log(err.stack || err.message || err, "warn");
	}

	reject(e);
}

function hypermedia (server, req, rep, headers) {
	const collection = req.parsed.pathname,
		links = [];
	let query, page, page_size, nth, root, proot, parent;

	// Parsing the object for hypermedia properties
	function marshal (obj, rel, item_collection) {
		let keys = Object.keys(obj),
			lrel = rel || "related",
			result;

		if (keys.length === 0) {
			result = null;
		} else {
			const seen = new Set();

			retsu.each(keys, i => {
				let lcollection, uri;

				// If ID like keys are found, and are not URIs, they are assumed to be root collections
				if (regex.id.test(i) === true || regex.hypermedia.test(i) === true) {
					if (regex.id.test(i) === false) {
						lcollection = i.replace(regex.trailing, "").replace(regex.trailingS, "").replace(regex.trailingY, "ie") + "s";
						lrel = "related";
					} else {
						lcollection = item_collection;
						lrel = "item";
					}

					uri = regex.scheme.test(obj[i]) ? obj[i] : `/${lcollection}/${obj[i]}`;

					if (uri !== root && seen.has(uri) === false) {
						seen.add(uri);

						if (server.allowed("GET", uri, req.host) === true) {
							links.push({uri: uri, rel: lrel});
						}
					}
				}
			});

			result = obj;
		}

		return result;
	}

	query = req.parsed.query;
	page = Number(query.page) || 1;
	page_size = Number(query.page_size || server.config.pageSize) || 5;
	root = req.parsed.pathname;

	if (req.parsed.pathname !== "/") {
		proot = root.replace(regex.trailingSlash, "").replace(regex.collection, "$1") || "/";

		if (server.allows(proot, "GET", req.host)) {
			links.push({
				uri: proot,
				rel: "collection"
			});
		}
	}

	if (Array.isArray(rep.data)) {
		if (req.method === "GET" && (rep.status >= 200 && rep.status <= 206)) {
			if (isNaN(page) || page <= 0) {
				page = 1;
			}

			nth = Math.ceil(rep.data.length / page_size);

			if (nth > 1) {
				rep.data = retsu.limit(rep.data, (page - 1) * page_size, page_size);
				query.page = 0;
				query.page_size = page_size;
				root += `?${Object.keys(query).map(i => i + "=" + encodeURIComponent(query[i])).join("&")}`;

				if (page > 1) {
					links.push({uri: root.replace("page=0", "page=1"), rel: "first"});
				}

				if (page - 1 > 1 && page <= nth) {
					links.push({uri: root.replace("page=0", `page=${(page - 1)}`), rel: "prev"});
				}

				if (page + 1 < nth) {
					links.push({uri: root.replace("page=0", `page=${(page + 1)}`), rel: "next"});
				}

				if (nth > 0 && page !== nth) {
					links.push({uri: root.replace("page=0", `page=${nth}`), rel: "last"});
				}
			} else {
				root += `?${Object.keys(query).map(i => i + "=" + encodeURIComponent(query[i])).join("&")}`;
			}
		}

		retsu.each(rep.data, i => {
			if (i instanceof Object) {
				marshal(i, "item", req.parsed.pathname.replace(regex.trailingSlash, "").replace(regex.leading, ""));
			} else {
				const li = i.toString();

				if (li !== collection) {
					const uri = li.indexOf("//") > -1 || li.indexOf("/") === 0 ? li : `${collection}/${li}`.replace(/^\/\//, "/");

					if (server.allowed("GET", uri, req.host)) {
						links.push({uri: uri, rel: "item"});
					}
				}
			}
		});
	} else if (rep.data instanceof Object) {
		parent = req.parsed.pathname.split("/").filter(i => i !== "");

		if (parent.length > 1) {
			parent.pop();
		}

		rep.data = marshal(rep.data, void 0, retsu.last(parent));
	}

	if (links.length > 0) {
		if (headers.link !== void 0) {
			retsu.each(headers.link.split('" <'), i => {
				links.push({
					uri: i.replace(/(^\<|\>.*$)/g, ""),
					rel: i.replace(/(^.*rel\=\"|\"$)/g, "")
				});
			});
		}

		headers.link = keysort(links, "rel, uri").map(i => `<${i.uri}>; rel="${i.rel}"`).join(", ");

		if (rep.links !== void 0) {
			rep.links = links;
		}
	}

	return rep;
}

module.exports = {
	auth: auth,
	bootstrap: bootstrap,
	capitalize: capitalize,
	clone: clone,
	error: error,
	explode: explode,
	hypermedia: hypermedia
};
