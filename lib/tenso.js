"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/**
 * Tensō is a REST API facade for node.js, designed to simplify the implementation of APIs.
 *
 * @author Jason Mulligan <jason.mulligan@avoidwork.com>
 * @copyright 2015 Jason Mulligan
 * @license BSD-3 <https://raw.github.com/avoidwork/tenso/master/LICENSE>
 * @link http://avoidwork.github.io/tenso
 * @module tenso
 * @version 1.3.0
 */
var CONFIG = require(__dirname + "/../config.json");
var VERSION = "1.3.0";
var SERVER = "tenso/" + VERSION;

var keigai = require("keigai"),
    util = keigai.util,
    array = util.array,
    clone = util.clone,
    coerce = util.coerce,
    iterate = util.iterate,
    json = util.json,
    merge = util.merge,
    string = util.string,
    uuid = util.uuid,
    xml = util.xml,
    yaml = require("yamljs"),
    turtleio = require("turtle.io"),
    session = require("express-session"),
    cookie = require("cookie-parser"),
    lusca = require("lusca"),
    passport = require("passport"),
    BasicStrategy = require("passport-http").BasicStrategy,
    BearerStrategy = require("passport-http-bearer").Strategy,
    FacebookStrategy = require("passport-facebook").Strategy,
    GoogleStrategy = require("passport-google").Strategy,
    LinkedInStrategy = require("passport-linkedin").Strategy,
    LocalStrategy = require("passport-local").Strategy,
    OAuth2Strategy = require("passport-oauth2").Strategy,
    SAMLStrategy = require("passport-saml").Strategy,
    TwitterStrategy = require("passport-twitter").Strategy,
    RedisStore = require("connect-redis")(session);

/**
 * RegExp cache
 *
 * @type Object
 */
var REGEX = {
	body: /POST|PUT|PATCH/i,
	body_split: /&|=/,
	collection: /(.*)(\/.*)$/,
	encode_form: /application\/x-www-form-urlencoded/,
	encode_json: /application\/json/,
	get_rewrite: /HEAD|OPTIONS/i,
	hypermedia: /[a-zA-Z]+_(guid|uuid|id|url|uri)$/,
	id: /^(_id|id)$/i,
	leading: /.*\//,
	modify: /DELETE|PATCH|POST|PUT/,
	scheme: /^(\w+\:\/\/)|\//,
	trailing: /_.*$/,
	trailing_s: /s$/,
	trailing_slash: /\/$/,
	trailing_y: /y$/
};

