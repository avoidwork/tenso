/**
 * Setups up authentication
 *
 * @method auth
 * @param  {Object} obj    Tenso instance
 * @param  {Object} config Tenso configuration
 * @return {Object}        Updated Tenso configuration
 */
function auth ( obj, config ) {
	var ssl   = config.ssl.cert && config.ssl.key,
	    proto = "http" + ( ssl ? "s" : "" ),
	    realm = proto + "://" + ( config.hostname === "localhost" ? "127.0.0.1" : config.hostname ) + ( config.port !== 80 && config.port !== 443 ? ":" + config.port : "" );

	config.auth.protect = ( config.auth.protect || [] ).map( function ( i ) {
		return new RegExp( "^" + i !== "/login" ? i.replace( /\.\*/g, "*" ).replace( /\*/g, ".*" ) : "$", "i" );
	} );

	// Enabling sessions for non basic/bearer auth
	if ( config.auth.facebook.enabled || config.auth.google.enabled || config.auth.local.enabled || config.auth.linkedin.enabled || config.auth.twitter.enabled ) {
		obj.server.use( session( {secret: config.session.secret || uuid()} ) );
		obj.server.use( cookie() );
	}

	obj.server.use( zuul( config.auth.protect ) );

	if ( config.auth.basic.enabled ) {
		( function () {
			var x = {},
			    fn;

			array.each( config.auth.basic.list || [], function ( i ) {
				var args = i.split( ":" );

				if ( args.length > 0 ) {
					x[args[0]] = {password: args[1]};
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
		obj.server.use( config.auth.local.middleware );

		config.routes.get["/login"] = "POST credentials to authenticate";
		config.routes.get["/logout"] = function ( req, res ) {
			if ( req.session.authorized ) {
				req.session.destroy();
			}

			res.redirect( "/" );
		};
		config.routes.post = config.routes.post || {};
		config.routes.post["/login"] = function () {
			config.auth.local.auth.apply( obj, arguments );
		};
	}
	else {
		obj.server.use( function asyncFlag () {
			arguments[0].protectAsync = true;
			arguments[2]();
		} );

		obj.server.use( passport.initialize() );
		obj.server.use( passport.session() );

		passport.serializeUser( function ( user, done ) {
			done( null, user );
		} );

		passport.deserializeUser( function ( obj, done ) {
			done( null, obj );
		} );

		if ( config.auth.facebook.enabled ) {
			config.auth.protect.push( new RegExp( "^/auth/facebook", "i" ) );

			passport.use( new FacebookStrategy( {
					clientID: config.auth.facebook.client_id,
					clientSecret: config.auth.facebook.client_secret,
					callbackURL: realm + "/auth/facebook/callback"
				}, function ( accessToken, refreshToken, profile, done ) {
					config.auth.facebook.auth( accessToken, refreshToken, profile, function ( err, user ) {
						if ( err ) {
							return done( err );
						}

						done( null, user );
					} );
				}
			) );

			config.routes.get["/auth"] = {auth_uri: "/auth/facebook"};
			config.routes.get["/auth/facebook"] = {callback_uri: "/auth/facebook/callback"};
			config.routes.get["/auth/facebook/callback"] = function () {
				arguments[1].redirect( "/" );
			};

			obj.server.use( "/auth/facebook", passport.authenticate( "facebook" ) );
			obj.server.use( "/auth/facebook/callback", passport.authenticate( "facebook", {successRedirect: "/", failureRedirect: "/login"} ) );
			obj.server.use( "(?!/auth/facebook).*$", function ( req, res, next ) {
				if ( req.isAuthenticated() ) {
					return next();
				}
				else {
					res.redirect( "/login" );
				}
			} );
		}
		else if ( config.auth.google.enabled ) {
			config.auth.protect.push( new RegExp( "^/auth/google", "i" ) );

			passport.use( new GoogleStrategy( {
					returnURL: realm + "/auth/google/callback",
					realm: realm
				}, function ( identifier, profile, done ) {
					config.auth.google.auth.call( obj, identifier, profile, function ( err, user ) {
						if ( err ) {
							return done( err );
						}

						done( null, user );
					} );
				}
			) );

			config.routes.get["/auth"] = {auth_uri: "/auth/google"};
			config.routes.get["/auth/google"] = {callback_uri: "/auth/google/callback"};
			config.routes.get["/auth/google/callback"] = function () {
				arguments[1].redirect( "/" );
			};

			obj.server.use( "/auth/google", passport.authenticate( "google" ) );
			obj.server.use( "/auth/google/callback", passport.authenticate( "google", {failureRedirect: "/login"} ) );
			obj.server.use( "(?!/auth/google).*$", function ( req, res, next ) {
				if ( req.isAuthenticated() ) {
					return next();
				}
				else {
					res.redirect( "/login" );
				}
			} );
		}
		else if ( config.auth.linkedin.enabled ) {
			config.auth.protect.push( new RegExp( "^/auth/linkedin", "i" ) );

			passport.use( new LinkedInStrategy( {
					consumerKey: config.auth.linkedin.client_id,
					consumerSecret: config.auth.linkedin.client_secret,
					callbackURL: realm + "/auth/linkedin/callback"
				},
				function ( token, tokenSecret, profile, done ) {
					config.auth.linkedin.auth( token, tokenSecret, profile, function ( err, user ) {
						if ( err ) {
							return done( err );
						}

						done( null, user );
					} );
				}
			) );

			obj.server.get( "/auth/linkedin", passport.authenticate( "linkedin" ) );
			obj.server.get( "/auth/linkedin/callback", passport.authenticate( "linkedin", {failureRedirect: "/login"} ) );
			obj.server.get( "/auth/linkedin/callback", function () {
				arguments[1].redirect( "/" );
			} );
			obj.server.use( "(?!/auth/linkedin).*", function ( req, res, next ) {
				if ( req.isAuthenticated() ) {
					return next();
				}
				else {
					res.redirect( "/login" );
				}
			} );

			config.routes.get["/auth"] = {auth_uri: "/auth/linkedin"};
		}
		else if ( config.auth.twitter.enabled ) {
			config.auth.protect.push( new RegExp( "^/auth/twitter", "i" ) );

			passport.use( new TwitterStrategy( {
					consumerKey: config.auth.twitter.consumer_key,
					consumerSecret: config.auth.twitter.consumer_secret,
					callbackURL: realm + "/auth/twitter/callback"
				}, function ( token, tokenSecret, profile, done ) {
					config.auth.twitter.auth( token, tokenSecret, profile, function ( err, user ) {
						if ( err ) {
							return done( err );
						}

						done( null, user );
					} );
				}
			) );

			obj.server.get( "/auth/twitter", passport.authenticate( "twitter" ) );
			obj.server.get( "/auth/twitter/callback", passport.authenticate( "twitter", {successRedirect: "/", failureRedirect: "/login"} ) );
			obj.server.use( "(?!/auth/twitter).*", function ( req, res, next ) {
				if ( req.isAuthenticated() ) {
					return next();
				}

				res.redirect( "/login" );
			} );

			config.routes.get["/auth"] = {auth_uri: "/auth/twitter"};
			config.routes.get["/auth/twitter"] = {callback_uri: "/auth/twitter/callback"};
			config.routes.get["/auth/twitter/callback"] = function () {
				arguments[1].redirect( "/" );
			};
		}

		config.routes.get["/login"] = {login_uri: "/auth"};
		config.routes.get["/logout"] = function ( req, res ) {
			if ( req.session.authorized || req.session.isAuthorized() ) {
				req.session.destroy();
			}

			res.redirect( "/" );
		};
	}

	return config;
}
