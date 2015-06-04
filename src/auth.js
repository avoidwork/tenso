/**
 * Setups up authentication
 *
 * @method auth
 * @param  {Object} obj    Tenso instance
 * @param  {Object} config Tenso configuration
 * @return {Object}        Updated Tenso configuration
 */
let auth = ( obj, config ) => {
	let ssl = config.ssl.cert && config.ssl.key,
		proto = "http" + ( ssl ? "s" : "" ),
		realm = proto + "://" + ( config.hostname === "localhost" ? "127.0.0.1" : config.hostname ) + ( config.port !== 80 && config.port !== 443 ? ":" + config.port : "" ),
		async = ( config.auth.facebook.enabled || config.auth.google.enabled || config.auth.linkedin.enabled || config.auth.twitter.enabled ),
		stateless = ( config.auth.basic.enabled || config.auth.bearer.enabled ),
		stateful = ( async || config.auth.local.enabled || config.security.csrf ),
		authMap = {},
		authUris = [],
		keys, sesh, fnCookie, fnSesh, luscaCsrf, luscaCsp, luscaXframe, luscaP3p, luscaHsts, luscaXssProtection, protection, passportAuth, passportInit, passportSession;

	let asyncFlag = ( req, res, next ) => {
		req.protectAsync = true;
		next();
	};

	let bypass = function ( req, res, next ) {
		if ( config.auth.unprotect.filter( function ( i ) { return i.test( req.url ); } ).length === 0 ) {
			next();
		} else {
			keymaster( req, res );
		}
	};

	let init = ( session ) => {
		passportInit = passport.initialize();
		obj.server.use( passportInit ).blacklist( passportInit );

		if ( session ) {
			passportSession = passport.session();
			obj.server.use( passportSession ).blacklist( passportSession );
		}
	};

	let guard = ( req, res, next ) => {
		if ( req.url === "/login" || req.isAuthenticated() ) {
			rate( obj, req, res, next );
		} else {
			res.redirect( "/login" );
		}
	};

	let redirect = ( req, res ) => {
		res.redirect( config.auth.redirect );
	};

	obj.server.blacklist( asyncFlag );

	config.auth.protect = ( config.auth.protect || [] ).map( i => {
		return new RegExp( "^" + i !== "/login" ? i.replace( /\.\*/g, "*" ).replace( /\*/g, ".*" ) : "$", "i" );
	} );

	config.auth.unprotect = ( config.auth.unprotect || [] ).map( i => {
		return new RegExp( "^" + i !== "/login" ? i.replace( /\.\*/g, "*" ).replace( /\*/g, ".*" ) : "$", "i" );
	} );

	if ( async ) {
		iterate( config.auth, ( v, k ) => {
			if ( v.enabled ) {
				authMap[ k + "_uri" ] = "/auth/" + k;
				config.auth.protect.push( new RegExp( "^/auth/" + k ) );
			}
		} );
	}

	authUris = array.keys( authMap );

	if ( config.auth.local.enabled ) {
		authUris.push( config.auth.redirect );
		authUris.push( "/login" );
	}

	if ( stateful ) {
		sesh = {
			secret: config.session.secret || uuid(),
			saveUninitialized: true,
			rolling: true,
			resave: true
		};

		if ( config.session.store === "redis" ) {
			sesh.store = new RedisStore( config.session.redis );
		}

		fnCookie = cookie();
		fnSesh = session( sesh );

		obj.server.use( fnSesh ).blacklist( fnSesh );
		obj.server.use( fnCookie ).blacklist( fnCookie );
		obj.server.use( bypass ).blacklist( bypass );

		if ( config.security.csrf ) {
			luscaCsrf = lusca.csrf( { key: config.security.key, secret: config.security.secret } );
			obj.server.use( luscaCsrf ).blacklist( luscaCsrf );
		}
	}

	if ( config.security.csp instanceof Object ) {
		luscaCsp = lusca.csp( config.security.csp );
		obj.server.use( luscaCsp ).blacklist( luscaCsp );
	}

	if ( !string.isEmpty( config.security.xframe || "" ) ) {
		luscaXframe = lusca.xframe( config.security.xframe );
		obj.server.use( luscaXframe ).blacklist( luscaXframe );
	}

	if ( !string.isEmpty( config.security.p3p || "" ) ) {
		luscaP3p = lusca.p3p( config.security.p3p );
		obj.server.use( luscaP3p ).blacklist( luscaP3p );
	}

	if ( config.security.hsts instanceof Object ) {
		luscaHsts = lusca.hsts( config.security.hsts );
		obj.server.use( luscaHsts ).blacklist( luscaHsts );
	}

	if ( config.security.xssProtection instanceof Object ) {
		luscaXssProtection = lusca.xssProtection( config.security.xssProtection );
		obj.server.use( luscaXssProtection ).blacklist( luscaXssProtection );
	}

	protection = zuul( config.auth.protect );
	obj.server.use( protection ).blacklist( protection );

	if ( stateless && !stateful ) {
		init( false );
	} else {
		init( true );

		passport.serializeUser( ( user, done ) => {
			done( null, user );
		} );

		passport.deserializeUser( ( obj, done ) => {
			done( null, obj );
		} );

		if ( authUris.length > 0 ) {
			keys = array.keys( authMap ).length > 0;

			if ( keys ) {
				config.routes.get[ "/auth" ] = authMap;
			}

			(() => {
				let r = "(?!/auth/(";

				array.each( authUris, ( i ) => {
					r += i.replace( "_uri", "" ) + "|";
				} );

				r = r.replace( /\|$/, "" ) + ")).*$";

				obj.server.use( r, guard ).blacklist( guard );
			})();

			config.routes.get[ "/login" ] = config.auth.local.enabled ? ( keys ? {
				login_uri: "/auth",
				instruction: "POST 'username' & 'password' to authenticate"
			} : { instruction: "POST 'username' & 'password' to authenticate" } ) : { login_uri: "/auth" };
		}
		else if ( config.auth.local.enabled ) {
			config.routes.get[ "/login" ] = { instruction: "POST 'username' & 'password' to authenticate" };
		}

		config.routes.get[ "/logout" ] = ( req, res ) => {
			if ( req.session ) {
				req.session.destroy();
			}

			res.redirect( config.auth.redirect );
		};
	}

	if ( config.auth.basic.enabled ) {
		(() => {
			let x = {};

			let validate = ( arg, cb ) => {
				if ( x[ arg ] ) {
					cb( null, x[ arg ] );
				} else {
					cb( new Error( "Unauthorized" ), null );
				}
			};

			array.each( config.auth.basic.list || [], ( i ) => {
				let args = i.split( ":" );

				if ( args.length > 0 ) {
					x[ args[ 0 ] ] = { password: args[ 1 ] };
				}
			} );

			passport.use( new BasicStrategy( ( username, password, done ) => {
				validate( username, ( err, user ) => {
					if ( err ) {
						delete err.stack;
						return done( err );
					}

					if ( !user || user.password !== password ) {
						return done( null, false );
					}

					return done( null, user );
				} );
			} ) );

			passportAuth = passport.authenticate( "basic", { session: stateful } );

			if ( async || config.auth.local.enabled ) {
				obj.server.get( "/auth/basic", passportAuth ).blacklist( passportAuth );
				obj.server.get( "/auth/basic", redirect );
			} else {
				obj.server.use( passportAuth ).blacklist( passportAuth );
			}
		})();
	}

	if ( config.auth.bearer.enabled ) {
		(() => {
			let x = config.auth.bearer.tokens || [];

			let validate = ( arg, cb ) => {
				if ( array.contains( x, arg ) ) {
					cb( null, arg );
				} else {
					cb( new Error( "Unauthorized" ), null );
				}
			};

			passport.use( new BearerStrategy( ( token, done ) => {
				validate( token, ( err, user ) => {
					if ( err ) {
						delete err.stack;
						return done( err );
					}

					if ( !user ) {
						return done( null, false );
					}

					return done( null, user, { scope: "read" } );
				} );
			} ) );

			passportAuth = passport.authenticate( "bearer", { session: stateful } );

			if ( async || config.auth.local.enabled ) {
				obj.server.get( "/auth/bearer", passportAuth ).blacklist( passportAuth );
				obj.server.get( "/auth/bearer", redirect );
			} else {
				obj.server.use( passportAuth ).blacklist( passportAuth );
			}
		})();
	}

	if ( config.auth.facebook.enabled ) {
		passport.use( new FacebookStrategy( {
			clientID: config.auth.facebook.client_id,
			clientSecret: config.auth.facebook.client_secret,
			callbackURL: realm + "/auth/facebook/callback"
		}, ( accessToken, refreshToken, profile, done ) => {
			config.auth.facebook.auth( accessToken, refreshToken, profile, ( err, user ) => {
				if ( err ) {
					delete err.stack;
					return done( err );
				}

				done( null, user );
			} );
		} ) );

		obj.server.get( "/auth/facebook", asyncFlag );
		obj.server.get( "/auth/facebook", passport.authenticate( "facebook" ) );
		obj.server.get( "/auth/facebook/callback", asyncFlag );
		obj.server.get( "/auth/facebook/callback", passport.authenticate( "facebook", { failureRedirect: "/login" } ) );
		obj.server.get( "/auth/facebook/callback", redirect );
	}

	if ( config.auth.google.enabled ) {
		passport.use( new GoogleStrategy( {
			returnURL: realm + "/auth/google/callback",
			realm: realm
		}, ( identifier, profile, done ) => {
			config.auth.google.auth.call( obj, identifier, profile, ( err, user ) => {
				if ( err ) {
					delete err.stack;
					return done( err );
				}

				done( null, user );
			} );
		} ) );

		obj.server.get( "/auth/google", asyncFlag );
		obj.server.get( "/auth/google", passport.authenticate( "google" ) );
		obj.server.get( "/auth/google/callback", asyncFlag );
		obj.server.get( "/auth/google/callback", passport.authenticate( "google", { failureRedirect: "/login" } ) );
		obj.server.get( "/auth/google/callback", redirect );
	}

	if ( config.auth.linkedin.enabled ) {
		passport.use( new LinkedInStrategy( {
				consumerKey: config.auth.linkedin.client_id,
				consumerSecret: config.auth.linkedin.client_secret,
				callbackURL: realm + "/auth/linkedin/callback"
			},
			( token, tokenSecret, profile, done ) => {
				config.auth.linkedin.auth( token, tokenSecret, profile, ( err, user ) => {
					if ( err ) {
						delete err.stack;
						return done( err );
					}

					done( null, user );
				} );
			} ) );

		obj.server.get( "/auth/linkedin", asyncFlag );
		obj.server.get( "/auth/linkedin", passport.authenticate( "linkedin", { "scope": config.auth.linkedin.scope || [ "r_basicprofile", "r_emailaddress" ] } ) );
		obj.server.get( "/auth/linkedin/callback", asyncFlag );
		obj.server.get( "/auth/linkedin/callback", passport.authenticate( "linkedin", { failureRedirect: "/login" } ) );
		obj.server.get( "/auth/linkedin/callback", redirect );
	}

	if ( config.auth.local.enabled ) {
		passport.use( new LocalStrategy( ( username, password, done ) => {
			config.auth.local.auth( username, password, ( err, user ) => {
				if ( err ) {
					delete err.stack;
					return done( err );
				}

				done( null, user );
			} );
		} ) );

		config.routes.post = config.routes.post || {};
		config.routes.post[ "/login" ] = ( req, res ) => {
			let final, mid;

			final = () => {
				passport.authenticate( "local" )( req, res, ( e ) => {
					if ( e ) {
						res.error( 401, "Unauthorized" );
					}
					else if ( req.cors && req.headers[ "x-requested-with" ] && req.headers[ "x-requested-with" ] === "XMLHttpRequest" ) {
						res.respond( "Success" );
					} else {
						res.redirect( config.auth.redirect );
					}
				} );
			};

			mid = () => {
				passportSession( req, res, final );
			};

			passportInit( req, res, mid );
		};
	}

	if ( config.auth.oauth2.enabled ) {
		passport.use( new OAuth2Strategy( {
			authorizationURL: config.auth.oauth2.auth_url,
			tokenURL: config.auth.oauth2.token_url,
			clientID: config.auth.oauth2.client_id,
			clientSecret: config.auth.oauth2.client_secret,
			callbackURL: realm + "/auth/oauth2/callback"
		}, ( accessToken, refreshToken, profile, done ) => {
			config.auth.oauth2.auth( accessToken, refreshToken, profile, ( err, user ) => {
				if ( err ) {
					delete err.stack;
					return done( err );
				}

				done( null, user );
			} );
		} ) );

		obj.server.get( "/auth/oauth2", asyncFlag );
		obj.server.get( "/auth/oauth2", passport.authenticate( "oauth2" ) );
		obj.server.get( "/auth/oauth2/callback", asyncFlag );
		obj.server.get( "/auth/oauth2/callback", passport.authenticate( "oauth2", { failureRedirect: "/login" } ) );
		obj.server.get( "/auth/oauth2/callback", redirect );
	}

	if ( config.auth.saml.enabled ) {
		(() => {
			let config = config.auth.saml;

			config.callbackURL = realm + "/auth/saml/callback";
			delete config.enabled;
			delete config.path;

			passport.use( new SAMLStrategy( config, ( profile, done ) => {
				config.auth.saml.auth( profile, ( err, user ) => {
					if ( err ) {
						delete err.stack;
						return done( err );
					}

					done( null, user );
				} );
			} ) );
		})();

		obj.server.get( "/auth/saml", asyncFlag );
		obj.server.get( "/auth/saml", passport.authenticate( "saml" ) );
		obj.server.get( "/auth/saml/callback", asyncFlag );
		obj.server.get( "/auth/saml/callback", passport.authenticate( "saml", { failureRedirect: "/login" } ) );
		obj.server.get( "/auth/saml/callback", redirect );
	}

	if ( config.auth.twitter.enabled ) {
		passport.use( new TwitterStrategy( {
			consumerKey: config.auth.twitter.consumer_key,
			consumerSecret: config.auth.twitter.consumer_secret,
			callbackURL: realm + "/auth/twitter/callback"
		}, ( token, tokenSecret, profile, done ) => {
			config.auth.twitter.auth( token, tokenSecret, profile, ( err, user ) => {
				if ( err ) {
					delete err.stack;
					return done( err );
				}

				done( null, user );
			} );
		} ) );

		obj.server.get( "/auth/twitter", asyncFlag );
		obj.server.get( "/auth/twitter", passport.authenticate( "twitter" ) );
		obj.server.get( "/auth/twitter/callback", asyncFlag );
		obj.server.get( "/auth/twitter/callback", passport.authenticate( "twitter", {
			successRedirect: config.auth.redirect,
			failureRedirect: "/login"
		} ) );
	}

	return config;
};
