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
	this.version      = "{{VERSION}}";
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