var Tenso = (function () {
	/**
  * Tenso
  *
  * @constructor
  */

	function Tenso() {
		_classCallCheck(this, Tenso);

		this.hostname = "";
		this.messages = {};
		this.rates = {};
		this.server = turtleio();
		this.server.tenso = this;
		this.version = VERSION;
	}

	_createClass(Tenso, {
		error: {

			/**
    * Sends an Error to the Client
    *
    * @method redirect
    * @memberOf Tenso
    * @param  {Object} req    Client request
    * @param  {Object} res    Client response
    * @param  {Number} status Response status
    * @param  {Object} arg    Response body
    */

			value: function error(req, res, status, arg) {
				this.server.error(req, res, status, arg);

				return this;
			}
		},
		rate: {

			/**
    * Returns rate limit information for Client request
    *
    * @method rate
    * @memberOf Tenso
    * @param  {Object} req Client request
    * @param  {Object} fn  [Optional] Override default rate limit
    * @return {Array}      Array of rate limit information `[valid, total, remaining, reset]`
    */

			value: function rate(req, fn) {
				var config = this.server.config.rate,
				    id = req.sessionID || req.ip,
				    valid = true,
				    seconds = parseInt(new Date().getTime() / 1000, 10),
				    limit = undefined,
				    remaining = undefined,
				    reset = undefined,
				    state = undefined;

				if (!this.rates[id]) {
					this.rates[id] = {
						limit: config.limit,
						remaining: config.limit,
						reset: seconds + config.reset,
						time_reset: config.reset
					};
				}

				if (typeof fn == "function") {
					this.rates[id] = fn(req, this.rates[id]);
				}

				state = this.rates[id];
				limit = state.limit;
				remaining = state.remaining;
				reset = state.reset;

				if (seconds >= reset) {
					reset = state.reset = seconds + config.reset;
					remaining = state.remaining = limit - 1;
				} else if (remaining > 0) {
					state.remaining--;
					remaining = state.remaining;
				} else {
					valid = false;
				}

				return [valid, limit, remaining, reset];
			}
		},
		redirect: {

			/**
    * Redirects the Client
    *
    * @method redirect
    * @memberOf Tenso
    * @param  {Object} req Client request
    * @param  {Object} res Client response
    * @param  {Mixed}  uri Target URI
    */

			value: function redirect(req, res, uri) {
				this.server.respond(req, res, this.server.messages.NO_CONTENT, this.server.codes.FOUND, { location: uri });

				return this;
			}
		},
		render: {

			/**
    * Renders a response body, defaults to JSON
    *
    * @method render
    * @memberOf Tenso
    * @param  {Object} req     Client request
    * @param  {Object} arg     HTTP response body
    * @param  {Object} headers HTTP response headers
    * @return {String}         HTTP response body
    */

			value: function render(req, arg, headers) {
				var accept = req.headers.accept || "application/json";
				var format = "json";

				array.iterate(this.server.config.renderers || [], function (i) {
					if (accept.indexOf(i) > -1) {
						format = i;
						return false;
					}
				});

				headers["content-type"] = renderers[format].header;

				return renderers[format].fn(arg, req.allow);
			}
		},
		respond: {

			/**
    * Sends a response to the Client
    *
    * @method respond
    * @memberOf Tenso
    * @param  {Object} req     Client request
    * @param  {Object} res     Client response
    * @param  {Mixed}  arg     Response body
    * @param  {Number} status  Response status
    * @param  {Object} headers Response headers
    * @return {Undefined}      undefined
    */

			value: function respond(req, res, arg, status, headers) {
				var ref = undefined;

				if (!res._header) {
					ref = [headers || {}];

					if (req.protect) {
						if (ref[0]["cache-control"] === undefined && this.server.config.headers["cache-control"]) {
							ref[0]["cache-control"] = clone(this.server.config.headers["cache-control"], true);
						}

						if (ref[0]["cache-control"] !== undefined && ref[0]["cache-control"].indexOf("private ") == -1) {
							ref[0]["cache-control"] = "private " + ref[0]["cache-control"];
						}
					}

					if (!REGEX.modify.test(req.method) && REGEX.modify.test(req.allow) && this.server.config.security.csrf && res.locals[this.server.config.security.key]) {
						ref[0][this.server.config.security.key] = res.locals[this.server.config.security.key];
					}

					this.server.respond(req, res, this.render(req, hypermedia(this.server, req, response(arg, status), ref[0]), ref[0]), status, ref[0]);
				}

				return this;
			}
		}
	});

	return Tenso;
})();

/**
 * Setups up authentication
 *
 * @method auth
 * @param  {Object} obj    Tenso instance
 * @param  {Object} config Tenso configuration
 * @return {Object}        Updated Tenso configuration
 */
