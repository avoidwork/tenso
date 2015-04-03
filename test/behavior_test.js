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

describe( "Pagination", function () {
	var port = 8002;

	tenso( { port: port, routes: routes, logs: { level: "error" } } );

	this.timeout(5000);

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

	this.timeout(5000);

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

describe( "Rate Limiting", function () {
	var port = 8007;

	tenso( { port: port, routes: routes, logs: { level: "error" }, rate: { enabled: true, limit: 2, reset: 900 } } );

	this.timeout(5000);

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

	this.timeout(5000);

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

	this.timeout(5000);

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
