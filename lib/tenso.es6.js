/**
 * Tensō is a REST API facade for node.js, designed to simplify the implementation of APIs.
 *
 * @author Jason Mulligan <jason.mulligan@avoidwork.com>
 * @copyright 2015 Jason Mulligan
 * @license BSD-3-Clause
 * @link http://avoidwork.github.io/tenso
 * @module tenso
 * @version 2.0.0
 */
const CONFIG = require( __dirname + "/../config.json" );
const VERSION = "2.0.0";
const SERVER = "tenso/" + VERSION;

let keigai = require( "keigai" ),
	util = keigai.util,
	array = util.array,
	coerce = util.coerce,
	iterate = util.iterate,
	json = util.json,
	merge = util.merge,
	string = util.string,
	uuid = util.uuid,
	xml = util.xml,
	fs = require( "fs" ),
	path = require( "path" ),
	yaml = require( "yamljs" ),
	turtleio = require( "turtle.io" ),
	session = require( "express-session" ),
	cookie = require( "cookie-parser" ),
	lusca = require( "lusca" ),
	passport = require( "passport" ),
	BasicStrategy = require( "passport-http" ).BasicStrategy,
	BearerStrategy = require( "passport-http-bearer" ).Strategy,
	FacebookStrategy = require( "passport-facebook" ).Strategy,
	GoogleStrategy = require( "passport-google" ).Strategy,
	LinkedInStrategy = require( "passport-linkedin" ).Strategy,
	LocalStrategy = require( "passport-local" ).Strategy,
	OAuth2Strategy = require( "passport-oauth2" ).Strategy,
	SAMLStrategy = require( "passport-saml" ).Strategy,
	TwitterStrategy = require( "passport-twitter" ).Strategy,
	RedisStore = require( "connect-redis" )( session );

/**
 * RegExp cache
 *
 * @type Object
 */
