/**
 * Tensō is a REST API facade for node.js, designed to simplify the implementation of APIs.
 *
 * @author Jason Mulligan <jason.mulligan@avoidwork.com>
 * @copyright 2014 Jason Mulligan
 * @license BSD-3 <https://raw.github.com/avoidwork/tenso/master/LICENSE>
 * @link http://avoidwork.github.io/tenso
 * @module tenso
 * @version 0.9.10
 */
( function () {
"use strict";

var turtleio = require( "turtle.io" ),
    SERVER   = "tenso/0.9.10",
    CONFIG   = require( __dirname + "/../config.json" ),
    keigai   = require( "keigai" ),
    util     = keigai.util,
    array    = util.array,
    clone    = util.clone,
    coerce   = util.coerce,
    iterate  = util.iterate,
    json     = util.json,
    merge    = util.merge,
    string   = util.string,
    uuid     = util.uuid,
    session  = require( "express-session" ),
    cookie   = require( "cookie-parser" ),
    lusca    = require( "lusca" ),
    passport = require( "passport" ),
    BasicStrategy    = require( "passport-http" ).BasicStrategy,
    BearerStrategy   = require( "passport-http-bearer" ).Strategy,
    FacebookStrategy = require( "passport-facebook" ).Strategy,
    GoogleStrategy   = require( "passport-google" ).Strategy,
    LinkedInStrategy = require( "passport-linkedin" ).Strategy,
    LocalStrategy    = require( "passport-local" ).Strategy,
    OAuth2Strategy   = require( "passport-oauth2" ).Strategy,
    SAMLStrategy     = require( "passport-saml" ).Strategy,
    TwitterStrategy  = require( "passport-twitter" ).Strategy,
    RedisStore       = require( "connect-redis" )( session ),
    REGEX_HYPERMEDIA = /[a-zA-Z]+_(guid|uuid|id|url|uri)$/,
    REGEX_TRAILING   = /_.*$/,
    REGEX_TRAILING_S = /s$/,
    REGEX_SCHEME     = /^(\w+\:\/\/)|\//,
    REGEX_COLLECTION = /(.*)(\/.*)$/,
    REGEX_MODIFY     = /DELETE|PATCH|POST|PUT/,
    REGEX_GETREWRITE = /HEAD|OPTIONS/i,
    REGEX_BODY       = /POST|PUT|PATCH/i,
    REGEX_FORMENC    = /application\/x-www-form-urlencoded/,
    REGEX_JSONENC    = /application\/json/,
    REGEX_BODY_SPLIT = /&|=/,
    REGEX_LEADING    = /.*\//,
    REGEX_ID         = /^(_id|id)$/i,
    REGEX_TRAIL_SLASH= /\/$/;

/**
 * Tenso
 *
 * @constructor
 */
function Tenso () {
	this.hostname     = "";
	this.messages     = {};
	this.rates        = {};
	this.server       = turtleio();
	this.server.tenso = this;
	this.version      = "0.9.10";
}

/**
 * Setting constructor loop
 *
 * @method constructor
 * @memberOf Tenso
 * @type {Function}
 */
Tenso.prototype.constructor = Tenso;

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
Tenso.prototype.error = function ( req, res, status, arg ) {
	this.server.error( req, res, status, arg );
};

/**
 * Returns rate limit information for Client request
 *
 * @method rate
 * @memberOf Tenso
 * @param  {Object} req Client request
 * @return {Array}      Array of rate limit information `[valid, total, remaining, reset]`
 */
Tenso.prototype.rate = function ( req ) {
	var now       = new Date(),
	    next_hour = parseInt( now.setHours( now.getHours() + 1 ) / 1000, 10 ),
	    config    = this.server.config.rate,
	    regex     = /(Basic|Bearer)\s/,
	    id        = req.headers.authorization ? req.headers.authorization.replace( regex, "" ) : req.sessionID || req.ip,
	    valid     = true,
	    limit, remaining, reset, state;

	if ( !this.rates[id] ) {
		this.rates[id] = {
			limit     : config.limit,
			remaining : config.limit,
			reset     : next_hour
		};
	}

	state     = this.rates[id];
	limit     = state.limit;
	remaining = state.remaining;
	reset     = state.reset;

	if ( next_hour - reset >= config.reset ) {
		reset     = state.reset     = next_hour;
		remaining = state.remaining = limit;
	}
	else if ( remaining > 0 ) {
		state.remaining--;
		remaining = state.remaining;
	}
	else {
		valid = false;
	}

	return [valid, limit, remaining, reset];
};

/**
 * Redirects the Client
 *
 * @method redirect
 * @memberOf Tenso
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @param  {Mixed}  uri Target URI
 */
Tenso.prototype.redirect = function ( req, res, uri ) {
	this.server.respond( req, res, this.server.messages.NO_CONTENT, this.server.codes.FOUND, {location: uri} );
};

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
Tenso.prototype.respond = function ( req, res, arg, status, headers ) {
	var ref = [headers || {}];

	if ( REGEX_MODIFY.test( this.server.allows( req.parsed.pathname ) ) ) {
		if ( this.server.config.security.csrf && res.locals[this.server.config.security.key] ) {
			ref[0]["x-csrf-token"] = res.locals[this.server.config.security.key];
		}
	}

	if ( !res._header ) {
		this.server.respond( req, res, hypermedia( this.server, req, response( arg, status ), ref[0] ), status, ref[0] );
	}
};

/**
 * Setups up authentication
 *
 * @method auth
 * @param  {Object} obj    Tenso instance
 * @param  {Object} config Tenso configuration
 * @return {Object}        Updated Tenso configuration
 */
function auth ( obj, config ) {
	var ssl       = config.ssl.cert && config.ssl.key,
	    proto     = "http" + ( ssl ? "s" : "" ),
	    realm     = proto + "://" + ( config.hostname === "localhost" ? "127.0.0.1" : config.hostname ) + ( config.port !== 80 && config.port !== 443 ? ":" + config.port : "" ),
	    async     = ( config.auth.facebook.enabled || config.auth.google.enabled || config.auth.linkedin.enabled || config.auth.twitter.enabled ),
	    stateless = ( config.auth.basic.enabled || config.auth.bearer.enabled ),
	    stateful  = ( async || config.auth.local.enabled || config.security.csrf ),
	    authMap   = {},
	    authUris  = [],
	    keys, sesh, fnCookie, fnSesh, luscaCsrf, luscaCsp, luscaXframe, luscaP3p, luscaHsts, luscaXssProtection, protection, passportAuth, passportInit, passportSession;

	function asyncFlag () {
		arguments[0].protectAsync = true;
		arguments[2]();
	}

	function init ( session ) {
		passportInit = passport.initialize();
		obj.server.use( passportInit ).blacklist( passportInit );

		if ( session ) {
			passportSession = passport.session();
			obj.server.use( passportSession ).blacklist( passportSession );
		}
	}

	function guard ( req, res, next ) {
		if ( req.isAuthenticated() ) {
			return next();
		}
		else {
			res.redirect( "/login" );
		}
	}

	function redirect () {
		arguments[1].redirect( config.auth.redirect );
	}

	obj.server.blacklist( asyncFlag );

	config.auth.protect = ( config.auth.protect || [] ).map( function ( i ) {
		return new RegExp( "^" + i !== "/login" ? i.replace( /\.\*/g, "*" ).replace( /\*/g, ".*" ) : "$", "i" );
	} );

	if ( async ) {
		iterate( config.auth, function ( v, k ) {
			if ( v.enabled ) {
				authMap[k + "_uri"] = "/auth/" + k;
				config.auth.protect.push( new RegExp( "^/auth/" + k ) );
			}
		} );
	}

	authUris = array.keys( authMap );

	if ( config.auth.local.enabled ) {
		authUris.push( config.auth.redirect );
		authUris.push( "/login" );
	}

	if ( stateful ) {
		sesh = {
			secret: config.session.secret || uuid(),
			saveUninitialized: true,
			rolling: true,
			resave: true
		};

		if ( config.session.store === "redis" ) {
			sesh.store = new RedisStore( config.session.redis );
		}

		fnCookie = cookie();
		fnSesh = session( sesh );

		obj.server.use( fnSesh ).blacklist( fnSesh );
		obj.server.use( fnCookie ).blacklist( fnCookie );

		if ( config.security.csrf ) {
			luscaCsrf = lusca.csrf( {key: config.security.key} );
			obj.server.use( luscaCsrf ).blacklist( luscaCsrf );
		}
	}

	if ( config.security.csp instanceof Object ) {
		luscaCsp = lusca.csp( config.security.csp );
		obj.server.use( luscaCsp ).blacklist( luscaCsp );
	}

	if ( !string.isEmpty( config.security.xframe ) ) {
		luscaXframe = lusca.xframe( config.security.xframe );
		obj.server.use( luscaXframe ).blacklist( luscaXframe );
	}

	if ( !string.isEmpty( config.security.p3p ) ) {
		luscaP3p = lusca.p3p( config.security.p3p );
		obj.server.use( luscaP3p ).blacklist( luscaP3p );
	}

	if ( config.security.hsts instanceof Object ) {
		luscaHsts = lusca.hsts( config.security.hsts );
		obj.server.use( luscaHsts ).blacklist( luscaHsts );
	}

	if ( config.security.xssProtection instanceof Object ) {
		luscaXssProtection = lusca.xssProtection( config.security.xssProtection );
		obj.server.use( luscaXssProtection ).blacklist( luscaXssProtection );
	}

	protection = zuul( config.auth.protect );
	obj.server.use( protection ).blacklist( protection );

	if ( stateless && !stateful ) {
		init( false );
	}
	else {
		init( true );

		passport.serializeUser( function ( user, done ) {
			done( null, user );
		} );

		passport.deserializeUser( function ( obj, done ) {
			done( null, obj );
		} );

		if ( authUris.length > 0 ) {
			keys = array.keys( authMap ).length > 0;

			if ( keys ) {
				config.routes.get["/auth"] = authMap;
			}

			( function () {
				var regex = "(?!/auth/(";

				array.each( authUris, function ( i ) {
					regex += i.replace( "_uri", "" ) + "|";
				} );

				regex = regex.replace( /\|$/, "" ) + ")).*$";

				obj.server.use( regex, guard ).blacklist( guard );
			} )();

			config.routes.get["/login"]  = config.auth.local.enabled ? ( keys ? {login_uri: "/auth", instruction: "POST 'username' & 'password' to authenticate"} : {instruction: "POST 'username' & 'password' to authenticate"} ) : {login_uri: "/auth"};
		}
		else if ( config.auth.local.enabled ) {
			config.routes.get["/login"]  = {instruction: "POST 'username' & 'password' to authenticate"};
		}

		config.routes.get["/logout"] = function ( req, res ) {
			if (  req.session ) {
				req.session.destroy();
			}

			res.redirect( config.auth.redirect );
		};
	}

	if ( config.auth.basic.enabled ) {
		(function () {
			var x = {};

			function validate ( arg, cb ) {
				if ( x[arg] ) {
					cb( null, x[arg] );
				}
				else {
					cb( new Error( "Unauthorized" ), null );
				}
			}

			array.each( config.auth.basic.list || [], function ( i ) {
				var args = i.split( ":" );

				if ( args.length > 0 ) {
					x[args[0]] = {password: args[1]};
				}
			} );

			passport.use( new BasicStrategy( function ( username, password, done ) {
				validate( username, function ( err, user ) {
					if ( err ) {
						delete err.stack;
						return done( err );
					}

					if ( !user || user.password !== password ) {
						return done( null, false );
					}

					return done( null, user );
				} );
			} ) );

			passportAuth = passport.authenticate( "basic", {session: stateful} );

			if ( async || config.auth.local.enabled ) {
				obj.server.get( "/auth/basic", passportAuth ).blacklist( passportAuth );
				obj.server.get( "/auth/basic", redirect );
			}
			else {
				obj.server.use( passportAuth ).blacklist( passportAuth );
			}
		} )();
	}

	if ( config.auth.bearer.enabled ) {
		( function () {
			var x = config.auth.bearer.tokens || [];

			function validate ( arg, cb ) {
				if ( array.contains( x, arg ) ) {
					cb( null, arg );
				}
				else {
					cb( new Error( "Unauthorized" ), null );
				}
			}

			passport.use( new BearerStrategy( function ( token, done ) {
				validate( token, function ( err, user ) {
					if ( err ) {
						delete err.stack;
						return done( err );
					}

					if ( !user ) {
						return done( null, false );
					}

					return done( null, user, {scope: "read"} );
				} );
			} ) );

			passportAuth = passport.authenticate( "bearer", {session: stateful} );

			if ( async || config.auth.local.enabled ) {
				obj.server.get( "/auth/bearer", passportAuth ).blacklist( passportAuth );
				obj.server.get( "/auth/bearer", redirect );
			}
			else {
				obj.server.use( passportAuth ).blacklist( passportAuth );
			}
		} )();
	}

	if ( config.auth.facebook.enabled ) {
		passport.use( new FacebookStrategy( {
			clientID    : config.auth.facebook.client_id,
			clientSecret: config.auth.facebook.client_secret,
			callbackURL : realm + "/auth/facebook/callback"
		}, function ( accessToken, refreshToken, profile, done ) {
			config.auth.facebook.auth( accessToken, refreshToken, profile, function ( err, user ) {
				if ( err ) {
					delete err.stack;
					return done( err );
				}

				done( null, user );
			} );
		} ) );

		obj.server.get( "/auth/facebook", asyncFlag );
		obj.server.get( "/auth/facebook", passport.authenticate( "facebook" ) );
		obj.server.get( "/auth/facebook/callback", asyncFlag );
		obj.server.get( "/auth/facebook/callback", passport.authenticate( "facebook", {failureRedirect: "/login"} ) );
		obj.server.get( "/auth/facebook/callback", redirect );
	}

	if ( config.auth.google.enabled ) {
		passport.use( new GoogleStrategy( {
			returnURL: realm + "/auth/google/callback",
			realm    : realm
		}, function ( identifier, profile, done ) {
			config.auth.google.auth.call( obj, identifier, profile, function ( err, user ) {
				if ( err ) {
					delete err.stack;
					return done( err );
				}

				done( null, user );
			} );
		} ) );

		obj.server.get( "/auth/google", asyncFlag );
		obj.server.get( "/auth/google", passport.authenticate( "google" ) );
		obj.server.get( "/auth/google/callback", asyncFlag );
		obj.server.get( "/auth/google/callback", passport.authenticate( "google", {failureRedirect: "/login"} ) );
		obj.server.get( "/auth/google/callback", redirect );
	}

	if ( config.auth.linkedin.enabled ) {
		passport.use( new LinkedInStrategy( {
			consumerKey   : config.auth.linkedin.client_id,
			consumerSecret: config.auth.linkedin.client_secret,
			callbackURL   : realm + "/auth/linkedin/callback"
		},
		function ( token, tokenSecret, profile, done ) {
			config.auth.linkedin.auth( token, tokenSecret, profile, function ( err, user ) {
				if ( err ) {
					delete err.stack;
					return done( err );
				}

				done( null, user );
			} );
		} ) );

		obj.server.get( "/auth/linkedin", asyncFlag );
		obj.server.get( "/auth/linkedin", passport.authenticate( "linkedin", {"scope": config.auth.linkedin.scope || ["r_basicprofile", "r_emailaddress"]} ) );
		obj.server.get( "/auth/linkedin/callback", asyncFlag );
		obj.server.get( "/auth/linkedin/callback", passport.authenticate( "linkedin", {failureRedirect: "/login"} ) );
		obj.server.get( "/auth/linkedin/callback", redirect );
	}

	if ( config.auth.local.enabled ) {
		passport.use( new LocalStrategy( function( username, password, done ) {
			config.auth.local.auth( username, password, function ( err, user ) {
				if ( err ) {
					delete err.stack;
					return done( err );
				}

				done( null, user );
			} );
		} ) );

		config.routes.post = config.routes.post || {};
		config.routes.post["/login"] = function ( req, res ) {
			var final, mid;

			final = function () {
				passport.authenticate( "local" )( req, res, function ( e ) {
					if ( e ) {
						res.error( 401, "Unauthorized" );
					}
					else if ( req.cors && req.headers["x-requested-with"] && req.headers["x-requested-with"] === "XMLHttpRequest" ) {
						res.respond( "Success" );
					}
					else {
						res.redirect( config.auth.redirect );
					}
				} );
			};

			mid = function () {
				passportSession( req, res, final );
			};

			passportInit( req, res, mid );
		};
	}

	if ( config.auth.oauth2.enabled ) {
		passport.use( new OAuth2Strategy( {
			authorizationURL: config.auth.oauth2.auth_url,
			tokenURL        : config.auth.oauth2.token_url,
			clientID        : config.auth.oauth2.client_id,
			clientSecret    : config.auth.oauth2.client_secret,
			callbackURL     : realm + "/auth/oauth2/callback"
		}, function ( accessToken, refreshToken, profile, done ) {
			config.auth.oauth2.auth( accessToken, refreshToken, profile, function ( err, user ) {
				if ( err ) {
					delete err.stack;
					return done( err );
				}

				done( null, user );
			} );
		} ) );

		obj.server.get( "/auth/oauth2", asyncFlag );
		obj.server.get( "/auth/oauth2", passport.authenticate( "oauth2" ) );
		obj.server.get( "/auth/oauth2/callback", asyncFlag );
		obj.server.get( "/auth/oauth2/callback", passport.authenticate( "oauth2", {failureRedirect: "/login"} ) );
		obj.server.get( "/auth/oauth2/callback", redirect );
	}

	if ( config.auth.saml.enabled ) {
		( function () {
			var config = config.auth.saml;

			config.callbackURL = realm + "/auth/saml/callback";
			delete config.enabled;
			delete config.path;

			passport.use( new SAMLStrategy( config, function ( profile, done ) {
				config.auth.saml.auth( profile, function ( err, user ) {
					if ( err ) {
						delete err.stack;
						return done( err );
					}

					done( null, user );
				} );
			} ) );
		} )();

		obj.server.get( "/auth/saml", asyncFlag );
		obj.server.get( "/auth/saml", passport.authenticate( "saml" ) );
		obj.server.get( "/auth/saml/callback", asyncFlag );
		obj.server.get( "/auth/saml/callback", passport.authenticate( "saml", {failureRedirect: "/login"} ) );
		obj.server.get( "/auth/saml/callback", redirect );
	}

	if ( config.auth.twitter.enabled ) {
		passport.use( new TwitterStrategy( {
			consumerKey   : config.auth.twitter.consumer_key,
			consumerSecret: config.auth.twitter.consumer_secret,
			callbackURL   : realm + "/auth/twitter/callback"
		}, function ( token, tokenSecret, profile, done ) {
			config.auth.twitter.auth( token, tokenSecret, profile, function ( err, user ) {
				if ( err ) {
					delete err.stack;
					return done( err );
				}

				done( null, user );
			} );
		} ) );

		obj.server.get( "/auth/twitter", asyncFlag );
		obj.server.get( "/auth/twitter", passport.authenticate( "twitter" ) );
		obj.server.get( "/auth/twitter/callback", asyncFlag );
		obj.server.get( "/auth/twitter/callback", passport.authenticate( "twitter", {successRedirect: config.auth.redirect, failureRedirect: "/login"} ) );
	}

	return config;
}

/**
 * Bootstraps an instance of Tenso
 *
 * @method bootstrap
 * @param  {Object} obj    Tenso instance
 * @param  {Object} config Application configuration
 * @return {Object}        Tenso instance
 */
function bootstrap ( obj, config ) {
	var notify = false;

	function mediator ( req, res, next ) {
		res.error = function ( status, body ) {
			obj.error( req, res, status, body );
		};

		res.redirect = function ( uri ) {
			obj.redirect( req, res, uri );
		};

		res.respond = function ( body, status, headers ) {
			obj.respond( req, res, body, status, headers );
		};

		next();
	}

	function parse ( req ) {
		var args, type;

		if ( REGEX_BODY.test( req.method ) && req.body !== undefined ) {
			type = req.headers["content-type"];

			if ( REGEX_FORMENC.test( type ) ) {
				args = req.body ? array.chunk( req.body.split( REGEX_BODY_SPLIT ), 2 ) : [];
				req.body = {};

				array.each( args, function ( i ) {
					req.body[i[0]] = coerce( i[1] );
				} );
			}

			if ( REGEX_JSONENC.test( type ) ) {
				req.body = json.decode( req.body, true );
			}
		}

		arguments[2]();
	}

	function rateLimit ( req, res, next ) {
		rate( obj, req, res, next );
	}

	obj.server.use( mediator ).blacklist( mediator );
	obj.server.use( parse ).blacklist( parse );

	if ( config.rate.enabled ) {
		obj.server.use( rateLimit ).blacklist( rateLimit );
	}

	// Bootstrapping configuration
	config                = auth( obj, config );
	config.headers        = config.headers || {};
	config.headers.server = SERVER;

	// Creating status > message map
	iterate( obj.server.codes, function ( value, key ) {
		obj.messages[value] = obj.server.messages[key];
	} );

	// Setting routes
	if ( config.routes instanceof Object ) {
		iterate( config.routes, function ( routes, method ) {
			iterate( routes, function ( arg, route ) {
				if ( typeof arg == "function" ) {
					obj.server[method]( route, function () {
						arg.apply( obj, array.cast( arguments ) );
					} );
				}
				else {
					obj.server[method]( route, function ( req, res ) {
						obj.respond( req, res, arg );
					} );
				}
			} );
		} );
	}

	// Disabling compression over SSL due to BREACH
	if ( config.ssl.cert && config.ssl.key ) {
		config.compress = false;
		notify = true;
	}

	// Starting API server
	obj.server.start( config, function ( req, res, status, msg ) {
		error( obj.server, req, res, status, msg || obj.messages[status] );
	} );

	if ( notify ) {
		obj.server.log( "Compression over SSL is disabled for your protection", "debug" );
	}

	return obj;
}

/**
 * Route error handler
 *
 * @method error
 * @return {Undefined} undefined
 */
function error ( server, req, res, status, err ) {
	server.respond( req, res, prepare( null, err, status ), status );
}

/**
 * Tenso factory
 *
 * @method factory
 * @param {Object} arg [Optional] Configuration
 * @return {Object}    Tenso instance
 */
function factory ( arg ) {
	var hostname = arg ? arg.hostname || "localhost" : "localhost",
        vhosts   = {},
        config   = arg ? merge( clone( CONFIG, true ), arg ) : CONFIG,
        obj;

	if ( !config.port ) {
		console.error( "Invalid configuration" );
		process.exit( 1 );
	}

	vhosts[hostname]  = "www";
	config.root       = __dirname + "/../";
	config.vhosts     = vhosts;
	config["default"] = hostname;

	obj = new Tenso();
	obj.hostname = hostname;

	return bootstrap( obj, config );
}

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
 * @return {Undefined}      undefined
 */
function hypermedia ( server, req, rep, headers ) {
	var seen = {},
	    query, page, page_size, nth, root, parent;

	// Parsing the object for hypermedia properties
	function parse ( obj, rel, item_collection ) {
		rel      = rel || "related";
		var keys = array.keys( obj );

		if ( keys.length === 0 ) {
			obj = null;
		}
		else {
			array.each( keys, function ( i ) {
				var collection, uri;

				// If ID like keys are found, and are not URIs, they are assumed to be root collections
				if ( REGEX_ID.test( i ) || REGEX_HYPERMEDIA.test( i ) ) {
					if ( !REGEX_ID.test( i ) ) {
						collection = i.replace( REGEX_TRAILING, "" ).replace( REGEX_TRAILING_S, "" ) + "s";
						rel        = "related";
					}
					else {
						collection = item_collection;
						rel        = "item";
					}

					uri = REGEX_SCHEME.test( obj[i] ) ? ( obj[i].indexOf( "//" ) > -1 ? obj[i] : req.parsed.protocol + "//" + req.parsed.host + obj[i] ) : ( req.parsed.protocol + "//" + req.parsed.host + "/" + collection + "/" + obj[i] );

					if ( uri !== root && !seen[uri] ) {
						rep.data.link.push( {uri: uri, rel: rel} );
						seen[uri] = 1;
					}
				}
			} );
		}

		return obj;
	}

	if ( rep.status >= 200 && rep.status <= 206 ) {
		query     = req.parsed.query;
		page      = query.page      || 1;
		page_size = query.page_size || server.config.pageSize || 5;
		rep.data  = {link: [], result: rep.data};
		root      = req.parsed.protocol + "//" + req.parsed.host + req.parsed.pathname;

		if ( req.parsed.pathname !== "/" ) {
			rep.data.link.push( {uri: root.replace( REGEX_TRAIL_SLASH, "" ).replace( REGEX_COLLECTION, "$1" ), rel: "collection"} );
		}

		if ( rep.data.result instanceof Array ) {
			if ( isNaN( page ) || page <= 0 ) {
				page = 1;
			}

			nth     = Math.ceil( rep.data.result.length / page_size );

			if ( nth > 1 ) {
				rep.data.result = array.limit( rep.data.result, ( page - 1 ) * page_size, page_size );
				query.page = 0;
				query.page_size = page_size;

				root += "?" + array.keys( query ).map( function ( i ) {
					return i + "=" + encodeURIComponent( query[i] );
				} ).join( "&" );

				if ( page > 1 ) {
					rep.data.link.push( {uri: root.replace( "page=0", "page=1" ), rel: "first"} );
				}

				if ( page - 1 > 1 && page <= nth ) {
					rep.data.link.push( {uri: root.replace( "page=0", "page=" + ( page - 1 ) ), rel: "prev"} );
				}

				if ( page + 1 < nth ) {
					rep.data.link.push( {uri: root.replace( "page=0", "page=" + ( page + 1 ) ), rel: "next"} );
				}

				if ( nth > 0 && page !== nth ) {
					rep.data.link.push( {uri: root.replace( "page=0", "page=" + nth ), rel: "last"} );
				}
			}
			else {
				root += "?" + array.keys( query ).map( function ( i ) {
					return i + "=" + encodeURIComponent( query[i] );
				} ).join( "&" );
			}

			array.each( rep.data.result, function ( i ) {
				var uri;

				if ( typeof i == "string" && REGEX_SCHEME.test( i ) ) {
					uri = i.indexOf( "//" ) > -1 ? i : req.parsed.protocol + "//" + req.parsed.host + i;

					if ( uri !== root ) {
						rep.data.link.push( {uri: uri, rel: "item"} );
					}
				}

				if ( i instanceof Object ) {
					parse( i, "item", req.parsed.pathname.replace( REGEX_TRAIL_SLASH, "" ).replace( REGEX_LEADING, "" ) );
				}
			} );
		}
		else if ( rep.data.result instanceof Object ) {
			parent = req.parsed.pathname.split( "/" ).filter( function( i ){ return i !== ""; } );

			if ( parent.length > 1 ) {
				parent.pop();
			}

			rep.data.result = parse( rep.data.result, undefined, array.last( parent ) );
		}

		if ( rep.data.link !== undefined && rep.data.link.length > 0 ) {
			headers.link = array.keySort( rep.data.link, "rel, uri" ).map( function ( i ) {
				return "<" + i.uri + ">; rel=\"" + i.rel + "\"";
			} ).join( ", " );
		}
	}

	return rep;
}

/**
 * Keymaster for the request
 *
 * @method keymaster
 * @param  {Object}   req  Client request
 * @param  {Object}   res  Client response
 * @param  {Function} next Next middleware
 * @return {Undefined}     undefined
 */
function keymaster ( req, res, next ) {
	var obj, method, result, routes, uri, valid;

	// No authentication, or it's already happened
	if ( !req.protect || !req.protectAsync || ( req.session && req.isAuthenticated() ) ) {
		obj    = req.server.tenso;
		method = REGEX_GETREWRITE.test( req.method ) ? "get" : req.method.toLowerCase();
		routes = req.server.config.routes[method] || {};
		uri    = req.parsed.pathname;
		valid  = false;

		if ( uri in routes ) {
			result = routes[uri];

			if ( typeof result == "function" ) {
				result.call( obj, req, res );
			}
			else {
				obj.respond( req, res, result );
			}
		}
		else {
			iterate( routes, function ( value, key ) {
				var regex = new RegExp( "^" + key + "$", "i" );

				if ( regex.test( uri ) ) {
					result = value;

					return false;
				}
			} );

			if ( result ) {
				if ( typeof result == "function" ) {
					result.call( obj, req, res );
				}
				else {
					obj.respond( req, res, result );
				}
			}
			else {
				iterate( req.server.config.routes.get || {}, function ( value, key ) {
					var regex = new RegExp( "^" + key + "$", "i" );

					if ( regex.test( uri ) ) {
						valid = true;

						return false;
					}
				} );

				if ( valid ) {
					obj.error( req, res, 405 );
				}
				else {
					obj.error( req, res, 404 );
				}
			}
		}
	}
	else {
		next();
	}
}

/**
 * Prepares a response body
 *
 * @method prepare
 * @param  {Mixed}  arg    [Optional] Response body "data"
 * @param  {Object} error  [Optional] Error instance
 * @param  {Number} status HTTP status code
 * @return {Object}        Standardized response body
 */
function prepare ( arg, error, status ) {
	var data = clone( arg, true );

	if ( arg !== null ) {
		error = null;
	}

	return {
		data   : data   || null,
		error  : error ? ( error.stack || error.message || error ) : null,
		status : status || 200
	};
}

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
function rate ( obj, req, res, next ) {
	var headers = ["x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"],
	    results = obj.rate( req ),
	    valid   = results.shift(),
	    config  = obj.server.config.rate;

	array.each( headers, function ( i, idx ) {
		res.setHeader( i, results[idx] );
	} );

	if ( valid ) {
		next();
	}
	else {
		obj.error( req, res, config.status || 429, config.message || "Too Many Requests" );
	}
}

/**
 * Creates a response
 *
 * @method response
 * @param  {Mixed}  arg    Unserialized response body
 * @param  {Number} status HTTP status, default is `200`
 * @return {Object}        Response body
 */
function response ( arg, status ) {
	var error = arg instanceof Error,
	    rep;

	if ( error ) {
		if ( status === undefined ) {
			throw new Error( "Invalid arguments" );
		}

		rep = prepare( null, arg, status );
	}
	else {
		rep = prepare( arg, null, status );
	}

	return rep;
}

/**
 * Returns middleware to determine if a route is protected
 *
 * @method zuul
 * @param {Array} protect Array of routes
 * @return {Function}    Middleware
 */
function zuul ( protect ) {
	return function zuul ( req, res, next ) {
		var uri      = req.parsed.path,
		    protectd = false;

		array.each( protect, function ( regex ) {
			if ( regex.test( uri ) ) {
				protectd = true;
				return false;
			}
		} );

		// Setting state so the connection can be terminated properly
		req.protect      = protectd;
		req.protectAsync = false;

		if ( protectd && next ) {
			next();
		}
		else {
			keymaster( req, res );
		}
	};
}

module.exports = factory;
} )();
