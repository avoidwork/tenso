var hippie = require( "hippie" ),
	tenso = require( "../lib/tenso" ),
	routes = require( "./routes.js" ),
	array = require( "keigai" ).util.array,
	csrf = 'x-csrf-token';

function persistCookies ( opts, next ) {
	opts.jar = true;
	next( opts );
}

function api ( port, not_json ) {
	var obj = hippie().base( "http://localhost:" + port ).use( persistCookies );

	return not_json ? obj : obj.expectHeader( "Content-Type", "application/json" ).json();
}

function get_token ( port, fn, url ) {
	return api( port ).get( url || "/login" ).end( fn );
}

process.setMaxListeners(0);

describe( "Permissions (CSRF disabled)", function () {
	var port = 8001;

	tenso( { port: port, routes: routes, logs: { level: "error" }, security: { csrf: false } } );

	it( "GET / - returns an array of endpoints", function ( done ) {
		api( port )
			.get( "/" )
			.expectStatus( 200 )
			.expectHeader( "allow", "GET, HEAD, OPTIONS" )
			.expectValue( "data.link", [ {
				uri: "http://localhost:" + port + "/items",
				rel: "item"
			}, { uri: "http://localhost:" + port + "/things", rel: "item" } ] )
			.expectValue( "data.result", [ "/items", "/things" ] )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET /invalid - returns a 'not found' error", function ( done ) {
		api( port )
			.get( "/invalid" )
			.expectStatus( 404 )
			.expectValue( "data", null )
			.expectValue( "error", "Not Found" )
			.expectValue( "status", 404 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "DELETE / - returns a 'method not allowed' error", function ( done ) {
		api( port )
			.del( "/" )
			.expectStatus( 405 )
			.expectValue( "data", null )
			.expectValue( "error", "Method Not Allowed" )
			.expectValue( "status", 405 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "POST / - returns a 'method not allowed' error", function ( done ) {
		api( port )
			.post( "/" )
			.expectStatus( 405 )
			.expectValue( "data", null )
			.expectValue( "error", "Method Not Allowed" )
			.expectValue( "status", 405 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "PUT / - returns a 'method not allowed' error", function ( done ) {
		api( port )
			.put( "/" )
			.expectStatus( 405 )
			.expectValue( "data", null )
			.expectValue( "error", "Method Not Allowed" )
			.expectValue( "status", 405 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "PATCH / - returns a 'method not allowed' error", function ( done ) {
		api( port )
			.patch( "/" )
			.expectStatus( 405 )
			.expectValue( "data", null )
			.expectValue( "error", "Method Not Allowed" )
			.expectValue( "status", 405 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );
} );

describe( "Pagination", function () {
	var port = 8002;

	tenso( { port: port, routes: routes, logs: { level: "error" } } );

	it( "GET /empty - returns an empty array", function ( done ) {
		api( port )
			.get( "/empty" )
			.expectStatus( 200 )
			.expectValue( "data.link", [ { uri: "http://localhost:" + port, rel: "collection" } ] )
			.expectValue( "data.result", [] )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET /items/ - returns page 1/3 of an array of numbers", function ( done ) {
		api( port )
			.get( "/items/" )
			.expectStatus( 200 )
			.expectValue( "data.link", [ {
				uri: "http://localhost:" + port,
				rel: "collection"
			}, {
				uri: "http://localhost:" + port + "/items/?page=3&page_size=5",
				rel: "last"
			}, { uri: "http://localhost:" + port + "/items/?page=2&page_size=5", rel: "next" } ] )
			.expectValue( "data.result", [ 1, 2, 3, 4, 5 ] )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET /items - returns page 1/3 of an array of numbers", function ( done ) {
		api( port )
			.get( "/items" )
			.expectStatus( 200 )
			.expectValue( "data.link", [ {
				uri: "http://localhost:" + port,
				rel: "collection"
			}, {
				uri: "http://localhost:" + port + "/items?page=3&page_size=5",
				rel: "last"
			}, { uri: "http://localhost:" + port + "/items?page=2&page_size=5", rel: "next" } ] )
			.expectValue( "data.result", [ 1, 2, 3, 4, 5 ] )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET /items?page=2&page_size=5 - returns page 2/3 of an array of numbers", function ( done ) {
		api( port )
			.get( "/items?page=2&page_size=5" )
			.expectStatus( 200 )
			.expectValue( "data.link", [ {
				uri: "http://localhost:" + port,
				rel: "collection"
			}, {
				uri: "http://localhost:" + port + "/items?page=1&page_size=5",
				rel: "first"
			}, { uri: "http://localhost:" + port + "/items?page=3&page_size=5", rel: "last" } ] )
			.expectValue( "data.result", [ 6, 7, 8, 9, 10 ] )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET /items?page=3&page_size=5 - returns page 3/3 of an array of numbers", function ( done ) {
		api( port )
			.get( "/items?page=3&page_size=5" )
			.expectStatus( 200 )
			.expectValue( "data.link", [ {
				uri: "http://localhost:" + port,
				rel: "collection"
			}, {
				uri: "http://localhost:" + port + "/items?page=1&page_size=5",
				rel: "first"
			}, { uri: "http://localhost:" + port + "/items?page=2&page_size=5", rel: "prev" } ] )
			.expectValue( "data.result", [ 11, 12, 13, 14, 15 ] )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET /items?page=4&page_size=5 - returns page 4/3 of an array of numbers (empty)", function ( done ) {
		api( port )
			.get( "/items?page=4&page_size=5" )
			.expectStatus( 200 )
			.expectValue( "data.link", [ {
				uri: "http://localhost:" + port,
				rel: "collection"
			}, {
				uri: "http://localhost:" + port + "/items?page=1&page_size=5",
				rel: "first"
			}, { uri: "http://localhost:" + port + "/items?page=3&page_size=5", rel: "last" } ] )
			.expectValue( "data.result", [] )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET /items?email=user@domain.com - returns page 1/3 of an array of numbers, preserving the query string via encoding", function ( done ) {
		api( port )
			.get( "/items?email=user@domain.com" )
			.expectStatus( 200 )
			.expectValue( "data.link", [ {
				uri: "http://localhost:" + port,
				rel: "collection"
			}, {
				uri: "http://localhost:" + port + "/items?email=user%40domain.com&page=3&page_size=5",
				rel: "last"
			}, {
				uri: "http://localhost:" + port + "/items?email=user%40domain.com&page=2&page_size=5",
				rel: "next"
			} ] )
			.expectValue( "data.result", [ 1, 2, 3, 4, 5 ] )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );
} );

describe( "Hypermedia", function () {
	var port = 8003;

	tenso( { port: port, routes: routes, logs: { level: "error" } } );

	it( "GET /things - returns a collection of representations that has hypermedia properties", function ( done ) {
		api( port )
			.get( "/things" )
			.expectStatus( 200 )
			.expectValue( "data.link", [ {
				uri: "http://localhost:" + port,
				rel: "collection"
			}, {
				uri: "http://localhost:" + port + "/things/1",
				rel: "item"
			}, {
				uri: "http://localhost:" + port + "/things/2",
				rel: "item"
			}, {
				uri: "http://localhost:" + port + "/things/3",
				rel: "item"
			}, { uri: "http://localhost:" + port + "/users/1", rel: "related" },
				{ uri: "http://localhost:" + port + "/users/2", rel: "related" } ] )
			.expectValue( "data.result", [ { id: 1, name: "thing 1", user_id: 1 }, {
				id: 2,
				name: "thing 2",
				user_id: 1
			}, { id: 3, name: "thing 3", user_id: 2 } ] )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET /somethings/abc - returns an entity that has hypermedia properties, and data", function ( done ) {
		api( port )
			.get( "/somethings/abc" )
			.expectStatus( 200 )
			.expectValue( "data.link", [ {
				uri: "http://localhost:" + port + "/somethings",
				rel: "collection"
			}, { uri: "http://localhost:" + port + "/users/123", rel: "related" }, {
				uri: "http://source.tld",
				rel: "related"
			} ] )
			.expectValue( "data.result", {
				_id: "abc",
				user_id: 123,
				title: "This is a title",
				body: "Where is my body?",
				source_url: "http://source.tld"
			} )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET /somethings/def - returns an entity that has hypermedia properties, and no data", function ( done ) {
		api( port )
			.get( "/somethings/def" )
			.expectStatus( 200 )
			.expectValue( "data.link", [ {
				uri: "http://localhost:" + port + "/somethings",
				rel: "collection"
			}, { uri: "http://localhost:" + port + "/users/123", rel: "related" }, {
				uri: "http://source.tld",
				rel: "related"
			} ] )
			.expectValue( "data.result", { _id: "def", user_id: 123, source_url: "http://source.tld" } )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );
} );

describe( "Basic Auth", function () {
	var port = 8004;

	tenso( {
		port: port,
		routes: routes,
		logs: { level: "error" },
		auth: { basic: { enabled: true, list: [ "test:123" ] }, protect: [ "/uuid" ] }
	} );

	it( "GET / - returns links", function ( done ) {
		api( port )
			.get( "/" )
			.expectStatus( 200 )
			.expectValue( "data.link", [ {
				uri: "http://localhost:" + port + "/items",
				rel: "item"
			}, { uri: "http://localhost:" + port + "/things", rel: "item" } ] )
			.expectValue( "data.result", [ "/items", "/things" ] )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET /uuid - returns a uuid (authorized)", function ( done ) {
		api( port )
			.auth( 'test', '123' )
			.get( "/uuid" )
			.expectStatus( 200 )
			.expectValue( "data.link", [ { uri: "http://localhost:" + port, rel: "collection" } ] )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET /uuid - returns an 'unauthorized' error", function ( done ) {
		api( port, true )
			.get( "/uuid" )
			.expectStatus( 401 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );
} );

describe( "OAuth2 Token Bearer", function () {
	var port = 8005;

	tenso( {
		port: port,
		routes: routes,
		logs: { level: "error" },
		auth: { bearer: { enabled: true, tokens: [ "abc-123" ] }, protect: [ "/" ] }
	} );

	it( "GET / - returns an array of endpoints (authorized)", function ( done ) {
		api( port )
			.header( 'Authorization', 'Bearer abc-123' )
			.get( "/" )
			.expectStatus( 200 )
			.expectValue( "data.link", [ {
				uri: "http://localhost:" + port + "/items",
				rel: "item"
			}, { uri: "http://localhost:" + port + "/things", rel: "item" } ] )
			.expectValue( "data.result", [ "/items", "/things" ] )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET / - returns an 'unauthorized' error", function ( done ) {
		api( port, true )
			.get( "/" )
			.expectStatus( 401 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );
} );

describe( "Local", function () {
	var port = 8006;

	tenso( {
		port: port,
		routes: require( "./routes.js" ),
		logs: {
			level: "error",
			dtrace: true,
			stderr: true
		},
		auth: {
			local: {
				enabled: true,
				auth: function ( username, password, callback ) {
					if ( username === "test" && password === 123 ) {
						callback( null, { username: username, password: password } );
					}
					else {
						callback( true, null );
					}
				}
			},
			protect: [ "/uuid" ]
		}
	} );

	it( "GET /uuid (invalid) - returns an 'unauthorized' error", function ( done ) {
		api( port, true )
			.get( "/uuid" )
			.expectStatus( 302 )
			.expectHeader( "Location", "/login" )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET /login - returns an authentication message", function ( done ) {
		api( port )
			.get( "/login" )
			.expectStatus( 200 )
			.expectValue( "data.link", [ { uri: "http://localhost:" + port, rel: "collection" } ] )
			.expectValue( "data.result", { instruction: "POST 'username' & 'password' to authenticate" } )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "POST /login (invalid / no CSRF token) - returns an 'unauthorized' error", function ( done ) {
		api( port )
			.post( "/login" )
			.form()
			.send( { username: "test", password: 1232 } )
			.expectStatus( 403 )
			.expectValue( "data", null )
			.expectValue( "error", "CSRF token mismatch" )
			.expectValue( "status", 403 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "POST /login (invalid) - returns an 'unauthorized' error", function ( done ) {
		get_token( port, function ( err, res ) {
			var token;

			if ( err ) throw err;

			token = res.headers[ csrf ];

			api( port, true )
				.header( csrf, token )
				.post( "/login" )
				.form()
				.send( { username: "test", password: 1232 } )
				.json()
				.expectStatus( 401 )
				.expectValue( "data", null )
				.expectValue( "error", "Unauthorized" )
				.expectValue( "status", 401 )
				.end( function ( err ) {
					if ( err ) throw err;
					done();
				} );
		} );
	} );

	// needs to reuse the session cookie header for identification
	it( "POST /login - redirects to a predetermined URI", function ( done ) {
		get_token( port, function ( err, res ) {
			var token;

			if ( err ) throw err;

			token = res.headers[ csrf ];

			api( port, true )
				.header( csrf, token )
				.post( "/login" )
				.form()
				.send( { username: "test", password: 123 } )
				.expectStatus( 302 )
				.expectHeader( "Location", "/" )
				.end( function ( err ) {
					if ( err ) throw err;
					done();
				} );
		} );
	} );

	it( "GET /uuid (session) - returns a version 4 uuid", function ( done ) {
		api( port )
			.get( "/uuid" )
			.expectStatus( 200 )
			.expectValue( "data.link", [ { uri: "http://localhost:" + port, rel: "collection" } ] )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );
} );

describe( "Rate Limiting", function () {
	var port = 8007;

	tenso( { port: port, routes: routes, logs: { level: "error" }, rate: { enabled: true, limit: 2, reset: 900 } } );

	it( "GET / - returns an array of endpoints (1/2)", function ( done ) {
		console
		api( port )
			.get( "/" )
			.expectStatus( 200 )
			.expectHeader( "x-ratelimit-limit", "2" )
			.expectHeader( "x-ratelimit-remaining", "1" )
			.expectValue( "data.link", [ {
				uri: "http://localhost:" + port + "/items",
				rel: "item"
			}, { uri: "http://localhost:" + port + "/things", rel: "item" } ] )
			.expectValue( "data.result", [ "/items", "/things" ] )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET / - returns an array of endpoints (2/2)", function ( done ) {
		api( port )
			.get( "/" )
			.expectStatus( 200 )
			.expectHeader( "x-ratelimit-limit", "2" )
			.expectHeader( "x-ratelimit-remaining", "0" )
			.expectValue( "data.link", [ {
				uri: "http://localhost:" + port + "/items",
				rel: "item"
			}, { uri: "http://localhost:" + port + "/things", rel: "item" } ] )
			.expectValue( "data.result", [ "/items", "/things" ] )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET / - returns a 'too many requests' error", function ( done ) {
		api( port )
			.get( "/" )
			.expectStatus( 429 )
			.expectValue( "data", null )
			.expectValue( "error", "Too many requests" )
			.expectValue( "status", 429 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );
} );

describe( "Rate Limiting (Override)", function () {
	var port = 8009,
		i = 1;

	tenso( {
		port: port,
		routes: routes,
		logs: {
			level: "error"
		},
		rate: {
			enabled: true,
			limit: 2,
			reset: 900,
			override: function ( req, rate ) {
				if ( ++i > 1 && rate.limit < 100 ) {
					rate.limit += 100;
					rate.remaining += 100;
				}

				return rate;
			}
		}
	} );

	it( "GET / - returns an array of endpoints (1/2)", function ( done ) {
		api( port )
			.get( "/" )
			.expectStatus( 200 )
			.expectHeader( "x-ratelimit-limit", "102" )
			.expectHeader( "x-ratelimit-remaining", "101" )
			.expectValue( "data.link", [ {
				uri: "http://localhost:" + port + "/items",
				rel: "item"
			}, { uri: "http://localhost:" + port + "/things", rel: "item" } ] )
			.expectValue( "data.result", [ "/items", "/things" ] )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET / - returns an array of endpoints (2/2)", function ( done ) {
		api( port )
			.get( "/" )
			.expectStatus( 200 )
			.expectHeader( "x-ratelimit-limit", "102" )
			.expectHeader( "x-ratelimit-remaining", "100" )
			.expectValue( "data.link", [ {
				uri: "http://localhost:" + port + "/items",
				rel: "item"
			}, { uri: "http://localhost:" + port + "/things", rel: "item" } ] )
			.expectValue( "data.result", [ "/items", "/things" ] )
			.expectValue( "error", null )
			.expectValue( "status", 200 )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );
} );

describe( "Request body max byte size", function () {
	var port = 8008;

	tenso( { port: port, routes: routes, logs: { level: "error" }, maxBytes: 10 } );

	it( "POST /test - returns an a result", function ( done ) {
		get_token( port, function ( err, res ) {
			var token;

			if ( err ) throw err;

			token = res.headers[ csrf ];

			api( port )
				.post( "/test" )
				.send( { "x": 1 } )
				.header( csrf, token )
				.expectStatus( 200 )
				.expectValue( "data.link", [ { uri: "http://localhost:" + port, rel: "collection" } ] )
				.expectValue( "data.result", "OK!" )
				.expectValue( "error", null )
				.expectValue( "status", 200 )
				.end( function ( err ) {
					if ( err ) throw err;
					done();
				} );
		}, "/test" );
	} );

	it( "POST /test (invalid) - returns a 'request entity too large' error", function ( done ) {
		get_token( port, function ( err, res ) {
			var token;

			if ( err ) throw err;

			token = res.headers[ csrf ];

			api( port )
				.post( "/test" )
				.send( { "abc": true } )
				.header( csrf, token )
				.expectStatus( 413 )
				.expectValue( "data", null )
				.expectValue( "error", "Request Entity Too Large" )
				.expectValue( "status", 413 )
				.end( function ( err ) {
					if ( err ) throw err;
					done();
				} );
		}, "/test" );
	} );
} );

describe( "Renderers", function () {
	var port = 8010, server;

	server = tenso( { port: port, routes: routes, logs: { level: "error" } } );
	server.renderer( "custom", function ( arg ) { return arg; }, "application/json");

	it( "GET CSV (header)", function ( done ) {
		api( port, true )
			.get( "/" )
			.header( "accept", "text/csv" )
			.expectStatus( 200 )
			.expectHeader( "Content-Type", "text/csv" )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET CSV (query string)", function ( done ) {
		api( port, true )
			.get( "/?format=csv" )
			.expectStatus( 200 )
			.expectHeader( "Content-Type", "text/csv" )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET HTML (header)", function ( done ) {
		api( port, true )
			.get( "/" )
			.header( "accept", "text/html" )
			.expectStatus( 200 )
			.expectHeader( "Content-Type", "text/html" )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET HTML (query string)", function ( done ) {
		api( port, true )
			.get( "/?format=html" )
			.expectStatus( 200 )
			.expectHeader( "Content-Type", "text/html" )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET YAML (header)", function ( done ) {
		api( port, true )
			.get( "/" )
			.header( "accept", "application/yaml" )
			.expectStatus( 200 )
			.expectHeader( "Content-Type", "application/yaml" )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET YAML (query string)", function ( done ) {
		api( port, true )
			.get( "/?format=yaml" )
			.expectStatus( 200 )
			.expectHeader( "Content-Type", "application/yaml" )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET XML (header)", function ( done ) {
		api( port, true )
			.get( "/" )
			.header( "accept", "application/xml" )
			.expectStatus( 200 )
			.expectHeader( "Content-Type", "application/xml" )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET XML (query string)", function ( done ) {
		api( port, true )
			.get( "/?format=xml" )
			.expectStatus( 200 )
			.expectHeader( "Content-Type", "application/xml" )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET Custom (header)", function ( done ) {
		api( port, true )
			.get( "/" )
			.header( "accept", "application/custom" )
			.expectStatus( 200 )
			.expectHeader( "Content-Type", "application/json" )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );

	it( "GET Custom (query string)", function ( done ) {
		api( port, true )
			.get( "/?format=custom" )
			.expectStatus( 200 )
			.expectHeader( "Content-Type", "application/json" )
			.end( function ( err ) {
				if ( err ) throw err;
				done();
			} );
	} );
} );