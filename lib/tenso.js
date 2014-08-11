/**
 * Tensō is a REST API facade for node.js, designed to simplify the implementation of APIs.
 *
 * @author Jason Mulligan <jason.mulligan@avoidwork.com>
 * @copyright 2014 Jason Mulligan
 * @license BSD-3 <https://raw.github.com/avoidwork/tenso/master/LICENSE>
 * @link http://avoidwork.github.io/tenso
 * @module tenso
 * @version 0.4.0
 */
( function () {
"use strict";

var turtleio = require( "turtle.io" ),
    SERVER   = "tenso/0.4.0",
    CONFIG   = require( __dirname + "/../config.json" ),
    keigai   = require( "keigai" ),
    util     = keigai.util,
    array    = util.array,
    clone    = util.clone,
    iterate  = util.iterate,
    json     = util.json,
    merge    = util.merge,
    parse    = util.parse,
    uuid     = util.uuid,
    session  = require( "express-session" ),
    passport = require( "passport" ),
    httpsync = require( "http-sync" ),
    BasicStrategy    = require( "passport-http" ).BasicStrategy,
    BearerStrategy   = require( "passport-http-bearer" ).Strategy,
    FacebookStrategy = require( "passport-facebook" ).Strategy,
    GoogleStrategy   = require( "passport-google" ).Strategy,
    TwitterStrategy  = require( "passport-twitter" ).Strategy;

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
	this.version      = "0.4.0";
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
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @param  {Mixed}  uri Target URI
 */
Tenso.prototype.error = function ( req, res, status, arg ) {
	this.server.error( req, res, status, arg );
};

/**
 * Returns rate limit information for Client request
 *
 * @method rate
 * @memberOf Tenso
 * @param {Object} req Client request
 * @returns {Array}    Array of rate limit information `[valid, total, remaining, reset]`
 */
Tenso.prototype.rate = function ( req ) {
	var now       = new Date(),
		next_hour = parseInt( now.setHours( now.getHours() + 1 ) / 1000, 10 ),
		config    = this.server.config.rate,
		limit     = 0,
		remaining = 0,
		reset     = 0,
		regex     = /(Basic|Bearer)\s/,
		id        = req.headers.authorization ? req.headers.authorization.replace( regex, "" ) : req.sessionID || req.ip,
		valid     = true,
		state;

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
	var ssl   = config.ssl.cert && config.ssl.key,
	    proto = "http" + ( ssl ? "s" : "" ),
	    realm = proto + "://" + ( config.hostname === "localhost" ? "127.0.0.1" : config.hostname ) + ( config.port !== 80 && config.port !== 443 ? ":" + config.port : "" ),
	    login = config.auth.login;

	config.auth.protect = ( config.auth.protect || [] ).map( function ( i ) {
		return new RegExp( "^" + i !== login ? i.replace( /\.\*/g, "*" ).replace( /\*/g, ".*" ) : "$", "i" );
	} );

	obj.server.use( session( {
		name: "tenso",
		resave: true,
		rolling: true,
		saveUninitialized: true,
		secret: config.session.key || uuid(),
		cookie: {
			maxAge: config.session.max_age || 60000
		}
	} ) );

	obj.server.use( zuul( config.auth.protect ) );

	if ( config.auth.basic.enabled ) {
		( function () {
			var x = {},
			    fn;

			array.each( config.auth.basic.list || [], function ( i ) {
				var args = i.split( ":" );

				if ( args.length > 0 ) {
					x[args[0]] = {password: args[1]};
				}
			} );

			fn = function ( arg, cb ) {
				if ( x[arg] ) {
					cb( null, x[arg] );
				}
				else {
					cb( new Error( "Unauthorized" ), null );
				}
			};

			obj.server.use( passport.initialize() );

			passport.use( new BasicStrategy (
				function( username, password, done ) {
					fn( username, function ( err, user ) {
						if ( err ) {
							// Removing the stack for a clean error message
							delete err.stack;
							return done( err );
						}

						if ( !user || user.password !== password ) {
							return done( null, false );
						}

						return done( null, user );
					} );
				}
			) );

			obj.server.use( passport.authenticate( "basic", {session: false} ) );
		} )();
	}
	else if ( config.auth.bearer.enabled ) {
		( function () {
			var fn, x;

			x  = config.auth.bearer.tokens || [];
			fn = function ( arg, cb ) {
				if ( x.indexOf( arg ) > -1 ) {
					cb( null, arg );
				}
				else {
					cb( new Error( "Unauthorized" ), null );
				}
			};

			obj.server.use( passport.initialize() );

			passport.use( new BearerStrategy (
				function( token, done ) {
					fn( token, function ( err, user ) {
						if ( err ) {
							// Removing the stack for a clean error message
							delete err.stack;
							return done( err );
						}

						if ( !user ) {
							return done( null, false );
						}

						return done( null, user, {scope: "read"} );
					} );
				}
			) );

			obj.server.use( passport.authenticate( "bearer", {session: false} ) );
		} )();
	}
	else if ( config.auth.facebook.enabled ) {
		obj.server.use( passport.initialize() );
		obj.server.use( passport.session() );

		passport.use( new FacebookStrategy ( {
				clientID     : config.auth.facebook.client_id,
				clientSecret : config.auth.facebook.client_secret,
				callbackURL  : realm + "/auth/facebook/callback"
			}, function( accessToken, refreshToken, profile, done ) {
				config.auth.facebook.auth( accessToken, refreshToken, profile, function( err, user ) {
					if ( err ) {
						return done( err );
					}

					done( null, user );
				} );
			}
		) );

		config.auth.protect.push( new RegExp( "^/auth/facebook", "i" ) );

		config.routes.get["/auth"]                   = {auth_uri: "/auth/facebook"};
		config.routes.get["/auth/facebook"]          = {callback_uri: "/auth/facebook/callback"};
		config.routes.get["/auth/facebook/callback"] = "ok";

		obj.server.use( "/auth/facebook",          passport.authenticate( "facebook" ) );
		obj.server.use( "/auth/facebook/callback", passport.authenticate( "facebook", {successRedirect: "/", failureRedirect: config.auth.login} ) );
		obj.server.use( "(?!/auth/facebook).*$", function ( req, res, next ) {
			if ( req.isAuthenticated() ) {
				return next();
			}

			res.redirect( config.auth.login );
		} );
	}
	else if ( config.auth.google.enabled ) {
		obj.server.use( passport.initialize() );

		passport.use( new GoogleStrategy ( {
				returnURL : realm + "/auth/google/callback",
				realm     : realm
			}, function( identifier, profile, done ) {
				config.auth.google.auth( identifier, profile, function( err, user ) {
					if ( err ) {
						return done( err );
					}

					done( null, user );
				} );
			}
		) );

		config.auth.protect.push( new RegExp( "^/auth/google", "i" ) );

		config.routes.get["/auth"]                 = {auth_uri: "/auth/google"};
		config.routes.get["/auth/google"]          = {callback_uri: "/auth/google/callback"};
		config.routes.get["/auth/google/callback"] = function ( req, res ) {
			obj.respond( req, res, null, 302, {location: "/"} );
		};

		obj.server.use( "/auth/google",          passport.authenticate( "google" ) );
		obj.server.use( "/auth/google/callback", passport.authenticate( "google", {failureRedirect: config.auth.login} ) );
		obj.server.use( "(?!/auth/google).*$", function ( req, res, next ) {
			if ( req.isAuthenticated() ) {
				return next();
			}

			res.redirect( config.auth.login );
		} );
	}
	else if ( config.auth.local.enabled ) {
		config.routes.get[config.auth.local.login] = "POST credentials to authenticate";
		config.routes.post = config.routes.post || {};
		config.routes.post[config.auth.local.login] = function () {
			var args = array.cast( arguments );

			config.auth.local.auth.apply( obj, args );
		};

		obj.server.use( config.auth.local.middleware );
	}
	else if ( config.auth.linkedin.enabled ) {
		config.auth.protect.push( new RegExp( "^/auth/linkedin", "i" ) );

		obj.server.use( function () {
			arguments[0].protectAsync = true;
			arguments[2]();
		} );

		obj.server.use( "/auth/linkedin", function ( req, res ) {
			var uri   = "https://www.linkedin.com/uas/oauth2/authorization?response_type=code",
				state = uuid( true );

			req.session.state = state;
			req.session.save();

			uri += "&client_id="    + config.auth.linkedin.client_id;
			uri += "&state="        + state;
			uri += "&redirect_uri=" + encodeURIComponent( realm + "/auth/linkedin/callback" );

			if ( config.auth.linkedin.scope ) {
				uri += "&scope=" + config.auth.linkedin.scope;
			}

			res.redirect( uri );
		} );

		obj.server.use( "/auth/linkedin/callback", function ( req, res ) {
			var session = req.session,
			    query   = req.parsed.query,
			    arg, parsed, request, response, uri;

			if ( session && session.state === query.state && query.code ) {
				session.code = query.code;

				uri =  "https://www.linkedin.com/uas/oauth2/accessToken?grant_type=authorization_code";
				uri += "&code=" + query.code;
				uri += "&redirect_uri=" + encodeURIComponent( realm + "/auth/linkedin/callback" );
				uri += "&client_id=" + config.auth.linkedin.client_id;
				uri += "&client_secret=" + config.auth.linkedin.client_secret;

				parsed   = parse( uri );
				request  = httpsync.request( {
					url      : uri,
					method   : "POST",
					protocol : parsed.protocol.replace( ":", ""),
					host     : parsed.host,
					port     : parsed.port,
					path     : parsed.path
				} );
				response = request.end();

				if ( response.headers["Content-Type"].indexOf( "application/json" ) > -1 ) {
					arg = json.decode( response.body.toString(), true );

					if ( arg.access_token ) {
						session.authorized = true;

						config.auth.linkedin.auth.call( obj, session.code, arg.access_token, arg.expires_in, function ( err, user ) {
							if ( err ) {
								session.destroy();
								res.redirect( config.auth.login );
							}

							session.user = user;
							session.save();
							res.redirect( "/" );
						} );
					}
					else {
						session.destroy();
						res.error( 401, {result: arg.error_description || "Unauthorized", login_uri: config.auth.login}  );
						//res.redirect( config.auth.login );
					}
				}
				else {
					res.redirect( config.auth.login );
				}
			}
			else {
				res.redirect( config.auth.login );
			}
		} );

		obj.server.use( "(?!/auth/linkedin).*", function ( req, res, next ) {
			if ( !req.session.authorized ) {
				res.redirect( config.auth.login );
			}

			next();
		} );

		config.routes.get["/auth"] = {auth_uri: "/auth/linkedin"};

		config.routes.get["/logout"] = function ( req, res ) {
			if ( req.session ) {
				req.session.destroy();
			}

			res.redirect( "/" );
		}
	}
	else if ( config.auth.twitter.enabled ) {
		config.auth.protect.push( new RegExp( "^/auth/twitter", "i" ) );

		obj.server.use( function () {
			arguments[0].protectAsync = true;
			arguments[2]();
		} );

		obj.server.use( passport.initialize() );
		obj.server.use( passport.session() );

		passport.use( new TwitterStrategy ( {
				consumerKey    : config.auth.twitter.consumer_key,
				consumerSecret : config.auth.twitter.consumer_secret,
				callbackURL    : realm + "/auth/twitter/callback"
			}, function( token, tokenSecret, profile, done ) {
				config.auth.twitter.auth( token, tokenSecret, profile, function( err, user ) {
					if ( err ) {
						return done( err );
					}

					done( null, user );
				} );
			}
		) );

		obj.server.use( "/auth/twitter", function () {
			console.log("here");
			arguments[2]();
		} );

		obj.server.use( "/auth/twitter",          passport.authenticate( "twitter" ) );
		obj.server.use( "/auth/twitter/callback", passport.authenticate( "twitter", {successRedirect: "/", failureRedirect: config.auth.login} ) );
		obj.server.use( "(?!/auth/twitter).*", function ( req, res, next ) {
			if ( req.isAuthenticated() ) {
				return next();
			}

			res.redirect( config.auth.login );
		} );

		config.routes.get["/auth"]                  = {auth_uri: "/auth/twitter"};
		config.routes.get["/auth/twitter"]          = {callback_uri: "/auth/twitter/callback"};
		config.routes.get["/auth/twitter/callback"] = function () {
			arguments[1].redirect( "/" );
		};
	}

	obj.server.use( keymaster );

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
	// Early middleware hook for rate limiting
	if ( config.rate.enabled ) {
		obj.server.use( function ( req, res, next ) {
			rate( obj, req, res, next );
		} );
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
		obj.server.log( "Compression over SSL is disabled for your protection", "debug" );
	}

	// Starting API server
	obj.server.start( config, function ( req, res, status, msg ) {
		error( obj.server, req, res, status, msg || obj.messages[status] );
	} );

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
	var query, page, page_size, nth, root;

	if ( rep.status >= 200 && rep.status <= 206 ) {
		query     = req.parsed.query;
		page      = query.page      || 1;
		page_size = query.page_size || server.config.pageSize || 5;
		rep.data  = {link: [], result: rep.data};
		root      = req.parsed.protocol + "//" + req.parsed.host + req.parsed.pathname;

		if ( rep.data.result instanceof Array ) {
			if ( isNaN( page ) || page <= 0 ) {
				page = 1;
			}

			nth             = Math.ceil( rep.data.result.length / page_size );
			rep.data.result = array.limit( rep.data.result, ( page - 1 ) * page_size, page_size );
			query.page      = 0;
			query.page_size = page_size;

			root += "?" + array.keys( query ).map( function ( i ) {
				return i + "=" + encodeURIComponent( query[i] );
			} ).join ( "&" );

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
				rep.data.link.push( {uri: root.replace("page=0", "page=" + nth ), rel: "last"} );
			}
		}
		else if ( rep.data.result instanceof Object ) {
			array.each( array.keys( rep.data.result ), function ( i ) {
				var collection, uri;

				// If ID like keys are found, and are not URIs, they are assumed to be root collections
				if ( /_(guid|uuid|id|url|uri)$/.test( i ) ) {
					collection = i.replace( /_.*$/, "" ).replace( /s$/, "" ) + "s";
					uri =/^(\w+\:\/\/)|\//.test( rep.data.result[i] ) ? ( rep.data.result[i].indexOf( "//" ) > -1 ? rep.data.result[i] : req.parsed.protocol + "//" + req.parsed.host + rep.data.result[i] ) : ( req.parsed.protocol + "//" + req.parsed.host + "/" + collection + "/" + rep.data.result[i] );
					rep.data.link.push( {uri: uri, rel: "related"} );
					delete rep.data.result[i];
				}
			} );

			if ( array.keys( rep.data.result ).length === 0 ) {
				rep.data.result = null;
			}
		}

		if ( rep.data.link !== undefined && rep.data.link.length > 0 ) {
			headers.link = rep.data.link.map( function ( i ) {
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
	var obj, result, routes, uri, valid;

	// No authentication, or it's already happened
	if ( !req.protect || !req.protectAsync || ( req.session && req.isAuthenticated() ) ) {
		obj    = req.server.tenso;
		routes = req.server.config.routes[req.method.toLowerCase()] || {};
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
 * @return {Undefined}    undefined
 */
function zuul ( protect ) {
	return function ( req, res, next ) {
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