var auth = function (obj, config) {
	var ssl = config.ssl.cert && config.ssl.key,
	    proto = "http" + (ssl ? "s" : ""),
	    realm = proto + "://" + (config.hostname === "localhost" ? "127.0.0.1" : config.hostname) + (config.port !== 80 && config.port !== 443 ? ":" + config.port : ""),
	    async = config.auth.facebook.enabled || config.auth.google.enabled || config.auth.linkedin.enabled || config.auth.twitter.enabled,
	    stateless = config.auth.basic.enabled || config.auth.bearer.enabled,
	    stateful = async || config.auth.local.enabled || config.security.csrf,
	    authMap = {},
	    authUris = [],
	    keys = undefined,
	    sesh = undefined,
	    fnCookie = undefined,
	    fnSesh = undefined,
	    luscaCsrf = undefined,
	    luscaCsp = undefined,
	    luscaXframe = undefined,
	    luscaP3p = undefined,
	    luscaHsts = undefined,
	    luscaXssProtection = undefined,
	    protection = undefined,
	    passportAuth = undefined,
	    passportInit = undefined,
	    passportSession = undefined;

	var asyncFlag = function (req, res, next) {
		req.protectAsync = true;
		next();
	};

	var init = function (session) {
		passportInit = passport.initialize();
		obj.server.use(passportInit).blacklist(passportInit);

		if (session) {
			passportSession = passport.session();
			obj.server.use(passportSession).blacklist(passportSession);
		}
	};

	var guard = function (req, res, next) {
		if (req.url === "/login" || req.isAuthenticated()) {
			rate(obj, req, res, next);
		} else {
			res.redirect("/login");
		}
	};

	var redirect = function (req, res) {
		res.redirect(config.auth.redirect);
	};

	obj.server.blacklist(asyncFlag);

	config.auth.protect = (config.auth.protect || []).map(function (i) {
		return new RegExp("^" + i !== "/login" ? i.replace(/\.\*/g, "*").replace(/\*/g, ".*") : "$", "i");
	});

	if (async) {
		iterate(config.auth, function (v, k) {
			if (v.enabled) {
				authMap[k + "_uri"] = "/auth/" + k;
				config.auth.protect.push(new RegExp("^/auth/" + k));
			}
		});
	}

	authUris = array.keys(authMap);

	if (config.auth.local.enabled) {
		authUris.push(config.auth.redirect);
		authUris.push("/login");
	}

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
		fnSesh = session(sesh);

		obj.server.use(fnSesh).blacklist(fnSesh);
		obj.server.use(fnCookie).blacklist(fnCookie);

		if (config.security.csrf) {
			luscaCsrf = lusca.csrf({ key: config.security.key, secret: config.security.secret });
			obj.server.use(luscaCsrf).blacklist(luscaCsrf);
		}
	}

	if (config.security.csp instanceof Object) {
		luscaCsp = lusca.csp(config.security.csp);
		obj.server.use(luscaCsp).blacklist(luscaCsp);
	}

	if (!string.isEmpty(config.security.xframe)) {
		luscaXframe = lusca.xframe(config.security.xframe);
		obj.server.use(luscaXframe).blacklist(luscaXframe);
	}

	if (!string.isEmpty(config.security.p3p)) {
		luscaP3p = lusca.p3p(config.security.p3p);
		obj.server.use(luscaP3p).blacklist(luscaP3p);
	}

	if (config.security.hsts instanceof Object) {
		luscaHsts = lusca.hsts(config.security.hsts);
		obj.server.use(luscaHsts).blacklist(luscaHsts);
	}

	if (config.security.xssProtection instanceof Object) {
		luscaXssProtection = lusca.xssProtection(config.security.xssProtection);
		obj.server.use(luscaXssProtection).blacklist(luscaXssProtection);
	}

	protection = zuul(config.auth.protect);
	obj.server.use(protection).blacklist(protection);

	if (stateless && !stateful) {
		init(false);
	} else {
		init(true);

		passport.serializeUser(function (user, done) {
			done(null, user);
		});

		passport.deserializeUser(function (obj, done) {
			done(null, obj);
		});

		if (authUris.length > 0) {
			keys = array.keys(authMap).length > 0;

			if (keys) {
				config.routes.get["/auth"] = authMap;
			}

			(function () {
				var r = "(?!/auth/(";

				array.iterate(authUris, function (i) {
					r += i.replace("_uri", "") + "|";
				});

				r = r.replace(/\|$/, "") + ")).*$";

				obj.server.use(r, guard).blacklist(guard);
			})();

			config.routes.get["/login"] = config.auth.local.enabled ? keys ? {
				login_uri: "/auth",
				instruction: "POST 'username' & 'password' to authenticate"
			} : { instruction: "POST 'username' & 'password' to authenticate" } : { login_uri: "/auth" };
		} else if (config.auth.local.enabled) {
			config.routes.get["/login"] = { instruction: "POST 'username' & 'password' to authenticate" };
		}

		config.routes.get["/logout"] = function (req, res) {
			if (req.session) {
				req.session.destroy();
			}

			res.redirect(config.auth.redirect);
		};
	}

	if (config.auth.basic.enabled) {
		(function () {
			var x = {};

			var validate = function (arg, cb) {
				if (x[arg]) {
					cb(null, x[arg]);
				} else {
					cb(new Error("Unauthorized"), null);
				}
			};

			array.iterate(config.auth.basic.list || [], function (i) {
				var args = i.split(":");

				if (args.length > 0) {
					x[args[0]] = { password: args[1] };
				}
			});

			passport.use(new BasicStrategy(function (username, password, done) {
				validate(username, function (err, user) {
					if (err) {
						delete err.stack;
						return done(err);
					}

					if (!user || user.password !== password) {
						return done(null, false);
					}

					return done(null, user);
				});
			}));

			passportAuth = passport.authenticate("basic", { session: stateful });

			if (async || config.auth.local.enabled) {
				obj.server.get("/auth/basic", passportAuth).blacklist(passportAuth);
				obj.server.get("/auth/basic", redirect);
			} else {
				obj.server.use(passportAuth).blacklist(passportAuth);
			}
		})();
	}

	if (config.auth.bearer.enabled) {
		(function () {
			var x = config.auth.bearer.tokens || [];

			var validate = function (arg, cb) {
				if (array.contains(x, arg)) {
					cb(null, arg);
				} else {
					cb(new Error("Unauthorized"), null);
				}
			};

			passport.use(new BearerStrategy(function (token, done) {
				validate(token, function (err, user) {
					if (err) {
						delete err.stack;
						return done(err);
					}

					if (!user) {
						return done(null, false);
					}

					return done(null, user, { scope: "read" });
				});
			}));

			passportAuth = passport.authenticate("bearer", { session: stateful });

			if (async || config.auth.local.enabled) {
				obj.server.get("/auth/bearer", passportAuth).blacklist(passportAuth);
				obj.server.get("/auth/bearer", redirect);
			} else {
				obj.server.use(passportAuth).blacklist(passportAuth);
			}
		})();
	}

	if (config.auth.facebook.enabled) {
		passport.use(new FacebookStrategy({
			clientID: config.auth.facebook.client_id,
			clientSecret: config.auth.facebook.client_secret,
			callbackURL: realm + "/auth/facebook/callback"
		}, function (accessToken, refreshToken, profile, done) {
			config.auth.facebook.auth(accessToken, refreshToken, profile, function (err, user) {
				if (err) {
					delete err.stack;
					return done(err);
				}

				done(null, user);
			});
		}));

		obj.server.get("/auth/facebook", asyncFlag);
		obj.server.get("/auth/facebook", passport.authenticate("facebook"));
		obj.server.get("/auth/facebook/callback", asyncFlag);
		obj.server.get("/auth/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/login" }));
		obj.server.get("/auth/facebook/callback", redirect);
	}

	if (config.auth.google.enabled) {
		passport.use(new GoogleStrategy({
			returnURL: realm + "/auth/google/callback",
			realm: realm
		}, function (identifier, profile, done) {
			config.auth.google.auth.call(obj, identifier, profile, function (err, user) {
				if (err) {
					delete err.stack;
					return done(err);
				}

				done(null, user);
			});
		}));

		obj.server.get("/auth/google", asyncFlag);
		obj.server.get("/auth/google", passport.authenticate("google"));
		obj.server.get("/auth/google/callback", asyncFlag);
		obj.server.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login" }));
		obj.server.get("/auth/google/callback", redirect);
	}

	if (config.auth.linkedin.enabled) {
		passport.use(new LinkedInStrategy({
			consumerKey: config.auth.linkedin.client_id,
			consumerSecret: config.auth.linkedin.client_secret,
			callbackURL: realm + "/auth/linkedin/callback"
		}, function (token, tokenSecret, profile, done) {
			config.auth.linkedin.auth(token, tokenSecret, profile, function (err, user) {
				if (err) {
					delete err.stack;
					return done(err);
				}

				done(null, user);
			});
		}));

		obj.server.get("/auth/linkedin", asyncFlag);
		obj.server.get("/auth/linkedin", passport.authenticate("linkedin", { scope: config.auth.linkedin.scope || ["r_basicprofile", "r_emailaddress"] }));
		obj.server.get("/auth/linkedin/callback", asyncFlag);
		obj.server.get("/auth/linkedin/callback", passport.authenticate("linkedin", { failureRedirect: "/login" }));
		obj.server.get("/auth/linkedin/callback", redirect);
	}

	if (config.auth.local.enabled) {
		passport.use(new LocalStrategy(function (username, password, done) {
			config.auth.local.auth(username, password, function (err, user) {
				if (err) {
					delete err.stack;
					return done(err);
				}

				done(null, user);
			});
		}));

		config.routes.post = config.routes.post || {};
		config.routes.post["/login"] = function (req, res) {
			var final = undefined,
			    mid = undefined;

			final = function () {
				passport.authenticate("local")(req, res, function (e) {
					if (e) {
						res.error(401, "Unauthorized");
					} else if (req.cors && req.headers["x-requested-with"] && req.headers["x-requested-with"] === "XMLHttpRequest") {
						res.respond("Success");
					} else {
						res.redirect(config.auth.redirect);
					}
				});
			};

			mid = function () {
				passportSession(req, res, final);
			};

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
		}, function (accessToken, refreshToken, profile, done) {
			config.auth.oauth2.auth(accessToken, refreshToken, profile, function (err, user) {
				if (err) {
					delete err.stack;
					return done(err);
				}

				done(null, user);
			});
		}));

		obj.server.get("/auth/oauth2", asyncFlag);
		obj.server.get("/auth/oauth2", passport.authenticate("oauth2"));
		obj.server.get("/auth/oauth2/callback", asyncFlag);
		obj.server.get("/auth/oauth2/callback", passport.authenticate("oauth2", { failureRedirect: "/login" }));
		obj.server.get("/auth/oauth2/callback", redirect);
	}

	if (config.auth.saml.enabled) {
		(function () {
			var config = config.auth.saml;

			config.callbackURL = realm + "/auth/saml/callback";
			delete config.enabled;
			delete config.path;

			passport.use(new SAMLStrategy(config, function (profile, done) {
				config.auth.saml.auth(profile, function (err, user) {
					if (err) {
						delete err.stack;
						return done(err);
					}

					done(null, user);
				});
			}));
		})();

		obj.server.get("/auth/saml", asyncFlag);
		obj.server.get("/auth/saml", passport.authenticate("saml"));
		obj.server.get("/auth/saml/callback", asyncFlag);
		obj.server.get("/auth/saml/callback", passport.authenticate("saml", { failureRedirect: "/login" }));
		obj.server.get("/auth/saml/callback", redirect);
	}

	if (config.auth.twitter.enabled) {
		passport.use(new TwitterStrategy({
			consumerKey: config.auth.twitter.consumer_key,
			consumerSecret: config.auth.twitter.consumer_secret,
			callbackURL: realm + "/auth/twitter/callback"
		}, function (token, tokenSecret, profile, done) {
			config.auth.twitter.auth(token, tokenSecret, profile, function (err, user) {
				if (err) {
					delete err.stack;
					return done(err);
				}

				done(null, user);
			});
		}));

		obj.server.get("/auth/twitter", asyncFlag);
		obj.server.get("/auth/twitter", passport.authenticate("twitter"));
		obj.server.get("/auth/twitter/callback", asyncFlag);
		obj.server.get("/auth/twitter/callback", passport.authenticate("twitter", {
			successRedirect: config.auth.redirect,
			failureRedirect: "/login"
		}));
	}

	return config;
};

