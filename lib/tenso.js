/**
 * Tensō is a REST framework for node.js, designed to simplify the implementation of APIs.
 *
 * @author Jason Mulligan <jason.mulligan@avoidwork.com>
 * @copyright 2014 Jason Mulligan
 * @license BSD-3 <https://raw.github.com/avoidwork/tenso/master/LICENSE>
 * @link http://avoidwork.github.io/tenso
 * @module tenso
 * @version 0.0.1
 */
( function () {
"use strict";

var TurtleIO = require( "turtle.io" ),
    SERVER   = "tenso/0.0.1";//,
    //keigai   = require( "keigai" );

/**
 * Tenso
 *
 * @constructor
 */
function Tenso () {
	this.server  = new TurtleIO();
	this.version = "0.0.1";
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

	obj.server.start( config );

	return obj;
}

/**
 * Tenso factory
 *
 * @method factory
 * @return {Object} Tenso instance
 */
function factory ( config ) {
	var HOSTNAME = config.hostname || "localhost",
        vhosts   = {},
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

module.exports = factory;
} )();
