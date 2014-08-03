/**
 * Tensō is a REST API facade for node.js, designed to simplify the implementation of APIs.
 *
 * @author Jason Mulligan <jason.mulligan@avoidwork.com>
 * @copyright 2014 Jason Mulligan
 * @license BSD-3 <https://raw.github.com/avoidwork/tenso/master/LICENSE>
 * @link http://avoidwork.github.io/tenso
 * @module tenso
 * @version 0.1.0
 */
( function () {
"use strict";

var TurtleIO = require( "turtle.io" ),
    SERVER   = "tenso/0.1.0",
    CONFIG   = require( __dirname + "/../config.json" ),
    keigai   = require( "keigai" ),
    util     = keigai.util,
    array    = util.array,
    string   = util.string,
    clone    = util.clone,
    iterate  = util.iterate,
    merge    = util.merge,
    passport = require( "passport" ),
    BearerStrategy = require( "passport-http-bearer" ).Strategy;

/**
 * Tenso
 *
 * @constructor
 */
function Tenso () {
	this.messages = {};
	this.server   = new TurtleIO();
	this.version  = "0.1.0";
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
 * Bootstraps Tenso instance
 *
 * @method bootstrap
 * @return {Object} Tenso instance
 */
Tenso.prototype.bootstrap = function () {
	return this;
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

	this.server.respond( req, res, hypermedia( this.server, req, response( arg, status ), ref[0] ), status, ref[0] );
};

/**
 * Setups up authentication
 *
 * @method auth
 * @param  {Object} obj      Tenso instance
 * @param  {Object} config   Tenso configuration
 * @param  {String} hostname Server hostname
 * @return {Object}          Updated Tenso configuration
 */
function auth ( obj, config, hostname ) {
	var middleware, protect, tmp;

	if ( config.auth.basic.enabled === "enabled" ) {
		tmp = {};
		tmp[hostname] = {
			authRealm : config.auth.basic.realm || "Private",
			authList  : config.auth.basic.list
		};

		config.auth = tmp;
	}
	else {
		protect = ( config.auth.protect || [] ).map( function ( i ) {
			return new RegExp( "^" + string.escape( i ), "i" );
		} );

		middleware = function ( req, res, next ) {
			var uri      = req.parsed.pathname,
				protectd = false;

			array.each( protect, function ( regex ) {
				if ( regex.test( uri ) ) {
					protectd = true;
					return false;
				}
			} );

			if ( protectd && next ) {
				next();
			}
		};

		obj.server.use( middleware );
		obj.server.use( passport.initialize() );

		if ( config.auth.bearer.enabled ) {
			( function () {
				var fn, x;

				x  = config.auth.bearer.tokens || [];
				fn = function ( arg, cb ) {
					if ( x.length > 0 ) {
						if ( x.indexOf( arg ) > -1 ) {
							cb( null, arg );
						}
						else {
							cb( new Error( "Unauthorized" ), null );
						}
					}
					else {
						cb( new Error( "Bearer token list is empty" ), null );
					}
				};

				passport.use( new BearerStrategy (
					function( token, done ) {
						fn( token, function ( err, user ) {
							if ( err ) {
								// Removing the stack for a clean error message
								delete err.stack;
								return done( err );
							}

							if (!user) {
								return done( null, false );
							}

							return done( null, user, {scope: "read"} );
						} );
					}
				) );

				obj.server.use( passport.authenticate( "bearer", {session: false} ) );
			} )();
		}
	}

	return config;
}

/**
 * Bootstraps an instance of Tenso
 *
 * @method bootstrap
 * @param  {Object} obj      Tenso instance
 * @param  {Object} config   Application configuration
 * @param  {Object} hostname API hostname
 * @return {Object}          Tenso instance
 */
function bootstrap ( obj, config, hostname ) {
	config = auth( obj, config, hostname );

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
	var HOSTNAME = arg ? arg.hostname || "localhost" : "localhost",
        vhosts   = {},
        config   = arg ? merge( clone( CONFIG, true ), arg ) : CONFIG,
        instance;

	if ( !config.port ) {
		console.error( "Invalid configuration" );
		process.exit( 1 );
	}

	vhosts[HOSTNAME]  = "www";
	config.root       = __dirname + "/../";
	config.vhosts     = vhosts;
	config["default"] = HOSTNAME;

	instance = new Tenso();

	return bootstrap( instance, config );
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

				// If ID like keys are found, and are not URLs, they are assumed to be root collections
				if ( /_(guid|uuid|id|url|uri)$/.test( i ) ) {
					collection = i.replace( /_.*$/, "" ).replace( /s$/, "" ) + "s";
					uri =/^(\w+\:\/\/)|\//.test( rep.data.result[i] ) ? ( rep.data.result[i].indexOf( "//" ) > -1 ? rep.data.result[i] : req.parsed.protocol + "//" + req.parsed.host + rep.data.result[i] ) : ( req.parsed.protocol + "//" + req.parsed.host + "/" + collection + "/" + rep.data.result[i] );
					rep.data.link.push( {uri: uri, rel: "related"} );
					delete rep.data.result[i];
				}
			} );
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
 * Prepares a response body
 *
 * @method prepare
 * @param  {Mixed}  data   [Optional] Response body "data"
 * @param  {Object} error  [Optional] Error instance
 * @param  {Number} status HTTP status code
 * @return {Object}        Standardized response body
 */
function prepare ( data, error, status ) {
	if ( data !== null ) {
		error = null;
	}

	return {
		data   : data   || null,
		error  : error ? ( error.stack || error.message || error ) : null,
		status : status || 200
	};
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

module.exports = factory;
} )();
