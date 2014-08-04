var tenso  = require( "./lib/tenso" );

tenso( {
	routes: require( "./routes.js" ),
	logs: {
		level: "debug",
		dtrace: true
	},
	auth: {
		basic: {
			enabled: false,
			list:["test:123"] // "username:password"
		},
		bearer: {
			enabled: false,
			tokens:["test-123"]
		}
	}
} );
