/**
 * Tenso
 *
 * @constructor
 */
function Tenso () {
	this.messages = {};
	this.server   = new TurtleIO();
	this.version  = "{{VERSION}}";
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
