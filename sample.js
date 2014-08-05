var tenso = require( "./lib/tenso" ),
	array = require( "keigai" ).util.array;

tenso( {
	routes: require( "./routes.js" ),
	logs: {
		level: "debug",
		dtrace: true
	},
	auth: {
		protect: ["/uuid"],
		basic: {
			enabled: false,
			list:["test:123"] // "username:password"
		},
		bearer: {
			enabled: false,
			tokens:["test-123"]
		},
		local: {
			enabled: true,
			auth: function ( req, res ) {
				var args = array.chunk( req.body.split( /&|=/ ), 2 );

				req.session = req.session || {};

				if ( !req.session.authorized ) {
					if ( args[0][1] == "test" && args[1][1] == "123" ) {
						req.session.authorized = true;
					}
					else {
						req.session.authorized = false;
					}
				}

				this.redirect( req, res, "/uuid" );
			},
			middleware: function( req, res, next ) {
				if ( req.session.authorized ) {
					next();
				}
				else {
					res.redirect( "/login" );
				}
			},
			login: "/login"
		}
	}
} );
