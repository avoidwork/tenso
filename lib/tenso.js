/**
 * Tensō is a REST framework for node.js, designed to simplify the implementation of APIs.
 *
 * @author Jason Mulligan <jason.mulligan@avoidwork.com>
 * @copyright 2014 Jason Mulligan
 * @license BSD-3 <https://raw.github.com/avoidwork/tenso/master/LICENSE>
 * @link http://avoidwork.github.io/tenso
 * @module tenso
 * @version 0.0.2
 */
( function () {
"use strict";

var TurtleIO = require( "turtle.io" ),
    SERVER   = "tenso/0.0.2",
    CONFIG   = require( __dirname + "/../config.json" ),
    keigai   = require( "keigai" ),
    util     = keigai.util,
    clone    = util.clone,
    iterate  = util.iterate,
    merge    = util.merge;

/**
 * Tenso
 *
 * @constructor
 */
function Tenso () {
	this.messages = {};
	this.server   = new TurtleIO();
	this.version  = "0.0.2";
}

/**
 * Bootstraps an instance of Tenso
 *
 * @method bootstrap
 * @param  {Object} obj    Tenso instance
 * @param  {Object} config Application configuration
 * @return {Object}        Tenso instance
 */
function bootstrap( obj, config ) {
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
					obj.server[method]( route, arg );
				}
				else {
					obj.server[method]( route, function ( req, res ) {
						this.respond( req, res, prepare( arg ) );
					} );
				}
			} );
		} );
	}

	// Starting API server
	obj.server.start( config, function ( req, res, status ) {
		error( obj.server, req, res, status, obj.messages[status] );
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
 * @return {Object} Tenso instance
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
	config.routes     = require( config.root + config.routes );
	config.vhosts     = vhosts;
	config["default"] = HOSTNAME;

	instance = new Tenso();

	return bootstrap( instance, config );
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
		error  : error ? ( error.message || error.stack || error ) : null,
		status : status || 200
	};
}

factory.prepare = prepare;
module.exports  = factory;
} )();
