"use strict";

const path = require("path"),
	http = require("http"),
	array = require("retsu"),
	keysort = require("keysort"),
	session = require("express-session"),
	cookie = require("cookie-parser"),
	lusca = require("lusca"),
	uuid = require("tiny-uuid4"),
	middleware = require(path.join(__dirname, "middleware.js")),
	regex = require(path.join(__dirname, "regex.js")),
	iterate = require(path.join(__dirname, "iterate.js")),
	passport = require("passport"),
	jwt = require("passport-jwt"),
	BasicStrategy = require("passport-http").BasicStrategy,
	BearerStrategy = require("passport-http-bearer").Strategy,
	FacebookStrategy = require("passport-facebook").Strategy,
	GoogleStrategy = require("passport-google").Strategy,
	JWTStrategy = jwt.Strategy,
	ExtractJwt = jwt.ExtractJwt,
	LinkedInStrategy = require("passport-linkedin").Strategy,
	LocalStrategy = require("passport-local").Strategy,
	OAuth2Strategy = require("passport-oauth2").Strategy,
	SAMLStrategy = require("passport-saml").Strategy,
	TwitterStrategy = require("passport-twitter").Strategy,
	RedisStore = require("connect-redis")(session),
	all = "all";

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
	return trim(obj).split(new RegExp("\\s*" + arg + "\\s*"));
}

