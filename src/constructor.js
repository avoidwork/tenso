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
		let accept = req.headers.accept || "application/json";
		let accepts = string.explode( accept, ";" );
		let format = "json";

		array.iterate( this.server.config.renderers || [], function ( i ) {
			var found = false;

			array.iterate( accepts, function ( x ) {
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
	respond ( req, res, arg, status, headers ) {
		let ref;

		if ( !res._header ) {
			ref = [ headers || {} ];

			if ( res._headers ) {
				merge( ref[ 0 ], res._headers );
			}

			if ( req.protect ) {
				if ( ref[ 0 ][ "cache-control" ] === undefined && this.server.config.headers[ "cache-control" ] ) {
					ref[ 0 ][ "cache-control" ] = clone( this.server.config.headers[ "cache-control" ], true );
				}

				if ( ref[ 0 ][ "cache-control" ] !== undefined && ref[ 0 ][ "cache-control" ].indexOf( "private " ) == -1 ) {
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
