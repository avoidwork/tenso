"use strict";

const path = require("path"),
	{STATUS_CODES} = require("http"),
	retsu = require("retsu"),
	keysort = require("keysort"),
	session = require("express-session"),
	cookie = require("cookie-parser"),
	lusca = require("lusca"),
	uuid = require("tiny-uuid4"),
	woodland = require("woodland"),
	etag = require("tiny-etag"),
	{each} = require(path.join(__dirname, "shared.js")),
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
	return obj.length === 0;
}

function random (n = 100) {
	return Math.floor(Math.random() * n) + 1;
}

function delay (fn, n) {
	setTimeout(fn, random(n));
}

function auth (obj, config) {
	const ssl = config.ssl.cert && config.ssl.key,
		realm = `http${(ssl ? "s" : "")}://${config.host}${(config.port !== 80 && config.port !== 443 ? ":" + config.port : "")}`,
		async = config.auth.oauth2.enabled || config.auth.saml.enabled,
		stateless = config.rate.enabled === false && config.security.csrf === false && config.auth.local.enabled === false,
		authMap = {},
		authUris = [];

	let keys, sesh, fnCookie, fnSession, luscaCsp, luscaCsrf, luscaXframe, luscaP3p, luscaHsts, luscaXssProtection, luscaNoSniff,
		passportAuth, passportInit, passportSession;

	function csrfWrapper (req, res, next) {
		if (req.unprotect) {
			next();
		} else {
			luscaCsrf(req, res, next);
		}
	}

	function redirect (req, res) {
		res.redirect(config.auth.uri.redirect, false);
	}

	obj.router.blacklist(middleware.asyncFlag);

	each(groups, k => {
		config.auth[k] = (config.auth[k] || []).map(i => new RegExp(`^${(i !== config.auth.uri.login ? i.replace(/\.\*/g, "*").replace(/\*/g, ".*") : "")}(\/|$)`, "i"));
	});

	each(Object.keys(config.auth), i => {
		if (config.auth[i].enabled) {
			authMap[`${i}_uri`] = `/auth/${i}`;
			authUris.push(`/auth/${i}`);
			config.auth.protect.push(new RegExp(`^/auth/${i}(\/|$)`));
		}
	});

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
			sesh.store = new RedisStore(config.session.redis);
		}

		fnCookie = cookie();
		fnSession = session(sesh);

		obj.always(fnSession).blacklist(fnSession);
		obj.always(fnCookie).blacklist(fnCookie);
		obj.always(middleware.bypass).blacklist(middleware.bypass);

		if (config.security.csrf) {
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

	if (config.security.xssProtection) {
		luscaXssProtection = lusca.xssProtection(config.security.xssProtection);
		obj.always(luscaXssProtection).blacklist(luscaXssProtection);
	}

	if (config.security.nosniff) {
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

		if (keys) {
			config.routes.get[config.auth.uri.root] = authMap;
		}

		(function () {
			let r = `(?!${config.auth.uri.root}/(`;

			each(authUris, i => {
				r += i.replace("_uri", "") + "|";
			});

			r = r.replace(/\|$/, "") + ")).*$";
			obj.always(r, middleware.guard).blacklist(middleware.guard);
		}());

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

	if (config.auth.basic.enabled) {
		(function () {
			let x = {};

			function validate (arg, cb) {
				if (x[arg] !== void 0) {
					cb(null, x[arg]);
				} else {
					cb(new Error(STATUS_CODES[401]), null);
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

			if (async || config.auth.local.enabled) {
				obj.get("/auth/basic", passportAuth).blacklist(passportAuth);
				obj.get("/auth/basic", redirect);
			} else {
				obj.always(passportAuth).blacklist(passportAuth);
			}
		}());
	}

	if (config.auth.bearer.enabled) {
		(function () {
			function validate (arg, cb) {
				if (obj.config.auth.bearer.tokens.includes(arg)) {
					cb(null, arg);
				} else {
					cb(new Error(STATUS_CODES[401]), null);
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

			if (async || config.auth.local.enabled) {
				obj.get("/auth/bearer", passportAuth).blacklist(passportAuth);
				obj.get("/auth/bearer", redirect);
			} else {
				obj.always(passportAuth).blacklist(passportAuth);
			}
		}());
	}

	if (config.auth.jwt.enabled) {
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

	if (config.auth.local.enabled) {
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
	}

	if (config.auth.oauth2.enabled) {
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
		obj.get("/auth/oauth2/callback", passport.authenticate("oauth2", {failureRedirect: config.auth.uri.login}));
		obj.get("/auth/oauth2/callback", redirect);
	}

	if (config.auth.saml.enabled) {
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
		obj.get("/auth/saml/callback", passport.authenticate("saml", {failureRedirect: config.auth.uri.login}));
		obj.get("/auth/saml/callback", redirect);
	}

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
		defaultHeaders: obj.config.headers,
		http2: obj.config.http2,
		dtrace: obj.config.dtrace,
		origins: obj.config.origins
	});

	// Setting up router
	obj.router.onconnect = obj.connect.bind(obj);
	obj.router.onerror = obj.error;
	obj.router.onfinish = obj.finish.bind(obj);
	obj.router.onsend = obj.send.bind(obj);

	// Creating Etag manager
	if (obj.config.etags.enabled) {
		obj.etags = etag({
			cacheSize: obj.config.cacheSize,
			cacheTTL: obj.config.cacheTTL,
			seed: obj.config.seed
		});

		obj.always(obj.etags.middleware).blacklist(obj.etags.middleware);
	}

	obj.always(middleware.payload).blacklist(middleware.payload);
	obj.always(middleware.parse).blacklist(middleware.parse);

	// Setting 'always' routes before authorization runs
	(function () {
		const routes = obj.config.routes.always || {};

		each(Object.keys(routes), i => {
			if (typeof routes[i] === "function") {
				obj.always(i, routes[i]).blacklist(routes[i]);
			}
		});

		delete obj.config.routes.always;
	}());

	if (authorization) {
		auth(obj, obj.config);
	}

	// Static assets on disk for browseable interface
	if (obj.config.static !== "") {
		obj.config.routes.get[obj.config.static] = middleware.static;
	}

	// Setting routes
	each(Object.keys(obj.config.routes), method => {
		const routes = obj.config.routes[method];

		each(Object.keys(routes), i => {
			if (typeof routes[i] === "function") {
				obj[method](i, routes[i]);
			} else {
				obj[method](i, (req, res) => res.send(routes[i]));
			}
		});
	});

	return obj;
}

function id (arg = "") {
	return arg === "id" || arg === "_id" || arg === "ID" || arg === "_ID";
}

function scheme (arg = "") {
	return arg.includes("://") || arg.startsWith("/");
}

function hypermedia (server, req, rep, headers) {
	const collection = req.parsed.pathname,
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
			each(keys, i => {
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
						uri = `${lcollection.charAt(0) === "/" ? "" : "/"}${lcollection.replace(/\s/g, "%20")}/${lkey.replace(/\s/g, "%20")}`;

						if (uri !== root && seen.has(uri) === false) {
							seen.add(uri);

							if (server.allowed("GET", uri)) {
								links.push({uri: uri, rel: lrel});
							}
						}
					}
				}
			});

			result = obj;
		}

		return result;
	}

	query = req.parsed.searchParams;
	page = Number(query.get("page")) || 1;
	page_size = Number(query.get("page_size") || server.config.pageSize) || 5;
	root = req.parsed.pathname;

	for (const param of req.parsed.searchParams.entries()) {
		if (param[0] !== "page" && param[0] !== "page_size") {
			root += `${(root.indexOf("?") === -1 ? "?" : "&")}${param[0]}=${encodeURIComponent(param[1])}`;
		}
	}

	if (req.parsed.pathname !== "/") {
		const proot = root.replace(regex.trailingSlash, "").replace(regex.collection, "$1") || "/";

		if (server.allowed("GET", proot)) {
			links.push({
				uri: proot.replace(/\s/g, "%20"),
				rel: "collection"
			});
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
					query.page = 0;
					query.page_size = page_size;
					root += `${root.indexOf("?") === -1 ? "?" : "&"}${Object.keys(query).map(i => `${encodeURIComponent(i)}=${encodeURIComponent(query[i])}`).join("&")}`;

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
					const keys = Object.keys(query);

					if (keys.length > 0) {
						root += `${keys.map(i => `${encodeURIComponent(i)}=${encodeURIComponent(query[i])}`).join("&")}`;
					}
				}
			}

			if (req.hypermedia) {
				each(rep.data, i => {
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
				});
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
			each(headers.link.split('" <'), i => {
				links.push({
					uri: i.replace(/(^\<|\>.*$)/g, ""),
					rel: i.replace(/(^.*rel\=\"|\"$)/g, "")
				});
			});
		}

		headers.link = keysort(links, "rel, uri").map(i => `<${i.uri}>; rel="${i.rel}"`).join(", ");

		if (exists && rep.links !== void 0) {
			rep.links = links;
		}
	}

	return rep;
}

function sort (arg, req) {
	let output;

	if (typeof req.parsed.search === "string" && req.parsed.searchParams.has("order_by") && Array.isArray(arg)) {
		const type = typeof arg[0];

		if (type !== "boolean" && type !== "number" && type !== "string" && type !== "undefined" && arg[0] !== null) {
			output = keysort(clone(arg), req.parsed.search.replace("?", "").split("&").filter(i => i.includes("order_by")).reduce((a, b) => [...a, decodeURIComponent(b.replace("order_by=", ""))], []).join(", "));
		} else {
			// Primitives, regular Array.sort()
			output = clone(arg).sort(retsu.sort);

			if (req.parsed.search.includes("order_by=desc")) {
				output = output.reverse();
			}
		}
	} else {
		output = arg;
	}

	return output;
}

function serialize (req, arg, status = 200, headers = {}) {
	let format = req.server.config.mimeType,
		accepts = explode(headers["content-type"] || req.parsed.searchParams.get("format") || req.headers.accept || format, ","),
		errz = arg instanceof Error,
		result, serializer;

	each(accepts, i => {
		let mimetype = i.replace(regex.mimetype, ""),
			output;

		if (serializers.has(mimetype)) {
			output = false;
			format = mimetype;
		}

		return output;
	});

	serializer = serializers.get(format);

	if (errz) {
		result = serializer(null, arg, status < 400 ? 500 : status, req.server.config.logging.stackWire);
	} else {
		result = serializer(sort(arg, req), null, status);
	}

	return result;
}

function ms (arg) {
	return `${Number(arg / 1e6).toFixed(2)} ms`;
}

module.exports = {
	auth,
	bootstrap,
	capitalize,
	clone,
	each,
	explode,
	hypermedia,
	ms,
	serialize,
	sort
};