function escape (arg) {
	return arg.replace(/[-[\]{}()*+?.,\\^$|#]/g, "\\$&");
}

function capitalize (obj, every = false) {
	let result;

	if (every) {
		result = explode(obj, " ").map(capitalize).join(" ");
	} else {
		result = obj.charAt(0).toUpperCase() + obj.slice(1);
	}

	return result;
}

function clone (arg) {
	return JSON.parse(JSON.stringify(arg));
}

function isEmpty (obj) {
	return trim(obj) === "";
}

function auth (obj, config) {
	const ssl = config.ssl.cert && config.ssl.key,
		realm = "http" + (ssl ? "s" : "") + "://" + (config.hostname === "localhost" ? "127.0.0.1" : config.hostname) + (config.port !== 80 && config.port !== 443 ? ":" + config.port : ""),
		async = (config.auth.facebook.enabled || config.auth.google.enabled || config.auth.linkedin.enabled || config.auth.twitter.enabled) !== false,
		stateless = (config.auth.basic.enabled || config.auth.bearer.enabled || config.auth.jwt.enabled) !== false,
		stateful = (async || config.auth.local.enabled || config.security.csrf) !== false,
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

	function init (sess) {
		passportInit = passport.initialize();
		obj.server.use(passportInit, all).blacklist(passportInit);

		if (sess) {
			passportSession = passport.session();
			obj.server.use(passportSession, all).blacklist(passportSession);
		}
	}

	function redirect (req, res) {
		res.redirect(config.auth.redirect);
	}

	obj.server.use(middleware.decorate, all).blacklist(middleware.decorate);
	obj.server.use(middleware.parse, all).blacklist(middleware.parse);
	obj.server.blacklist(middleware.asyncFlag);

	config.auth.protect = (config.auth.protect || []).map(i => {
		return new RegExp("^" + i !== "/login" ? i.replace(/\.\*/g, "*").replace(/\*/g, ".*") : "$", "i");
	});

	config.auth.unprotect = (config.auth.unprotect || []).map(i => {
		return new RegExp("^" + i !== "/login" ? i.replace(/\.\*/g, "*").replace(/\*/g, ".*") : "$", "i");
	});

	if (async) {
		iterate(config.auth, (v, k) => {
			if (v.enabled) {
				authMap[k + "_uri"] = "/auth/" + k;
				config.auth.protect.push(new RegExp("^/auth/" + k));
			}
		});
	}

	iterate(authMap, i => authUris.push(i));

	if (config.auth.local.enabled) {
		authUris.push(config.auth.redirect);
		authUris.push("/login");
	}

	obj.server.use(middleware.valid, all).blacklist(middleware.valid);

	if (stateful) {
		sesh = {
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

		obj.server.use(fnSession, all).blacklist(fnSession);
		obj.server.use(fnCookie, all).blacklist(fnCookie);
		obj.server.use(middleware.bypass, all).blacklist(middleware.bypass);

		if (config.security.csrf) {
			luscaCsrf = lusca.csrf({key: config.security.key, secret: config.security.secret});
			obj.server.use(csrfWrapper, all).blacklist(csrfWrapper);
		}
	}

	if (config.security.csp instanceof Object) {
		luscaCsp = lusca.csp(config.security.csp);
		obj.server.use(luscaCsp, all).blacklist(luscaCsp);
	}

	if (!isEmpty(config.security.xframe || "")) {
		luscaXframe = lusca.xframe(config.security.xframe);
		obj.server.use(luscaXframe, all).blacklist(luscaXframe);
	}

	if (!isEmpty(config.security.p3p || "")) {
		luscaP3p = lusca.p3p(config.security.p3p);
		obj.server.use(luscaP3p, all).blacklist(luscaP3p);
	}

	if (config.security.hsts instanceof Object) {
		luscaHsts = lusca.hsts(config.security.hsts);
		obj.server.use(luscaHsts, all).blacklist(luscaHsts);
	}

	if (config.security.xssProtection) {
		luscaXssProtection = lusca.xssProtection(config.security.xssProtection);
		obj.server.use(luscaXssProtection, all).blacklist(luscaXssProtection);
	}

	if (config.security.nosniff) {
		luscaNoSniff = lusca.nosniff();
		obj.server.use(luscaNoSniff, all).blacklist(luscaNoSniff);
	}

	// Can fork to `middleware.keymaster()`
	obj.server.use(middleware.zuul, all).blacklist(middleware.zuul);

	if (stateless && !stateful) {
		init(false);
	} else {
		init(true);

		passport.serializeUser((user, done) => {
			done(null, user);
		});

		passport.deserializeUser((arg, done) => {
			done(null, arg);
		});

		if (authUris.length > 0) {
			keys = Reflect.ownKeys(authMap).length > 0;

			if (keys) {
				config.routes.get["/auth"] = authMap;
			}

			(function () {
				let r = "(?!/auth/(";

				iterate(authUris, i => {
					r += i.replace("_uri", "") + "|";
				});

				r = r.replace(/\|$/, "") + ")).*$";
				obj.server.use(r, middleware.guard, all).blacklist(middleware.guard);
			}());

			config.routes.get["/login"] = config.auth.local.enabled ? keys ? {
				login_uri: "/auth",
				instruction: "POST 'username' & 'password' to authenticate"
			} : {instruction: "POST 'username' & 'password' to authenticate"} : {login_uri: "/auth"};
		} else if (config.auth.local.enabled) {
			config.routes.get["/login"] = {instruction: "POST 'username' & 'password' to authenticate"};
		}

		config.routes.get["/logout"] = (req, res) => {
			if (req.session) {
				req.session.destroy();
			}

			res.redirect(config.auth.redirect);
		};
	}

	if (config.auth.basic.enabled) {
		(function () {
			let x = {};

			function validate (arg, cb) {
				if (x[arg]) {
					cb(null, x[arg]);
				} else {
					cb(new Error("Unauthorized"), null);
				}
			}

			iterate(config.auth.basic.list || [], i => {
				let args = i.split(":");

				if (args.length > 0) {
					x[args[0]] = {password: args[1]};
				}
			});

			passport.use(new BasicStrategy((username, password, done) => {
				validate(username, (err, user) => {
					if (err) {
						return done(err);
					}

					if (!user || user.password !== password) {
						return done(null, false);
					}

					return done(null, user);
				});
			}));

			passportAuth = passport.authenticate("basic", {session: stateful});

			if (async || config.auth.local.enabled) {
				obj.server.get("/auth/basic", passportAuth).blacklist(passportAuth);
				obj.server.get("/auth/basic", redirect);
			} else {
				obj.server.use(passportAuth, all).blacklist(passportAuth);
			}
		}());
	}

	if (config.auth.bearer.enabled) {
		(function () {
			let x = config.auth.bearer.tokens || [];

			function validate (arg, cb) {
				if (x.includes(arg)) {
					cb(null, arg);
				} else {
					cb(new Error("Unauthorized"), null);
				}
			}

			passport.use(new BearerStrategy((token, done) => {
				validate(token, (err, user) => {
					if (err) {
						done(err);
					} else if (!user) {
						done(null, false);
					} else {
						done(null, user, {scope: "read"});
					}
				});
			}));

			passportAuth = passport.authenticate("bearer", {session: stateful});

			if (async || config.auth.local.enabled) {
				obj.server.get("/auth/bearer", passportAuth).blacklist(passportAuth);
				obj.server.get("/auth/bearer", redirect);
			} else {
				obj.server.use(passportAuth, all).blacklist(passportAuth);
			}
		}());
	}

	if (config.auth.facebook.enabled) {
		passport.use(new FacebookStrategy({
			clientID: config.auth.facebook.client_id,
			clientSecret: config.auth.facebook.client_secret,
			callbackURL: realm + "/auth/facebook/callback"
		}, (accessToken, refreshToken, profile, done) => {
			config.auth.facebook.auth(accessToken, refreshToken, profile, (err, user) => {
				if (err) {
					done(err);
				} else {
					done(null, user);
				}
			});
		}));

		obj.server.get("/auth/facebook", middleware.asyncFlag);
		obj.server.get("/auth/facebook", passport.authenticate("facebook"));
		obj.server.get("/auth/facebook/callback", middleware.asyncFlag);
		obj.server.get("/auth/facebook/callback", passport.authenticate("facebook", {failureRedirect: "/login"}));
		obj.server.get("/auth/facebook/callback", redirect);
	}

	if (config.auth.google.enabled) {
		passport.use(new GoogleStrategy({
			returnURL: realm + "/auth/google/callback",
			realm: realm
		}, (identifier, profile, done) => {
			config.auth.google.auth.call(obj, identifier, profile, (err, user) => {
				if (err) {
					done(err);
				} else {
					done(null, user);
				}
			});
		}));

		obj.server.get("/auth/google", middleware.asyncFlag);
		obj.server.get("/auth/google", passport.authenticate("google"));
		obj.server.get("/auth/google/callback", middleware.asyncFlag);
		obj.server.get("/auth/google/callback", passport.authenticate("google", {failureRedirect: "/login"}));
		obj.server.get("/auth/google/callback", redirect);
	}

	if (config.auth.jwt.enabled) {
		(function () {
			const opts = {
				jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme(config.auth.jwt.scheme),
				secretOrKey: config.auth.jwt.secretOrKey,
				ignoreExpiration: config.auth.jwt.ignoreExpiration === true
			};

			iterate(["algorithms", "audience", "issuer"], i => {
				if (config.auth.jwt[i]) {
					opts[i] = config.auth.jwt[i];
				}
			});

			passport.use(new JWTStrategy(opts, (token, done) => {
				config.auth.jwt.auth(token, (err, user) => {
					if (err) {
						done(err);
					} else {
						done(null, user);
					}
				});
			}));

			passportAuth = passport.authenticate("jwt", {session: false});
			obj.server.use(passportAuth, all).blacklist(passportAuth);
		}());
	}

	if (config.auth.linkedin.enabled) {
		passport.use(new LinkedInStrategy({
			consumerKey: config.auth.linkedin.client_id,
			consumerSecret: config.auth.linkedin.client_secret,
			callbackURL: realm + "/auth/linkedin/callback"
		}, (token, tokenSecret, profile, done) => {
			config.auth.linkedin.auth(token, tokenSecret, profile, (err, user) => {
				if (err) {
					done(err);
				} else {
					done(null, user);
				}
			});
		}));

		obj.server.get("/auth/linkedin", middleware.asyncFlag);
		obj.server.get("/auth/linkedin", passport.authenticate("linkedin", {"scope": config.auth.linkedin.scope || ["r_basicprofile", "r_emailaddress"]}));
		obj.server.get("/auth/linkedin/callback", middleware.asyncFlag);
		obj.server.get("/auth/linkedin/callback", passport.authenticate("linkedin", {failureRedirect: "/login"}));
		obj.server.get("/auth/linkedin/callback", redirect);
	}

	if (config.auth.local.enabled) {
		passport.use(new LocalStrategy((username, password, done) => {
			config.auth.local.auth(username, password, (err, user) => {
				if (err) {
					done(err);
				} else {
					done(null, user);
				}
			});
		}));

		config.routes.post = config.routes.post || {};
		config.routes.post["/login"] = (req, res) => {
			function final () {
				passport.authenticate("local")(req, res, e => {
					if (e) {
						res.error(401, "Unauthorized");
					} else if (req.cors && req.headers["x-requested-with"] && req.headers["x-requested-with"] === "XMLHttpRequest") {
						res.respond("Success");
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

	if (config.auth.oauth2.enabled) {
		passport.use(new OAuth2Strategy({
			authorizationURL: config.auth.oauth2.auth_url,
			tokenURL: config.auth.oauth2.token_url,
			clientID: config.auth.oauth2.client_id,
			clientSecret: config.auth.oauth2.client_secret,
			callbackURL: realm + "/auth/oauth2/callback"
		}, (accessToken, refreshToken, profile, done) => {
			config.auth.oauth2.auth(accessToken, refreshToken, profile, (err, user) => {
				if (err) {
					done(err);
				} else {
					done(null, user);
				}
			});
		}));

		obj.server.get("/auth/oauth2", middleware.asyncFlag);
		obj.server.get("/auth/oauth2", passport.authenticate("oauth2"));
		obj.server.get("/auth/oauth2/callback", middleware.asyncFlag);
		obj.server.get("/auth/oauth2/callback", passport.authenticate("oauth2", {failureRedirect: "/login"}));
		obj.server.get("/auth/oauth2/callback", redirect);
	}

	if (config.auth.saml.enabled) {
		(function () {
			let arg = config.auth.saml;

			arg.callbackURL = realm + "/auth/saml/callback";
			delete arg.enabled;
			delete arg.path;

			passport.use(new SAMLStrategy(arg, (profile, done) => {
				config.auth.saml.auth(profile, (err, user) => {
					if (err) {
						done(err);
					} else {
						done(null, user);
					}
				});
			}));
		}());

		obj.server.get("/auth/saml", middleware.asyncFlag);
		obj.server.get("/auth/saml", passport.authenticate("saml"));
		obj.server.get("/auth/saml/callback", middleware.asyncFlag);
		obj.server.get("/auth/saml/callback", passport.authenticate("saml", {failureRedirect: "/login"}));
		obj.server.get("/auth/saml/callback", redirect);
	}

	if (config.auth.twitter.enabled) {
		passport.use(new TwitterStrategy({
			consumerKey: config.auth.twitter.consumer_key,
			consumerSecret: config.auth.twitter.consumer_secret,
			callbackURL: realm + "/auth/twitter/callback"
		}, (token, tokenSecret, profile, done) => {
			config.auth.twitter.auth(token, tokenSecret, profile, (err, user) => {
				if (err) {
					done(err);
				} else {
					done(null, user);
				}
			});
		}));

		obj.server.get("/auth/twitter", middleware.asyncFlag);
		obj.server.get("/auth/twitter", passport.authenticate("twitter"));
		obj.server.get("/auth/twitter/callback", middleware.asyncFlag);
		obj.server.get("/auth/twitter/callback", passport.authenticate("twitter", {
			successRedirect: config.auth.redirect,
			failureRedirect: "/login"
		}));
	}

	return config;
}

function bootstrap (obj, config) {
	// Bootstrapping configuration
	auth(obj, config);

	// Setting headers
	if (!config.headers) {
		config.headers = {};
	}

	config.headers.server = "tenso/4.0.0";

	// Starting WebSocket server
	if (config.websocket.enabled && uws) {
		obj.websocket = new uws.Server(config.websocket.options);
		obj.server.log("Started WebSocket server on port " + config.websocket.options.port, "debug");
	}

	// Starting COAP server
	if (config.coap.enabled && coap) {
		obj.coap = coap.createServer({type: config.coap.options.type});
		obj.coap.listen(config.coap.options.port, config.hostname);
		obj.server.log("Started COAP (" + config.coap.options.type + ") server on " + config.hostname + ":" + config.coap.options.port, "debug");
	}

	// Setting routes
	iterate(config.routes, (routes, method) => {
		if (method === "coap") {
			if (obj.websocket) {
				iterate(routes, (fn, event) => {
					obj.server.log("COAP event handler: '" + event + "'", "debug");
					obj.coap.on(event, (req, res) => {
						fn(req, res, obj.coap, obj);
					});
				});
			}
		} else if (method === "socket") {
			if (obj.websocket) {
				iterate(routes, (fn, event) => {
					obj.server.log("WebSocket event handler: '" + event + "'", "debug");
					obj.websocket.on(event, (socket, message, binary) => {
						if (event === "message") {
							fn(socket, message, binary, obj.websocket, obj);
						} else {
							fn(socket, obj.websocket, obj);
						}
					});
				});
			}
		} else {
			iterate(routes, (arg, route) => {
				if (typeof arg === "function") {
					obj.server[method](route, (...args) => {
						arg.apply(obj, args);
					});
				} else {
					obj.server[method](route, (req, res) => {
						if (!res._header) {
							res.send(arg);
						}
					});
				}
			});
		}
	});

	// Disabling compression over SSL due to BREACH
	if (config.ssl.cert && config.ssl.key) {
		config.compress = false;
		obj.server.log("Compression over SSL is disabled for your protection", "debug");
	}

	// Starting API server
	obj.server.start(config, (req, res, status, msg) => {
		let stat = status instanceof Error ? parseInt(status.message, 10) : status,
			err = msg instanceof Error ? msg : new Error(msg || http.STATUS_CODES[stat]);

		obj.respond(req, res, err, status);
	});

	return obj;
}

function hypermedia (server, req, rep, headers) {
	let seen = {},
		collection = req.parsed.pathname,
		query, page, page_size, nth, root, proot, parent;

	// Parsing the object for hypermedia properties
	function marshal (obj, rel, item_collection) {
		let keys = Reflect.ownKeys(obj),
			lrel = rel || "related",
			result;

		if (keys.length === 0) {
			result = null;
		} else {
			iterate(keys, i => {
				let lcollection, uri;

				// If ID like keys are found, and are not URIs, they are assumed to be root collections
				if (regex.id.test(i) || regex.hypermedia.test(i)) {
					if (!regex.id.test(i)) {
						lcollection = i.replace(regex.trailing, "").replace(regex.trailing_s, "").replace(regex.trailing_y, "ie") + "s";
						lrel = "related";
					} else {
						lcollection = item_collection;
						lrel = "item";
					}

					uri = regex.scheme.test(obj[i]) ? obj[i] : "/" + lcollection + "/" + obj[i];

					if (uri !== root && !seen[uri]) {
						seen[uri] = 1;

						if (server.allowed("GET", uri, req.host)) {
							rep.links.push({uri: uri, rel: lrel});
						}
					}
				}
			});

			result = obj;
		}

		return result;
	}

	query = req.parsed.query;
	page = query.page || 1;
	page_size = query.page_size || server.config.pageSize || 5;
	root = req.parsed.pathname;

	if (req.parsed.pathname !== "/") {
		proot = root.replace(regex.trailing_slash, "").replace(regex.collection, "$1") || "/";

		if (server.allows(proot, "GET", req.host)) {
			rep.links.push({
				uri: proot,
				rel: "collection"
			});
		}
	}

	if (rep.data instanceof Array) {
		if (req.method === "GET" && (rep.status >= 200 && rep.status <= 206)) {
			if (isNaN(page) || page <= 0) {
				page = 1;
			}

			nth = Math.ceil(rep.data.length / page_size);

			if (nth > 1) {
				rep.data = array.limit(rep.data, (page - 1) * page_size, page_size);
				query.page = 0;
				query.page_size = page_size;

				root += "?" + Reflect.ownKeys(query).map(i => {
					return i + "=" + encodeURIComponent(query[i]);
				}).join("&");

				if (page > 1) {
					rep.links.push({uri: root.replace("page=0", "page=1"), rel: "first"});
				}

				if (page - 1 > 1 && page <= nth) {
					rep.links.push({uri: root.replace("page=0", "page=" + (page - 1)), rel: "prev"});
				}

				if (page + 1 < nth) {
					rep.links.push({uri: root.replace("page=0", "page=" + (page + 1)), rel: "next"});
				}

				if (nth > 0 && page !== nth) {
					rep.links.push({uri: root.replace("page=0", "page=" + nth), rel: "last"});
				}
			} else {
				root += "?" + Reflect.ownKeys(query).map(i => {
					return i + "=" + encodeURIComponent(query[i]);
				}).join("&");
			}
		}

		iterate(rep.data, i => {
			let li, uri;

			if (i instanceof Object) {
				marshal(i, "item", req.parsed.pathname.replace(regex.trailing_slash, "").replace(regex.leading, ""));
			} else {
				li = i.toString();

				if (li !== collection) {
					uri = li.indexOf("//") > -1 || li.indexOf("/") === 0 ? li : (collection + "/" + li).replace(/^\/\//, "/");

					if (server.allowed("GET", uri, req.host)) {
						rep.links.push({uri: uri, rel: "item"});
					}
				}
			}
		});
	} else if (rep.data instanceof Object) {
		parent = req.parsed.pathname.split("/").filter(i => i !== "");

		if (parent.length > 1) {
			parent.pop();
		}

		rep.data = marshal(rep.data, undefined, array.last(parent));
	}

	if (rep.links.length > 0) {
		if (headers.link) {
			headers.link.split('" <').forEach(i => {
				rep.links.push({
					uri: i.replace(/(^\<|\>.*$)/g, ""),
					rel: i.replace(/(^.*rel\=\"|\"$)/g, "")
				});
			});
		}

		headers.link = keysort(rep.links, "rel, uri").map(i => {
			return "<" + i.uri + ">; rel=\"" + i.rel + "\"";
		}).join(", ");
	}

	return rep;
}

module.exports = {
	auth: auth,
	bootstrap: bootstrap,
	capitalize: capitalize,
	clone: clone,
	explode: explode,
	escape: escape,
	hypermedia: hypermedia,
	isEmpty: isEmpty,
	trim: trim
};
