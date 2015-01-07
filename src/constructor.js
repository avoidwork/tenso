/**
 * Tenso
 *
 * @constructor
 */
function Tenso () {
	this.hostname = "";
	this.messages = {};
	this.rates = {};
	this.server = turtleio();
	this.server.tenso = this;
	this.version = "{{VERSION}}";
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

	return this;
};

/**
 * Returns rate limit information for Client request
 *
 * @method rate
 * @memberOf Tenso
 * @param  {Object} req Client request
 * @param  {Object} fn  [Optional] Override default rate limit
 * @return {Array}      Array of rate limit information `[valid, total, remaining, reset]`
 */
Tenso.prototype.rate = function ( req, fn ) {
	var config = this.server.config.rate,
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

	if ( typeof fn == "function" ) {
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
	}
	else {
		valid = false;
	}

	return [ valid, limit, remaining, reset ];
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
	this.server.respond( req, res, this.server.messages.NO_CONTENT, this.server.codes.FOUND, { location: uri } );

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
	var ref;

	if ( !res._header ) {
		ref = [ headers || {} ];

		if ( req.protect ) {
			if ( ref[ 0 ][ "cache-control" ] === undefined && this.server.config.headers[ "cache-control" ] ) {
				ref[ 0 ][ "cache-control" ] = clone( this.server.config.headers[ "cache-control" ], true );
			}
			if ( ref[ 0 ][ "cache-control" ] !== undefined && ref[ 0 ][ "cache-control" ].indexOf( "private " ) == -1 ) {
				ref[ 0 ][ "cache-control" ] = "private " + ref[ 0 ][ "cache-control" ];
			}
		}

		if ( REGEX_MODIFY.test( req.allow ) && this.server.config.security.csrf && res.locals[ this.server.config.security.key ] ) {
			ref[ 0 ][ this.server.config.security.key ] = res.locals[ this.server.config.security.key ];
		}

		this.server.respond( req, res, hypermedia( this.server, req, response( arg, status ), ref[ 0 ] ), status, ref[ 0 ] );
	}

	return this;
};
