/**
 * Setups up authentication
 *
 * @method auth
 * @param  {Object} obj    Tenso instance
 * @param  {Object} config Tenso configuration
 * @return {Object}        Updated Tenso configuration
 */
function auth ( obj, config ) {
	var middleware, protect, tmp;

	if ( config.auth.basic.enabled ) {
		tmp = {};
		tmp[obj.hostname] = {
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