/**
 * Bootstraps an instance of Tenso
 *
 * @method bootstrap
 * @param  {Object} obj    Tenso instance
 * @param  {Object} config Application configuration
 * @return {Object}        Tenso instance
 */
var bootstrap = function (obj, config) {
	var notify = false;

	var mediator = function (req, res, next) {
		res.error = function (status, body) {
			return obj.error(req, res, status, body);
		};

		res.redirect = function (uri) {
			return obj.redirect(req, res, uri);
		};

		res.respond = function (body, status, headers) {
			return obj.respond(req, res, body, status, headers);
		};

		next();
	};

	var parse = function (req, res, next) {
		var args = undefined,
		    type = undefined;

		if (REGEX.body.test(req.method) && req.body !== undefined) {
			type = req.headers["content-type"];

			if (REGEX.encode_form.test(type)) {
				args = req.body ? array.chunk(req.body.split(REGEX.body_split), 2) : [];
				req.body = {};

				array.iterate(args, function (i) {
					req.body[i[0]] = coerce(i[1]);
				});
			}

			if (REGEX.encode_json.test(type)) {
				req.body = json.decode(req.body, true);
			}
		}

		next();
	};

	obj.server.use(mediator).blacklist(mediator);
	obj.server.use(parse).blacklist(parse);

	// Bootstrapping configuration
	config = auth(obj, config);
	config.headers = config.headers || {};
	config.headers.server = SERVER;

	// Creating status > message map
	iterate(obj.server.codes, function (value, key) {
		obj.messages[value] = obj.server.messages[key];
	});

	// Setting routes
	if (config.routes instanceof Object) {
		iterate(config.routes, function (routes, method) {
			iterate(routes, function (arg, route) {
				if (typeof arg == "function") {
					obj.server[method](route, function () {
						for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
							args[_key] = arguments[_key];
						}

						arg.apply(obj, args);
					});
				} else {
					obj.server[method](route, function (req, res) {
						obj.respond(req, res, arg);
					});
				}
			});
		});
	}

	// Disabling compression over SSL due to BREACH
	if (config.ssl.cert && config.ssl.key) {
		config.compress = false;
		notify = true;
	}

	// Starting API server
	obj.server.start(config, function (req, res, status, msg) {
		var err = msg instanceof Error ? msg : new Error(msg || obj.messages[status]);

		error(obj, req, res, status, err, obj);
	});

	if (notify) {
		obj.server.log("Compression over SSL is disabled for your protection", "debug");
	}

	return obj;
};

