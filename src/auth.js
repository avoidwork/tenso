/**
 * Setups up authentication
 *
 * @method auth
 * @param  {Object} obj    Tenso instance
 * @param  {Object} config Tenso configuration
 * @return {Object}        Updated Tenso configuration
 */
function auth ( obj, config ) {
	var middleware, login, protect;

	array.each( array.keys( config.auth ), function ( i ) {
		if ( i.enabled && i.login ) {
			login = i.login;

			return false;
		}
	} );

	protect = ( config.auth.protect || [] ).map( function ( i ) {
		return new RegExp( "^" + i !== login ? i.replace( /\.\*/g, "*" ).replace( /\*/g, ".*" ) : "$", "i" );
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

	obj.server.use( session( {
		name: "tenso",
		resave: true,
		rolling: false,
		saveUninitialized: false,
		secret: config.session.key || uuid(),
		cookie: {
			maxAge: config.session.max_age || 60000
		}
	} ) );

	obj.server.use( middleware );

	if ( config.auth.basic.enabled ) {
		( function () {
			var x = {},
			    fn;

			array.each( config.auth.basic.list || [], function ( i ) {
				var login = i.split( ":" );

				if ( login.length > 0 ) {
					x[login[0]] = {password: login[1]};
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
	else if ( config.auth.local.enabled ) {
		config.routes.get[config.auth.local.login] = "POST credentials to authenticate";
		config.routes.post = config.routes.post || {};
		config.routes.post[config.auth.local.login] = function ( req ) {
			var args = array.cast( arguments );

			if ( req.session === undefined ) {
				req.sessionStore.get( req.sessionId, function ( session ) {
					if ( req.session === undefined ) {
						if ( session ) {
							req.session = session;
							req.session.save();
						}
						else {
							req.session = {};
						}

						if ( parse( req.url ).pathname !== config.auth.local.login ) {
							config.auth.local.auth.apply( obj, args );
						}
					} } );
			}
			else {
				config.auth.local.auth.apply( obj, args );
			}
		};

		obj.server.use( config.auth.local.middleware );
	}

	return config;
}
