"use strict";

const path = require("path"),
	http = require("http"),
	{each, limit, last} = require("retsu"),
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
	groups = ["protect", "unprotect"];

let uws, coap;

try {
	uws = require("uws");
	coap = require("coap");
} catch (e) {
	void 0;
}

function explode (obj, arg = ",") {
	return obj.trim().split(new RegExp(`\s*${arg}`)).map(i => i.trim());
}

function capitalize (obj, e = false, delimiter = " ") {
	return e ? explode(obj, delimiter).map(capitalize).join(delimiter) : obj.charAt(0).toUpperCase() + obj.slice(1);
}

function clone (arg) {
	return JSON.parse(JSON.stringify(arg));
}

function isEmpty (obj) {
	return obj.trim() === "";
}

function random (n = 100) {
	return Math.floor(Math.random() * n) + 1;
}

function delay (fn) {
	setTimeout(fn, random());
}

function auth (obj, config) {
	const ssl = config.ssl.cert && config.ssl.key,
		realm = `http${(ssl ? "s" : "")}://${(config.hostname === "localhost" ? "127.0.0.1" : config.hostname)}${(config.port !== 80 && config.port !== 443 ? ":" + config.port : "")}`,
		async = config.auth.oauth2.enabled || config.auth.saml.enabled,
		stateless = config.rate.enabled === false && config.security.csrf === false && config.auth.local.enabled === false,
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

	function redirect (req, res) {
		res.redirect(config.auth.redirect);
	}

	obj.always(middleware.parse).blacklist(middleware.parse);
	obj.router.blacklist(middleware.asyncFlag);

	each(groups, k => {
		config.auth[k] = (config.auth[k] || []).map(i => new RegExp(`^${(i !== "/login" ? i.replace(/\.\*/g, "*").replace(/\*/g, ".*") : "$")}`, "i"));
	});

	each(Object.keys(config.auth), i => {
		if (config.auth[i].enabled === true) {
			authMap[`${i}_uri`] = `/auth/${i}`;
			authUris.push(`/auth/${i}`);
			config.auth.protect.push(new RegExp(`^/auth/${i}`));
		}
	});

	if (config.auth.local.enabled === true) {
		authUris.push(config.auth.redirect);
		authUris.push("/login");
	}

	if (stateless === false) {
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

		obj.always(fnSession).blacklist(fnSession);
		obj.always(fnCookie).blacklist(fnCookie);
		obj.always(middleware.bypass).blacklist(middleware.bypass);

		if (config.security.csrf === true) {
			luscaCsrf = lusca.csrf({key: config.security.key, secret: config.security.secret});
			obj.always(csrfWrapper).blacklist(csrfWrapper);
		}
	}

	if (config.security.csp instanceof Object) {
		luscaCsp = lusca.csp(config.security.csp);
		obj.always(luscaCsp).blacklist(luscaCsp);
	}

	if (isEmpty(config.security.xframe || "") === false) {
		luscaXframe = lusca.xframe(config.security.xframe);
		obj.always(luscaXframe).blacklist(luscaXframe);
	}

	if (isEmpty(config.security.p3p || "") === false) {
		luscaP3p = lusca.p3p(config.security.p3p);
		obj.always(luscaP3p).blacklist(luscaP3p);
	}

	if (config.security.hsts instanceof Object) {
		luscaHsts = lusca.hsts(config.security.hsts);
		obj.always(luscaHsts).blacklist(luscaHsts);
	}

	if (config.security.xssProtection === true) {
		luscaXssProtection = lusca.xssProtection(config.security.xssProtection);
		obj.always(luscaXssProtection).blacklist(luscaXssProtection);
	}

	if (config.security.nosniff === true) {
		luscaNoSniff = lusca.nosniff();
		obj.always(luscaNoSniff).blacklist(luscaNoSniff);
	}

	// Can fork to `middleware.keymaster()`
	obj.always(middleware.zuul).blacklist(middleware.zuul);

	passportInit = passport.initialize();
	obj.always(passportInit).blacklist(passportInit);

	if (stateless === false) {
		passportSession = passport.session();
		obj.always(passportSession).blacklist(passportSession);
	}

	passport.serializeUser((user, done) => done(null, user));
	passport.deserializeUser((arg, done) => done(null, arg));

	if (authUris.length > 0) {
		keys = Object.keys(authMap).length > 0;

		if (keys === true) {
			config.routes.get["/auth"] = authMap;
		}

		(function () {
			let r = "(?!/auth/(";

			each(authUris, i => {
				r += i.replace("_uri", "") + "|";
			});

			r = r.replace(/\|$/, "") + ")).*$";
			obj.always(r, middleware.guard).blacklist(middleware.guard);
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

			each(config.auth.basic.list || [], i => {
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
				}, 250);
			}));

			passportAuth = passport.authenticate("basic", {session: stateless === false});

			if (async === true || config.auth.local.enabled === true) {
				obj.get("/auth/basic", passportAuth).blacklist(passportAuth);
				obj.get("/auth/basic", redirect);
			} else {
				obj.always(passportAuth).blacklist(passportAuth);
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
				}, 250);
			}));

			passportAuth = passport.authenticate("bearer", {session: stateless === false});

			if (async === true || config.auth.local.enabled === true) {
				obj.get("/auth/bearer", passportAuth).blacklist(passportAuth);
				obj.get("/auth/bearer", redirect);
			} else {
				obj.always(passportAuth).blacklist(passportAuth);
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

			each(["algorithms", "audience", "issuer"], i => {
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
				}, 250);
			}));

			passportAuth = passport.authenticate("jwt", {session: false});
			obj.always(passportAuth).blacklist(passportAuth);
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
			}, 250);
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
			}, 250);
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
				}, 250);
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
	const authorization = Object.keys(obj.config.auth).filter(i => {
		const x = obj.config.auth[i];

		return x instanceof Object && x.enabled === true;
	}).length > 0;

	obj.version = obj.config.version;

	// Creating router
	obj.router = woodland({
		cacheSize: obj.config.cacheSize,
		cacheTTL: obj.config.cacheTTL,
		coerce: obj.config.coerce,
		defaultHeaders: obj.config.headers,
		http2: obj.config.http2
	});

	// Setting up router
	obj.router.onconnect = (...args) => obj.connect(...args);
	obj.router.onerror = (...args) => obj.error(...args);
	obj.router.onfinish = (...args) => obj.finish(...args);
	obj.router.onsend = (...args) => obj.send(...args);

	// Setting up middleware
	obj.always(middleware.timer).blacklist(middleware.timer);

	// Creating Etag manager
	if (obj.config.etags.enabled === true) {
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

		obj.always(obj.etags.middleware).blacklist(obj.etags.middleware);
	}

	obj.always(middleware.payload).blacklist(middleware.payload);

	if (authorization) {
		auth(obj, obj.config);
	}

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
	each(Object.keys(obj.config.routes), method => {
		const routes = obj.config.routes[method];

		if (method === "coap") {
			if (obj.coap !== null) {
				each(Object.keys(routes), i => {
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
			each(Object.keys(routes), i => {
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

			each(keys, i => {
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
				rep.data = limit(rep.data, (page - 1) * page_size, page_size);
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

		each(rep.data, i => {
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

		rep.data = marshal(rep.data, void 0, last(parent));
	}

	if (links.length > 0) {
		if (headers.link !== void 0) {
			each(headers.link.split('" <'), i => {
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