/**
 * Route error handler
 *
 * @method error
 * @return {Undefined} undefined
 */
var error = function (server, req, res, status, err) {
	server.respond(req, res, err, status);
};

/**
 * Tenso factory
 *
 * @method factory
 * @param {Object} arg [Optional] Configuration
 * @return {Object}    Tenso instance
 */
var factory = function (arg) {
	var hostname = arg ? arg.hostname || "localhost" : "localhost",
	    vhosts = {},
	    config = arg ? merge(clone(CONFIG, true), arg) : CONFIG,
	    obj = undefined;

	if (!config.port) {
		console.error("Invalid configuration");
		process.exit(1);
	}

	vhosts[hostname] = "www";
	config.root = __dirname + "/../";
	config.vhosts = vhosts;
	config["default"] = hostname;

	obj = new Tenso();
	obj.hostname = hostname;

	return bootstrap(obj, config);
};

/**
 * Decorates the `rep` with hypermedia links
 *
 * Arrays of results are automatically paginated, Objects
 * will be parsed and have keys 'lifted' into the 'link'
 * Array if a pattern is matched, e.g. "user_(guid|uuid|id|uri|url)"
 * will map to "/users/$1"
 *
 * @method hypermedia
 * @param  {Object} server  TurtleIO instance
 * @param  {Object} req     Client request
 * @param  {Object} rep     Serialized representation
 * @param  {Object} headers HTTP response headers
 * @return {Object}         HTTP response body
 */
