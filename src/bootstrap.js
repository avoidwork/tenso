/**
 * Bootstraps an instance of Tenso
 *
 * @method bootstrap
 * @param  {Object} obj    Tenso instance
 * @param  {Object} config Application configuration
 * @return {Object}        Tenso instance
 */
let bootstrap = ( obj, config ) => {
	let notify = false;

	let mediator = ( req, res, next ) => {
		res.error = ( status, body ) => {
			return obj.error( req, res, status, body );
		};

		res.redirect = ( uri ) => {
			return obj.redirect( req, res, uri );
		};

		res.respond = ( body, status, headers ) => {
			return obj.respond( req, res, body, status, headers );
		};

		next();
	}


	let parse = ( req, res, next ) => {
		let args, type;

		if ( REGEX.body.test( req.method ) && req.body !== undefined ) {
			type = req.headers[ "content-type" ];

			if ( REGEX.encode_form.test( type ) ) {
				args = req.body ? array.chunk( req.body.split( REGEX.body_split ), 2 ) : [];
				req.body = {};

				array.iterate( args, ( i ) => {
					req.body[ i[ 0 ] ] = coerce( i[ 1 ] );
				} );
			}

			if ( REGEX.encode_json.test( type ) ) {
				req.body = json.decode( req.body, true );
			}
		}

		next();
	}

	obj.server.use( mediator ).blacklist( mediator );
	obj.server.use( parse ).blacklist( parse );

	// Bootstrapping configuration
	config = auth( obj, config );
	config.headers = config.headers || {};
	config.headers.server = SERVER;

	// Creating status > message map
	iterate( obj.server.codes, ( value, key ) => {
		obj.messages[ value ] = obj.server.messages[ key ];
	} );

	// Setting routes
	if ( config.routes instanceof Object ) {
		iterate( config.routes, ( routes, method ) => {
			iterate( routes, ( arg, route ) => {
				if ( typeof arg === "function" ) {
					obj.server[ method ]( route, (...args) => {
						arg.apply( obj, args );
					} );
				} else {
					obj.server[ method ]( route, ( req, res ) => {
						obj.respond( req, res, arg );
					} );
				}
			} );
		} );
	}

	// Disabling compression over SSL due to BREACH
	if ( config.ssl.cert && config.ssl.key ) {
		config.compress = false;
		notify = true;
	}

	// Starting API server
	obj.server.start( config, ( req, res, status, msg ) => {
		var err = msg instanceof Error ? msg : new Error( msg || obj.messages[ status ] );

		error( obj, req, res, status, err, obj );
	} );

	if ( notify ) {
		obj.server.log( "Compression over SSL is disabled for your protection", "debug" );
	}

	return obj;
};
