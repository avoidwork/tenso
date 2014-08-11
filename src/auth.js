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
	    realm = proto + "://" + ( config.hostname === "localhost" ? "127.0.0.1" : config.hostname ) + ( config.port !== 80 && config.port !== 443 ? ":" + config.port : "" ),
	    login = config.auth.login;

	config.auth.protect = ( config.auth.protect || [] ).map( function ( i ) {
		return new RegExp( "^" + i !== login ? i.replace( /\.\*/g, "*" ).replace( /\*/g, ".*" ) : "$", "i" );
	} );

	obj.server.use( session( {
		name: "tenso",
		resave: true,
		rolling: true,
		saveUninitialized: true,
		secret: config.session.key || uuid(),
		cookie: {
			maxAge: config.session.max_age || 60000
		}
	} ) );

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
	else if ( config.auth.facebook.enabled ) {
		obj.server.use( passport.initialize() );
		obj.server.use( passport.session() );

		passport.use( new FacebookStrategy ( {
				clientID     : config.auth.facebook.client_id,
				clientSecret : config.auth.facebook.client_secret,
				callbackURL  : realm + "/auth/facebook/callback"
			}, function( accessToken, refreshToken, profile, done ) {
				config.auth.facebook.auth( accessToken, refreshToken, profile, function( err, user ) {
					if ( err ) {
						return done( err );
					}

					done( null, user );
				} );
			}
		) );

		config.auth.protect.push( new RegExp( "^/auth/facebook", "i" ) );

		config.routes.get["/auth"]                   = {auth_uri: "/auth/facebook"};
		config.routes.get["/auth/facebook"]          = {callback_uri: "/auth/facebook/callback"};
		config.routes.get["/auth/facebook/callback"] = "ok";

		obj.server.use( "/auth/facebook",          passport.authenticate( "facebook" ) );
		obj.server.use( "/auth/facebook/callback", passport.authenticate( "facebook", {successRedirect: "/", failureRedirect: config.auth.login} ) );
		obj.server.use( "(?!/auth/facebook).*$", function ( req, res, next ) {
			if ( req.isAuthenticated() ) {
				return next();
			}

			res.redirect( config.auth.login );
		} );
	}
	else if ( config.auth.google.enabled ) {
		obj.server.use( passport.initialize() );

		passport.use( new GoogleStrategy ( {
				returnURL : realm + "/auth/google/callback",
				realm     : realm
			}, function( identifier, profile, done ) {
				config.auth.google.auth( identifier, profile, function( err, user ) {
					if ( err ) {
						return done( err );
					}

					done( null, user );
				} );
			}
		) );

		config.auth.protect.push( new RegExp( "^/auth/google", "i" ) );

		config.routes.get["/auth"]                 = {auth_uri: "/auth/google"};
		config.routes.get["/auth/google"]          = {callback_uri: "/auth/google/callback"};
		config.routes.get["/auth/google/callback"] = function ( req, res ) {
			obj.respond( req, res, null, 302, {location: "/"} );
		};

		obj.server.use( "/auth/google",          passport.authenticate( "google" ) );
		obj.server.use( "/auth/google/callback", passport.authenticate( "google", {failureRedirect: config.auth.login} ) );
		obj.server.use( "(?!/auth/google).*$", function ( req, res, next ) {
			if ( req.isAuthenticated() ) {
				return next();
			}

			res.redirect( config.auth.login );
		} );
	}
	else if ( config.auth.local.enabled ) {
		config.routes.get[config.auth.local.login] = "POST credentials to authenticate";
		config.routes.post = config.routes.post || {};
		config.routes.post[config.auth.local.login] = function () {
			var args = array.cast( arguments );

			config.auth.local.auth.apply( obj, args );
		};

		obj.server.use( config.auth.local.middleware );
	}
	else if ( config.auth.linkedin.enabled ) {
		config.auth.protect.push( new RegExp( "^/auth/linkedin", "i" ) );

		obj.server.use( function () {
			arguments[0].protectAsync = true;
			arguments[2]();
		} );

		obj.server.use( "/auth/linkedin", function ( req, res ) {
			var uri   = "https://www.linkedin.com/uas/oauth2/authorization?response_type=code",
				state = uuid( true );

			req.session.state = state;
			req.session.save();

			uri += "&client_id="    + config.auth.linkedin.client_id;
			uri += "&state="        + state;
			uri += "&redirect_uri=" + encodeURIComponent( realm + "/auth/linkedin/callback" );

			if ( config.auth.linkedin.scope ) {
				uri += "&scope=" + config.auth.linkedin.scope;
			}

			res.redirect( uri );
		} );

		obj.server.use( "/auth/linkedin/callback", function ( req, res ) {
			var session = req.session,
			    query   = req.parsed.query,
			    arg, parsed, request, response, uri;

			if ( session && session.state === query.state && query.code ) {
				session.code = query.code;

				uri =  "https://www.linkedin.com/uas/oauth2/accessToken?grant_type=authorization_code";
				uri += "&code=" + query.code;
				uri += "&redirect_uri=" + encodeURIComponent( realm + "/auth/linkedin/callback" );
				uri += "&client_id=" + config.auth.linkedin.client_id;
				uri += "&client_secret=" + config.auth.linkedin.client_secret;

				parsed   = parse( uri );
				request  = httpsync.request( {
					url      : uri,
					method   : "POST",
					protocol : parsed.protocol.replace( ":", ""),
					host     : parsed.host,
					port     : parsed.port,
					path     : parsed.path
				} );
				response = request.end();

				if ( response.headers["Content-Type"].indexOf( "application/json" ) > -1 ) {
					arg = json.decode( response.body.toString(), true );

					if ( arg.access_token ) {
						session.authorized = true;

						config.auth.linkedin.auth.call( obj, session.code, arg.access_token, arg.expires_in, function ( err, user ) {
							if ( err ) {
								session.destroy();
								res.redirect( config.auth.login );
							}

							session.user = user;
							session.save();
							res.redirect( "/" );
						} );
					}
					else {
						session.destroy();
						res.error( 401, {result: arg.error_description || "Unauthorized", login_uri: config.auth.login}  );
						//res.redirect( config.auth.login );
					}
				}
				else {
					res.redirect( config.auth.login );
				}
			}
			else {
				res.redirect( config.auth.login );
			}
		} );

		obj.server.use( "(?!/auth/linkedin).*", function ( req, res, next ) {
			if ( !req.session.authorized ) {
				res.redirect( config.auth.login );
			}

			next();
		} );

		config.routes.get["/auth"] = {auth_uri: "/auth/linkedin"};

		config.routes.get["/logout"] = function ( req, res ) {
			if ( req.session ) {
				req.session.destroy();
			}

			res.redirect( "/" );
		};
	}
	else if ( config.auth.twitter.enabled ) {
		config.auth.protect.push( new RegExp( "^/auth/twitter", "i" ) );

		obj.server.use( function () {
			arguments[0].protectAsync = true;
			arguments[2]();
		} );

		obj.server.use( passport.initialize() );
		obj.server.use( passport.session() );

		passport.use( new TwitterStrategy ( {
				consumerKey    : config.auth.twitter.consumer_key,
				consumerSecret : config.auth.twitter.consumer_secret,
				callbackURL    : realm + "/auth/twitter/callback"
			}, function( token, tokenSecret, profile, done ) {
				config.auth.twitter.auth( token, tokenSecret, profile, function( err, user ) {
					if ( err ) {
						return done( err );
					}

					done( null, user );
				} );
			}
		) );

		obj.server.use( "/auth/twitter", function () {
			console.log("here");
			arguments[2]();
		} );

		obj.server.use( "/auth/twitter",          passport.authenticate( "twitter" ) );
		obj.server.use( "/auth/twitter/callback", passport.authenticate( "twitter", {successRedirect: "/", failureRedirect: config.auth.login} ) );
		obj.server.use( "(?!/auth/twitter).*", function ( req, res, next ) {
			if ( req.isAuthenticated() ) {
				return next();
			}

			res.redirect( config.auth.login );
		} );

		config.routes.get["/auth"]                  = {auth_uri: "/auth/twitter"};
		config.routes.get["/auth/twitter"]          = {callback_uri: "/auth/twitter/callback"};
		config.routes.get["/auth/twitter/callback"] = function () {
			arguments[1].redirect( "/" );
		};
	}

	obj.server.use( keymaster );

	return config;
}