var hypermedia = function (server, req, rep, headers) {
	var seen = {},
	    protocol = req.headers["x-forwarded-proto"] ? req.headers["x-forwarded-proto"] + ":" : req.parsed.protocol,
	    query = undefined,
	    page = undefined,
	    page_size = undefined,
	    nth = undefined,
	    root = undefined,
	    parent = undefined;

	// Parsing the object for hypermedia properties
	var parse = function (obj, rel, item_collection) {
		rel = rel || "related";
		var keys = array.keys(obj);

		if (keys.length === 0) {
			obj = null;
		} else {
			array.iterate(keys, function (i) {
				var collection = undefined,
				    uri = undefined;

				// If ID like keys are found, and are not URIs, they are assumed to be root collections
				if (REGEX.id.test(i) || REGEX.hypermedia.test(i)) {
					if (!REGEX.id.test(i)) {
						collection = i.replace(REGEX.trailing, "").replace(REGEX.trailing_s, "").replace(REGEX.trailing_y, "ie") + "s";
						rel = "related";
					} else {
						collection = item_collection;
						rel = "item";
					}

					uri = REGEX.scheme.test(obj[i]) ? obj[i].indexOf("//") > -1 ? obj[i] : protocol + "//" + req.parsed.host + obj[i] : protocol + "//" + req.parsed.host + "/" + collection + "/" + obj[i];

					if (uri !== root && !seen[uri]) {
						rep.data.link.push({ uri: uri, rel: rel });
						seen[uri] = 1;
					}
				}
			});
		}

		return obj;
	};

	if (rep.status >= 200 && rep.status <= 206) {
		query = req.parsed.query;
		page = query.page || 1;
		page_size = query.page_size || server.config.pageSize || 5;
		rep.data = { link: [], result: rep.data };
		root = protocol + "//" + req.parsed.host + req.parsed.pathname;

		if (req.parsed.pathname !== "/") {
			rep.data.link.push({
				uri: root.replace(REGEX.trailing_slash, "").replace(REGEX.collection, "$1"),
				rel: "collection"
			});
		}

		if (rep.data.result instanceof Array) {
			if (isNaN(page) || page <= 0) {
				page = 1;
			}

			nth = Math.ceil(rep.data.result.length / page_size);

			if (nth > 1) {
				rep.data.result = array.limit(rep.data.result, (page - 1) * page_size, page_size);
				query.page = 0;
				query.page_size = page_size;

				root += "?" + array.keys(query).map(function (i) {
					return i + "=" + encodeURIComponent(query[i]);
				}).join("&");

				if (page > 1) {
					rep.data.link.push({ uri: root.replace("page=0", "page=1"), rel: "first" });
				}

				if (page - 1 > 1 && page <= nth) {
					rep.data.link.push({ uri: root.replace("page=0", "page=" + (page - 1)), rel: "prev" });
				}

				if (page + 1 < nth) {
					rep.data.link.push({ uri: root.replace("page=0", "page=" + (page + 1)), rel: "next" });
				}

				if (nth > 0 && page !== nth) {
					rep.data.link.push({ uri: root.replace("page=0", "page=" + nth), rel: "last" });
				}
			} else {
				root += "?" + array.keys(query).map(function (i) {
					return i + "=" + encodeURIComponent(query[i]);
				}).join("&");
			}

			array.iterate(rep.data.result, function (i) {
				var uri = undefined;

				if (typeof i == "string" && REGEX.scheme.test(i)) {
					uri = i.indexOf("//") > -1 ? i : protocol + "//" + req.parsed.host + i;

					if (uri !== root) {
						rep.data.link.push({ uri: uri, rel: "item" });
					}
				}

				if (i instanceof Object) {
					parse(i, "item", req.parsed.pathname.replace(REGEX.trailing_slash, "").replace(REGEX.leading, ""));
				}
			});
		} else if (rep.data.result instanceof Object) {
			parent = req.parsed.pathname.split("/").filter(function (i) {
				return i !== "";
			});

			if (parent.length > 1) {
				parent.pop();
			}

			rep.data.result = parse(rep.data.result, undefined, array.last(parent));
		}

		if (rep.data.link !== undefined && rep.data.link.length > 0) {
			headers.link = array.keySort(rep.data.link, "rel, uri").map(function (i) {
				return "<" + i.uri + ">; rel=\"" + i.rel + "\"";
			}).join(", ");
		}
	}

	return rep;
};

