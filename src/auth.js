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
	var middleware, tmp;

	if ( config.auth.basic.enabled === "enabled" ) {
		tmp = {};
		tmp[hostname] = {
			authRealm : config.auth.basic.realm || "Private",
			authList  : config.auth.basic.list
		};

		config.auth = tmp;
	}
	else {
		middleware = function ( req, res, next ) {
			var uri = req.parsed.pathname;

			if ( req.protect === undefined ) {
				array.each( config.auth.protect || [], function ( i ) {
					var regex = new RegExp( "^" + string.escape( i ), "i" );

					if ( regex.test( uri ) ) {
						req.protect = true;
						return false;
					}
				} );

				if ( req.protect === undefined ) {
					req.protect = false;
				}
			}

			if ( req.protect && next ) {
				next();
			}
			else {
				return true;
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
							cb( null, {} );
						}
					}
					else {
						cb( new Error( "Bearer token list is empty" ), null );
					}
				};

				passport.use(new BearerStrategy(
					function(token, done) {
						fn(token, function (err, user) {
							if (err) {
								return done(err);
							}

							if (!user) {
								return done(null, false);
							}

							return done(null, user, {scope: "read"});
						});
					}
				));

				obj.server.use( passport.authenticate( "bearer", {session: false} ) );
			} )();
		}
	}

	return config;
}