const REGEX = {
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

class Tenso {
	/**
	 * Tenso
	 *
	 * @constructor
	 */
	constructor () {
		this.hostname = "";
		this.messages = {};
		this.rates = {};
		this.server = turtleio();
		this.server.tenso = this;
		this.version = VERSION;
	}

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
	error ( req, res, status, arg ) {
		this.server.error( req, res, status, arg );

		return this;
	}

	/**
	 * Returns rate limit information for Client request
	 *
	 * @method rate
	 * @memberOf Tenso
	 * @param  {Object} req Client request
	 * @param  {Object} fn  [Optional] Override default rate limit
	 * @return {Array}      Array of rate limit information `[valid, total, remaining, reset]`
	 */
	rate ( req, fn ) {
		let config = this.server.config.rate,
			id = req.sessionID || req.ip,
			valid = true,
			seconds = parseInt( new Date().getTime() / 1000, 10 ),
			limit, remaining, reset, state;

		if ( !this.rates[ id ] ) {
			this.rates[ id ] = {
				limit: config.limit,
				remaining: config.limit,
				reset: seconds + config.reset,
				time_reset: config.reset
			};
		}

		if ( typeof fn === "function" ) {
			this.rates[ id ] = fn( req, this.rates[ id ] );
		}

		state = this.rates[ id ];
		limit = state.limit;
		remaining = state.remaining;
		reset = state.reset;

		if ( seconds >= reset ) {
			reset = state.reset = ( seconds + config.reset );
			remaining = state.remaining = limit - 1;
		}
		else if ( remaining > 0 ) {
			state.remaining--;
			remaining = state.remaining;
		} else {
			valid = false;
		}

		return [ valid, limit, remaining, reset ];
	}

	/**
	 * Redirects the Client
	 *
	 * @method redirect
	 * @memberOf Tenso
	 * @param  {Object} req Client request
	 * @param  {Object} res Client response
	 * @param  {Mixed}  uri Target URI
	 * @return {Object} {@link Tenso}
	 */
	redirect ( req, res, uri ) {
		this.server.respond( req, res, this.server.messages.NO_CONTENT, this.server.codes.FOUND, { location: uri } );

		return this;
	}

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
	render ( req, arg, headers ) {
		let accept = req.parsed.query.format || req.headers.accept || "application/json";
		let accepts = string.explode( accept, ";" );
		let format = "json";

		array.each( this.server.config.renderers || [], function ( i ) {
			var found = false;

			array.each( accepts, function ( x ) {
				if ( x.indexOf( i ) > -1 ) {
					format = i;
					found = true;
					return false;
				}
			} );

			if ( found ) {
				return false;
			}
		} );

		headers["content-type"] = renderers[ format ].header;

		return renderers[ format ].fn( arg, req, headers, format === "html" ? this.server.config.template : undefined );
	}

	/**
	 * Registers a renderer
	 *
	 * @method renderer
	 * @memberOf Tenso
	 * @param {String}   name     Name of the renderer, e.g. "html"
	 * @param {Function} fn       Function accepts `arg, req, headers, template`
	 * @param {String}   mimetype Content-Type value
	 * @return {Object}           {@link Tenso}
	 */
	renderer ( name, fn, mimetype ) {
		renderers[ name ] = { fn: fn, header: mimetype };
		array.add( this.server.config.renderers, name );

		return this;
	}

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
	 * @return {Object}         {@link Tenso}
	 */
	respond ( req, res, arg, status, headers ) {
		let ref;

		if ( !res._header ) {
			ref = [ headers || {} ];

			if ( res._headers ) {
				merge( ref[ 0 ], res._headers );
			}

			if ( req.protect ) {
				if ( ref[ 0 ][ "cache-control" ] === undefined && this.server.config.headers[ "cache-control" ] ) {
					ref[ 0 ][ "cache-control" ] = clone( this.server.config.headers[ "cache-control" ] );
				}

				if ( ref[ 0 ][ "cache-control" ] !== undefined && ref[ 0 ][ "cache-control" ].indexOf( "private " ) === -1 ) {
					ref[ 0 ][ "cache-control" ] = "private " + ref[ 0 ][ "cache-control" ];
				}
			}

			if ( !REGEX.modify.test( req.method ) && REGEX.modify.test( req.allow ) && this.server.config.security.csrf && res.locals[ this.server.config.security.key ] ) {
				ref[ 0 ][ this.server.config.security.key ] = res.locals[ this.server.config.security.key ];
			}

			status = status || 200;
			ref[ 0 ] = this.server.headers( req, ref[ 0 ], status );

			this.server.respond( req, res, this.render( req, hypermedia( this.server, req, response( arg, status ), ref[ 0 ] ), ref[ 0 ] ), status, ref[ 0 ] );
		}

		return this;
	}
}

/**
 * Setups up authentication
 *
 * @method auth
 * @param  {Object} obj    Tenso instance
 * @param  {Object} config Tenso configuration
 * @return {Object}        Updated Tenso configuration
 */
function auth ( obj, config ) {
	let ssl = config.ssl.cert && config.ssl.key,
		proto = "http" + ( ssl ? "s" : "" ),
		realm = proto + "://" + ( config.hostname === "localhost" ? "127.0.0.1" : config.hostname ) + ( config.port !== 80 && config.port !== 443 ? ":" + config.port : "" ),
		async = ( config.auth.facebook.enabled || config.auth.google.enabled || config.auth.linkedin.enabled || config.auth.twitter.enabled ),
		stateless = ( config.auth.basic.enabled || config.auth.bearer.enabled ),
		stateful = ( async || config.auth.local.enabled || config.security.csrf ),
		authMap = {},
		authUris = [],
		keys, sesh, fnCookie, fnSesh, luscaCsrf, luscaCsp, luscaXframe, luscaP3p, luscaHsts, luscaXssProtection, protection, passportAuth, passportInit, passportSession;

	function asyncFlag ( req, res, next ) {
		req.protectAsync = true;
		next();
	}

	function bypass ( req, res, next ) {
		if ( config.auth.unprotect.filter( function ( i ) { return i.test( req.url ); } ).length > 0 ) {
			req.protect = false;
			req.unprotect = true;
		}

		next();
	}

	function csrfWrapper ( req, res, next ) {
		if ( req.unprotect ) {
			next();
		} else {
			luscaCsrf( req, res, next );
		}
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
		if ( req.url === "/login" || req.isAuthenticated() ) {
			rate( obj, req, res, next );
		} else {
			res.redirect( "/login" );
		}
	}

	function redirect ( req, res ) {
		res.redirect( config.auth.redirect );
	}

	obj.server.blacklist( asyncFlag );

	config.auth.protect = ( config.auth.protect || [] ).map( function ( i ) {
		return new RegExp( "^" + i !== "/login" ? i.replace( /\.\*/g, "*" ).replace( /\*/g, ".*" ) : "$", "i" );
	} );

	config.auth.unprotect = ( config.auth.unprotect || [] ).map( function ( i ) {
		return new RegExp( "^" + i !== "/login" ? i.replace( /\.\*/g, "*" ).replace( /\*/g, ".*" ) : "$", "i" );
	} );

	if ( async ) {
		iterate( config.auth, function ( v, k ) {
			if ( v.enabled ) {
				authMap[ k + "_uri" ] = "/auth/" + k;
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
		obj.server.use( bypass ).blacklist( bypass );

		if ( config.security.csrf ) {
			luscaCsrf = lusca.csrf( { key: config.security.key, secret: config.security.secret } );
			obj.server.use( csrfWrapper ).blacklist( csrfWrapper );
		}
	}

	if ( config.security.csp instanceof Object ) {
		luscaCsp = lusca.csp( config.security.csp );
		obj.server.use( luscaCsp ).blacklist( luscaCsp );
	}

	if ( !string.isEmpty( config.security.xframe || "" ) ) {
		luscaXframe = lusca.xframe( config.security.xframe );
		obj.server.use( luscaXframe ).blacklist( luscaXframe );
	}

	if ( !string.isEmpty( config.security.p3p || "" ) ) {
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
	} else {
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
				config.routes.get[ "/auth" ] = authMap;
			}

			( function () {
				let r = "(?!/auth/(";

				array.each( authUris, function ( i ) {
					r += i.replace( "_uri", "" ) + "|";
				} );

				r = r.replace( /\|$/, "" ) + ")).*$";

				obj.server.use( r, guard ).blacklist( guard );
			} )();

			config.routes.get[ "/login" ] = config.auth.local.enabled ? ( keys ? {
				login_uri: "/auth",
				instruction: "POST 'username' & 'password' to authenticate"
			} : { instruction: "POST 'username' & 'password' to authenticate" } ) : { login_uri: "/auth" };
		}
		else if ( config.auth.local.enabled ) {
			config.routes.get[ "/login" ] = { instruction: "POST 'username' & 'password' to authenticate" };
		}

		config.routes.get[ "/logout" ] = function ( req, res ) {
			if ( req.session ) {
				req.session.destroy();
			}

			res.redirect( config.auth.redirect );
		};
	}

	if ( config.auth.basic.enabled ) {
		( function () {
			let x = {};

			function validate ( arg, cb ) {
				if ( x[ arg ] ) {
					cb( null, x[ arg ] );
				} else {
					cb( new Error( "Unauthorized" ), null );
				}
			}

			array.each( config.auth.basic.list || [], function ( i ) {
				let args = i.split( ":" );

				if ( args.length > 0 ) {
					x[ args[ 0 ] ] = { password: args[ 1 ] };
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

			passportAuth = passport.authenticate( "basic", { session: stateful } );

			if ( async || config.auth.local.enabled ) {
				obj.server.get( "/auth/basic", passportAuth ).blacklist( passportAuth );
				obj.server.get( "/auth/basic", redirect );
			} else {
				obj.server.use( passportAuth ).blacklist( passportAuth );
			}
		} )();
	}

	if ( config.auth.bearer.enabled ) {
		( function () {
			let x = config.auth.bearer.tokens || [];

			function validate ( arg, cb ) {
				if ( array.contains( x, arg ) ) {
					cb( null, arg );
				} else {
					cb( new Error( "Unauthorized" ), null );
				}
			};

			passport.use( new BearerStrategy( function ( token, done ) {
				validate( token, function ( err, user ) {
					if ( err ) {
						delete err.stack;
						return done( err );
					}

					if ( !user ) {
						return done( null, false );
					}

					return done( null, user, { scope: "read" } );
				} );
			} ) );

			passportAuth = passport.authenticate( "bearer", { session: stateful } );

			if ( async || config.auth.local.enabled ) {
				obj.server.get( "/auth/bearer", passportAuth ).blacklist( passportAuth );
				obj.server.get( "/auth/bearer", redirect );
			} else {
				obj.server.use( passportAuth ).blacklist( passportAuth );
			}
		})();
	}

	if ( config.auth.facebook.enabled ) {
		passport.use( new FacebookStrategy( {
			clientID: config.auth.facebook.client_id,
			clientSecret: config.auth.facebook.client_secret,
			callbackURL: realm + "/auth/facebook/callback"
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
		obj.server.get( "/auth/facebook/callback", passport.authenticate( "facebook", { failureRedirect: "/login" } ) );
		obj.server.get( "/auth/facebook/callback", redirect );
	}

	if ( config.auth.google.enabled ) {
		passport.use( new GoogleStrategy( {
			returnURL: realm + "/auth/google/callback",
			realm: realm
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
		obj.server.get( "/auth/google/callback", passport.authenticate( "google", { failureRedirect: "/login" } ) );
		obj.server.get( "/auth/google/callback", redirect );
	}

	if ( config.auth.linkedin.enabled ) {
		passport.use( new LinkedInStrategy( {
				consumerKey: config.auth.linkedin.client_id,
				consumerSecret: config.auth.linkedin.client_secret,
				callbackURL: realm + "/auth/linkedin/callback"
			}, function ( token, tokenSecret, profile, done ) {
				config.auth.linkedin.auth( token, tokenSecret, profile, function ( err, user ) {
					if ( err ) {
						delete err.stack;
						return done( err );
					}

					done( null, user );
				} );
			} ) );

		obj.server.get( "/auth/linkedin", asyncFlag );
		obj.server.get( "/auth/linkedin", passport.authenticate( "linkedin", { "scope": config.auth.linkedin.scope || [ "r_basicprofile", "r_emailaddress" ] } ) );
		obj.server.get( "/auth/linkedin/callback", asyncFlag );
		obj.server.get( "/auth/linkedin/callback", passport.authenticate( "linkedin", { failureRedirect: "/login" } ) );
		obj.server.get( "/auth/linkedin/callback", redirect );
	}

	if ( config.auth.local.enabled ) {
		passport.use( new LocalStrategy( function ( username, password, done ) {
			config.auth.local.auth( username, password, function ( err, user ) {
				if ( err ) {
					delete err.stack;
					return done( err );
				}

				done( null, user );
			} );
		} ) );

		config.routes.post = config.routes.post || {};
		config.routes.post[ "/login" ] = function ( req, res ) {
			function final () {
				passport.authenticate( "local" )( req, res, function ( e ) {
					if ( e ) {
						res.error( 401, "Unauthorized" );
					}
					else if ( req.cors && req.headers[ "x-requested-with" ] && req.headers[ "x-requested-with" ] === "XMLHttpRequest" ) {
						res.respond( "Success" );
					} else {
						res.redirect( config.auth.redirect );
					}
				} );
			}

			function mid () {
				passportSession( req, res, final );
			}

			passportInit( req, res, mid );
		};
	}

	if ( config.auth.oauth2.enabled ) {
		passport.use( new OAuth2Strategy( {
			authorizationURL: config.auth.oauth2.auth_url,
			tokenURL: config.auth.oauth2.token_url,
			clientID: config.auth.oauth2.client_id,
			clientSecret: config.auth.oauth2.client_secret,
			callbackURL: realm + "/auth/oauth2/callback"
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
		obj.server.get( "/auth/oauth2/callback", passport.authenticate( "oauth2", { failureRedirect: "/login" } ) );
		obj.server.get( "/auth/oauth2/callback", redirect );
	}

	if ( config.auth.saml.enabled ) {
		( function () {
			let config = config.auth.saml;

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
		obj.server.get( "/auth/saml/callback", passport.authenticate( "saml", { failureRedirect: "/login" } ) );
		obj.server.get( "/auth/saml/callback", redirect );
	}

	if ( config.auth.twitter.enabled ) {
		passport.use( new TwitterStrategy( {
			consumerKey: config.auth.twitter.consumer_key,
			consumerSecret: config.auth.twitter.consumer_secret,
			callbackURL: realm + "/auth/twitter/callback"
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
		obj.server.get( "/auth/twitter/callback", passport.authenticate( "twitter", {
			successRedirect: config.auth.redirect,
			failureRedirect: "/login"
		} ) );
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
	let notify = false;

	function mediator ( req, res, next ) {
		res.error = function ( status, body ) {
			return obj.error( req, res, status, body );
		};

		res.redirect = function ( uri ) {
			return obj.redirect( req, res, uri );
		};

		res.respond = function ( body, status, headers ) {
			return obj.respond( req, res, body, status, headers );
		};

		next();
	}


	function parse ( req, res, next ) {
		let args, type;

		if ( REGEX.body.test( req.method ) && req.body !== undefined ) {
			type = req.headers[ "content-type" ];

			if ( REGEX.encode_form.test( type ) ) {
				args = req.body ? array.chunk( req.body.split( REGEX.body_split ), 2 ) : [];
				req.body = {};

				array.each( args, function ( i ) {
					req.body[ i[ 0 ] ] = coerce( i[ 1 ] );
				} );
			}

			if ( REGEX.encode_json.test( type ) ) {
				req.body = json.decode( req.body, true ) || req.body;
			}
		}

		next();
	}

	obj.server.use( mediator ).blacklist( mediator );
	obj.server.use( parse ).blacklist( parse );

	// Bootstrapping configuration
	config = auth( obj, config );
	config.headers = config.headers || {};
	config.headers.server = SERVER;

	// Creating status > message map
	iterate( obj.server.codes, function ( value, key ) {
		obj.messages[ value ] = obj.server.messages[ key ];
	} );

	// Setting routes
	iterate( config.routes, function ( routes, method ) {
		iterate( routes, function ( arg, route ) {
			if ( typeof arg === "function" ) {
				obj.server[ method ]( route, function ( ...args ) {
					arg.apply( obj, args );
				} );
			} else {
				obj.server[ method ]( route, function ( req, res ) {
					obj.respond( req, res, arg );
				} );
			}
		} );
	} );

	// Disabling compression over SSL due to BREACH
	if ( config.ssl.cert && config.ssl.key ) {
		config.compress = false;
		notify = true;
	}

	// Starting API server
	obj.server.start( config, function ( req, res, status, msg ) {
		var stat = status instanceof Error ? parseInt ( status.message, 10 ) : status,
			err = msg instanceof Error ? msg : new Error( msg || obj.messages[ stat ] );

		error( obj, req, res, stat, err, obj );
	} );

	if ( notify ) {
		obj.server.log( "Compression over SSL is disabled for your protection", "debug" );
	}

	return obj;
}

/**
 * Shallow clones an Object
 *
 * @method clone
 * @param {Mixed} arg To be cloned
 * @returns {Mixed}   Clone of `arg`
 */
function clone ( arg ) {
	return JSON.parse( JSON.stringify( arg ) );
}

/**
 * Route error handler
 *
 * @method error
 * @return {Undefined} undefined
 */
function error ( server, req, res, status, err ) {
	server.respond( req, res, err, status );
}

/**
 * Tenso factory
 *
 * @method factory
 * @param {Object} arg [Optional] Configuration
 * @return {Object}    Tenso instance
 */
function factory ( arg ) {
	let hostname = arg ? arg.hostname || "localhost" : "localhost",
		vhosts = {},
		config = arg ? merge( clone( CONFIG ), arg ) : CONFIG,
		obj;

	if ( !config.port ) {
		console.error( "Invalid configuration" );
		process.exit( 1 );
	}

	vhosts[ hostname ] = "www";
	config.root = path.join( __dirname, ".." );
	config.vhosts = vhosts;
	config[ "default" ] = hostname;
	config.template = fs.readFileSync( path.join( config.root, "template.html" ), { encoding: "utf8" } );
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
 * @return {Object}         HTTP response body
 */
function hypermedia ( server, req, rep, headers ) {
	let seen = {},
		protocol = req.headers[ "x-forwarded-proto" ] ? req.headers[ "x-forwarded-proto" ] + ":" : req.parsed.protocol,
		query, page, page_size, nth, root, parent;

	// Parsing the object for hypermedia properties
	function parse ( obj, rel, item_collection ) {
		rel = rel || "related";
		let keys = array.keys( obj );

		if ( keys.length === 0 ) {
			obj = null;
		} else {
			array.each( keys, function ( i ) {
				let collection, uri;

				// If ID like keys are found, and are not URIs, they are assumed to be root collections
				if ( REGEX.id.test( i ) || REGEX.hypermedia.test( i ) ) {
					if ( !REGEX.id.test( i ) ) {
						collection = i.replace( REGEX.trailing, "" ).replace( REGEX.trailing_s, "" ).replace( REGEX.trailing_y, "ie" ) + "s";
						rel = "related";
					} else {
						collection = item_collection;
						rel = "item";
					}

					uri = REGEX.scheme.test( obj[ i ] ) ? obj[ i ] : ( "/" + collection + "/" + obj[ i ] );

					if ( uri !== root && !seen[ uri ] ) {
						rep.links.push( { uri: uri, rel: rel } );
						seen[ uri ] = 1;
					}
				}
			} );
		}

		return obj;
	}

	if ( rep.status >= 200 && rep.status <= 206 ) {
		query = req.parsed.query;
		page = query.page || 1;
		page_size = query.page_size || server.config.pageSize || 5;
		root = req.parsed.pathname;

		if ( req.parsed.pathname !== "/" ) {
			rep.links.push( {
				uri: root.replace( REGEX.trailing_slash, "" ).replace( REGEX.collection, "$1" ) || "/",
				rel: "collection"
			} );
		}

		if ( rep.data instanceof Array ) {
			if ( req.method === "GET" ) {
				if ( isNaN( page ) || page <= 0 ) {
					page = 1;
				}

				nth = Math.ceil( rep.data.length / page_size );

				if ( nth > 1 ) {
					rep.data = array.limit( rep.data, ( page - 1 ) * page_size, page_size );
					query.page = 0;
					query.page_size = page_size;

					root += "?" + array.keys( query ).map( function ( i ) {
							return i + "=" + encodeURIComponent( query[ i ] );
						} ).join( "&" );

					if ( page > 1 ) {
						rep.links.push( { uri: root.replace( "page=0", "page=1" ), rel: "first" } );
					}

					if ( page - 1 > 1 && page <= nth ) {
						rep.links.push( { uri: root.replace( "page=0", "page=" + ( page - 1 ) ), rel: "prev" } );
					}

					if ( page + 1 < nth ) {
						rep.links.push( { uri: root.replace( "page=0", "page=" + ( page + 1 ) ), rel: "next" } );
					}

					if ( nth > 0 && page !== nth ) {
						rep.links.push( { uri: root.replace( "page=0", "page=" + nth ), rel: "last" } );
					}
				} else {
					root += "?" + array.keys( query ).map( function ( i ) {
							return i + "=" + encodeURIComponent( query[ i ] );
						} ).join( "&" );
				}
			}

			array.each( rep.data, function ( i ) {
				let uri;

				if ( typeof i === "string" && REGEX.scheme.test( i ) ) {
					if ( i !== root ) {
						rep.links.push( { uri: i, rel: "item" } );
					}
				}

				if ( i instanceof Object ) {
					parse( i, "item", req.parsed.pathname.replace( REGEX.trailing_slash, "" ).replace( REGEX.leading, "" ) );
				}
			} );
		}
		else if ( rep.data instanceof Object ) {
			parent = req.parsed.pathname.split( "/" ).filter( function ( i ) {
				return i !== "";
			} );

			if ( parent.length > 1 ) {
				parent.pop();
			}

			rep.data = parse( rep.data, undefined, array.last( parent ) );
		}

		if ( rep.links.length > 0 ) {
			headers.link = array.keySort( rep.links, "rel, uri" ).map( function ( i ) {
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
	let obj = req.server.tenso,
		method, result, routes, uri, valid;

	// No authentication, or it's already happened
	if ( !req.protect || !req.protectAsync || ( req.session && req.isAuthenticated() ) ) {
		method = REGEX.get_rewrite.test( req.method ) ? "get" : req.method.toLowerCase();
		routes = req.server.config.routes[ method ] || {};
		uri = req.parsed.pathname;
		valid = false;

		rate( obj, req, res, function () {
			if ( uri in routes ) {
				result = routes[ uri ];

				if ( typeof result === "function" ) {
					result.call( obj, req, res );
				} else {
					obj.respond( req, res, result );
				}
			} else {
				iterate( routes, function ( value, key ) {
					let REGEX = new RegExp( "^" + key + "$", "i" );

					if ( REGEX.test( uri ) ) {
						result = value;

						return false;
					}
				} );

				if ( result ) {
					if ( typeof result === "function" ) {
						result.call( obj, req, res );
					} else {
						obj.respond( req, res, result );
					}
				} else {
					iterate( req.server.config.routes.get || {}, function ( value, key ) {
						let REGEX = new RegExp( "^" + key + "$", "i" );

						if ( REGEX.test( uri ) ) {
							valid = true;

							return false;
						}
					} );

					if ( valid ) {
						obj.error( req, res, 405 );
					} else {
						obj.error( req, res, 404 );
					}
				}
			}
		} );
	} else {
		rate( obj, req, res, next );
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
	let data = clone( arg );

	if ( arg !== null ) {
		error = null;
	}

	return {
		data: data || null,
		error: error ? ( error.message || error ) : null,
		links: [],
		status: status || 200
	};
}

function sanitize ( arg ) {
	let output = arg;

	if ( typeof arg === "string" ) {
		array.each( [ [ "<", "&lt;" ], [ ">", "&gt;" ] ], function ( i ) {
			output = output.replace( new RegExp( i[ 0 ], "g" ), i[ 1 ] );
		} );
	}

	return output;
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
	let headers = [ "x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset" ],
		config = obj.server.config.rate,
		results = obj.rate( req, config.override ),
		valid = results.shift();

	array.each( headers, function ( i, idx ) {
		res.setHeader( i, results[ idx ] );
	} );

	if ( valid ) {
		next();
	} else {
		obj.error( req, res, config.status || 429, config.message || "Too Many Requests" );
	}
}

/**
 * Renderers
 *
 * @type {Object}
 */
let renderers = {
	csv: {
		fn: function ( arg, req ) {
			req.headers.accept = "text/csv";
			return arg.data.result;
		},
		header: "text/csv"
	},
	html: {
		fn: function ( arg, req, headers, tpl ) {
			var protocol = req.headers[ "x-forwarded-proto" ] ? req.headers[ "x-forwarded-proto" ] + ":" : req.parsed.protocol;

			return ( tpl || "" )
				.replace( /\{\{title\}\}/g, req.server.config.title )
				.replace( "{{url}}", req.parsed.href.replace( req.parsed.protocol, protocol ) )
				.replace( "{{headers}}", Object.keys( headers ).sort( array.sort ).map( function ( i ) {
					return "<tr><td>"+ i + "</td><td>"+ sanitize( headers[ i ] ) + "</td></tr>";
				} ).join( "\n" ) )
				.replace( "{{formats}}", req.server.config.renderers.map( function ( i ) {
					return "<option value='" + i + "'>"+ i.toUpperCase() + "</option>";
				} ).join( "\n" ) )
				.replace( "{{body}}", JSON.stringify( arg, null, 2 ) )
				.replace( "{{year}}", new Date().getFullYear() )
				.replace( "{{version}}", "2.0.0" )
				.replace( "{{allow}}", headers[ "allow" ] )
				.replace( "{{methods}}", string.explode( headers[ "allow" ].replace( "GET, HEAD, OPTIONS", "" ) ).filter( function ( i ) {
					return i !== "";
				} ).map( function ( i ) {
					return "<option value='" + i + "'>"+ i + "</option>";
				} ).join( "\n" ) )
				.replace( "{{csrf}}", headers[ "x-csrf-token" ] || "" );
		},
		header: "text/html"
	},
	json: {
		fn: function ( arg ) {
			return arg;
		},
		header: "application/json"
	},
	yaml: {
		fn: function ( arg ) {
			return yaml.stringify( arg, 4 );
		},
		header: "application/yaml"
	},
	xml: {
		fn: function ( arg ) {
			return xml.encode( arg );
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
function response ( arg, status ) {
	let error = arg instanceof Error,
		rep;

	if ( error ) {
		if ( status === undefined ) {
			throw new Error( "Invalid arguments" );
		}

		rep = prepare( null, arg, status );
	} else {
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
	return function ( req, res, next ) {
		let uri = req.parsed.path,
			protectd = false;

		array.each( protect, function ( r ) {
			if ( r.test( uri ) ) {
				return !( protectd = true );
			}
		} );

		// Setting state so the connection can be terminated properly
		req.protect = protectd;
		req.protectAsync = false;

		if ( protectd && next ) {
			next();
		} else {
			keymaster( req, res );
		}
	};
}

module.exports = factory;