/**
 * Keymaster for the request
 *
 * @method keymaster
 * @param  {Object}   req  Client request
 * @param  {Object}   res  Client response
 * @param  {Function} next Next middleware
 * @return {Undefined}     undefined
 */
var keymaster = function (req, res, next) {
	var obj = req.server.tenso,
	    method = undefined,
	    result = undefined,
	    routes = undefined,
	    uri = undefined,
	    valid = undefined;

	// No authentication, or it's already happened
	if (!req.protect || !req.protectAsync || req.session && req.isAuthenticated()) {
		method = REGEX.get_rewrite.test(req.method) ? "get" : req.method.toLowerCase();
		routes = req.server.config.routes[method] || {};
		uri = req.parsed.pathname;
		valid = false;

		rate(obj, req, res, function () {
			if (uri in routes) {
				result = routes[uri];

				if (typeof result == "function") {
					result.call(obj, req, res);
				} else {
					obj.respond(req, res, result);
				}
			} else {
				iterate(routes, function (value, key) {
					var REGEX = new RegExp("^" + key + "$", "i");

					if (REGEX.test(uri)) {
						result = value;

						return false;
					}
				});

				if (result) {
					if (typeof result == "function") {
						result.call(obj, req, res);
					} else {
						obj.respond(req, res, result);
					}
				} else {
					iterate(req.server.config.routes.get || {}, function (value, key) {
						var REGEX = new RegExp("^" + key + "$", "i");

						if (REGEX.test(uri)) {
							valid = true;

							return false;
						}
					});

					if (valid) {
						obj.error(req, res, 405);
					} else {
						obj.error(req, res, 404);
					}
				}
			}
		});
	} else {
		rate(obj, req, res, next);
	}
};

/**
 * Prepares a response body
 *
 * @method prepare
 * @param  {Mixed}  arg    [Optional] Response body "data"
 * @param  {Object} error  [Optional] Error instance
 * @param  {Number} status HTTP status code
 * @return {Object}        Standardized response body
 */
var prepare = function (arg, error, status) {
	var data = clone(arg, true);

	if (arg !== null) {
		error = null;
	}

	return {
		data: data || null,
		error: error ? error.message || error : null,
		status: status || 200
	};
};

/**
 * Rate limiting middleware
 *
 * @method rate
 * @param  {Object}   obj  Tenso instance
 * @param  {Object}   req  Client request
 * @param  {Object}   res  Client response
 * @param  {Function} next Next middleware
 * @return {Undefined}     undefined
 */
var rate = function (obj, req, res, next) {
	var headers = ["x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"],
	    config = obj.server.config.rate,
	    results = obj.rate(req, config.override),
	    valid = results.shift();

	array.iterate(headers, function (i, idx) {
		res.setHeader(i, results[idx]);
	});

	if (valid) {
		next();
	} else {
		obj.error(req, res, config.status || 429, config.message || "Too Many Requests");
	}
};

/**
 * Renderers
 *
 * @type {Object}
 */
var renderers = {
	html: {
		fn: function fn(arg, allow) {
			console.log(allow);
			return arg;
		},
		header: "text/html"
	},
	json: {
		fn: function fn(arg) {
			return arg;
		},
		header: "application/json"
	},
	yaml: {
		fn: function fn(arg) {
			return yaml.stringify(arg, 4);
		},
		header: "application/yaml"
	},
	xml: {
		fn: function fn(arg) {
			return xml.encode(arg);
		},
		header: "application/xml"
	}
};

/**
 * Creates a response
 *
 * @method response
 * @param  {Mixed}  arg    Unserialized response body
 * @param  {Number} status HTTP status, default is `200`
 * @return {Object}        Response body
 */
var response = function (arg, status) {
	var error = arg instanceof Error,
	    rep = undefined;

	if (error) {
		if (status === undefined) {
			throw new Error("Invalid arguments");
		}

		rep = prepare(null, arg, status);
	} else {
		rep = prepare(arg, null, status);
	}

	return rep;
};

/**
 * Returns middleware to determine if a route is protected
 *
 * @method zuul
 * @param {Array} protect Array of routes
 * @return {Function}    Middleware
 */
var zuul = function (protect) {
	return function (req, res, next) {
		var uri = req.parsed.path,
		    protectd = false;

		array.iterate(protect, function (r) {
			if (r.test(uri)) {
				return !(protectd = true);
			}
		});

		// Setting state so the connection can be terminated properly
		req.protect = protectd;
		req.protectAsync = false;

		if (protectd && next) {
			next();
		} else {
			keymaster(req, res);
		}
	};
};

module.exports = factory;