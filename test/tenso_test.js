var expect = require('chai').expect,
    hippie = require( "hippie" ),
    tenso  = require( "../lib/tenso" ),
    routes = require( "./routes.js" );

function api ( port, not_json ) {
	var obj = hippie().base("http://localhost:" + port)

	return not_json ? obj : obj.expectHeader("Content-Type", "application/json").json();
}

describe("Permissions", function () {
	var port = 8001;

	tenso( {port: port, routes: routes, logs: {level: "error"}} );

	describe("GET /", function () {
		it("returns an array of endpoints", function (done) {
			api( port )
				.get("/")
				.expectStatus(200)
				.expectValue("data.link", [])
				.expectValue("data.result", ["/items"])
				.expectValue("error", null)
				.expectValue("status", 200)
				.end(function(err) {
					if (err) throw err;
					done();
				});
		});
	});

	describe("GET /invalid", function () {
		it("returns a 'not found' error", function (done) {
			api( port )
				.get("/invalid")
				.expectStatus(404)
				.expectValue("data", null)
				.expectValue("error", "Not Found")
				.expectValue("status", 404)
				.end(function(err) {
					if (err) throw err;
					done();
				});
		});
	});

	describe("DELETE /", function () {
		it("returns a 'method not allowed' error", function (done) {
			api( port )
				.del("/")
				.expectStatus(405)
				.expectValue("data", null)
				.expectValue("error", "Method Not Allowed")
				.expectValue("status", 405)
				.end(function(err) {
					if (err) throw err;
					done();
				});
		});
	});

	describe("POST /", function () {
		it("returns a 'method not allowed' error", function (done) {
			api( port )
				.post("/")
				.expectStatus(405)
				.expectValue("data", null)
				.expectValue("error", "Method Not Allowed")
				.expectValue("status", 405)
				.end(function(err) {
					if (err) throw err;
					done();
				});
		});
	});

	describe("PUT /", function () {
		it("returns a 'method not allowed' error", function (done) {
			api( port )
				.put("/")
				.expectStatus(405)
				.expectValue("data", null)
				.expectValue("error", "Method Not Allowed")
				.expectValue("status", 405)
				.end(function(err) {
					if (err) throw err;
					done();
				});
		});
	});

	describe("PATCH /", function () {
		it("returns a 'method not allowed' error", function (done) {
			api( port )
				.patch("/")
				.expectStatus(405)
				.expectValue("data", null)
				.expectValue("error", "Method Not Allowed")
				.expectValue("status", 405)
				.end(function(err) {
					if (err) throw err;
					done();
				});
		});
	});
});

describe("Pagination", function () {
	var port = 8002;

	tenso( {port: port, routes: routes, logs: {level: "error"}} );

	describe("GET /empty", function () {
		it("returns an empty array", function (done) {
			api( port )
				.get("/empty")
				.expectStatus(200)
				.expectValue("data.link", [])
				.expectValue("data.result", [])
				.expectValue("error", null)
				.expectValue("status", 200)
				.end(function(err) {
					if (err) throw err;
					done();
				});
		});
	});

	describe("GET /items", function () {
		it("returns page 1/3 of an array of numbers", function (done) {
			api( port )
				.get("/items")
				.expectStatus(200)
				.expectValue("data.link", [{ uri: "http://localhost:" + port + "/items?page=2&page_size=5", rel: "next" }, { uri: "http://localhost:" + port + "/items?page=3&page_size=5", rel: "last" }])
				.expectValue("data.result", [1,2,3,4,5])
				.expectValue("error", null)
				.expectValue("status", 200)
				.end(function(err) {
					if (err) throw err;
					done();
				});
		});
	});

	describe("GET /items?page=2&page_size=5", function () {
		it("returns page 2/3 of an array of numbers", function (done) {
			api( port )
				.get("/items?page=2&page_size=5")
				.expectStatus(200)
				.expectValue("data.link", [{ uri: "http://localhost:" + port + "/items?page=1&page_size=5", rel: "first" }, { uri: "http://localhost:" + port + "/items?page=3&page_size=5", rel: "last" }])
				.expectValue("data.result", [6,7,8,9,10])
				.expectValue("error", null)
				.expectValue("status", 200)
				.end(function(err) {
					if (err) throw err;
					done();
				});
		});
	});

	describe("GET /items?page=3&page_size=5", function () {
		it("returns page 3/3 of an array of numbers", function (done) {
			api( port )
				.get("/items?page=3&page_size=5")
				.expectStatus(200)
				.expectValue("data.link", [{ uri: "http://localhost:" + port + "/items?page=1&page_size=5", rel: "first" }, { uri: "http://localhost:" + port + "/items?page=2&page_size=5", rel: "prev" }])
				.expectValue("data.result", [11,12,13,14,15])
				.expectValue("error", null)
				.expectValue("status", 200)
				.end(function(err) {
					if (err) throw err;
					done();
				});
		});
	});

	describe("GET /items?page=4&page_size=5", function () {
		it("returns page 4/3 of an array of numbers (empty)", function (done) {
			api( port )
				.get("/items?page=4&page_size=5")
				.expectStatus(200)
				.expectValue("data.link", [{ uri: "http://localhost:" + port + "/items?page=1&page_size=5", rel: "first" }, { uri: "http://localhost:" + port + "/items?page=3&page_size=5", rel: "last" }])
				.expectValue("data.result", [])
				.expectValue("error", null)
				.expectValue("status", 200)
				.end(function(err) {
					if (err) throw err;
					done();
				});
		});
	});

	describe("GET /items?email=user@domain.com", function () {
		it("returns page 1/3 of an array of numbers, preserving the query string via encoding", function (done) {
			api( port )
				.get("/items?email=user@domain.com")
				.expectStatus(200)
				.expectValue("data.link", [{ uri: "http://localhost:" + port + "/items?email=user%40domain.com&page=2&page_size=5", rel: "next" }, { uri: "http://localhost:" + port + "/items?email=user%40domain.com&page=3&page_size=5", rel: "last" }])
				.expectValue("data.result", [1,2,3,4,5])
				.expectValue("error", null)
				.expectValue("status", 200)
				.end(function(err) {
					if (err) throw err;
					done();
				});
		});
	});
});

describe("Hypermedia", function () {
	var port = 8003;

	tenso( {port: port, routes: routes, logs: {level: "error"}} );

	describe("GET /something", function () {
		it("returns an entity that has hypermedia properties", function (done) {
			api( port )
				.get("/something")
				.expectStatus(200)
				.expectValue("data.link", [{ uri: "http://localhost:" + port + "/users/123", rel: "related" }, { uri: "http://source.tld", rel: "related" }])
				.expectValue("data.result", {"title": "This is a title", "body": "Where is my body?"})
				.expectValue("error", null)
				.expectValue("status", 200)
				.end(function(err) {
					if (err) throw err;
					done();
				});
		});
	});
});

describe("Basic Auth", function () {
	var port = 8004;

	tenso( {port: port, routes: routes, logs: {level: "error"}, auth: {basic: {enabled: true, list:["test:123"]}}} );

	describe( "GET /", function () {
		it( "returns an array of endpoints (authorized)", function ( done ) {
			api( port )
				.auth('test', '123')
				.get( "/" )
				.expectStatus( 200 )
				.expectValue( "data.link", [] )
				.expectValue( "data.result", ["/items"] )
				.expectValue( "error", null )
				.expectValue( "status", 200 )
				.end( function ( err ) {
					if ( err ) throw err;
					done();
				} );
		} );
	} );

	describe( "GET /", function () {
		it( "returns an 'unauthorized' error", function ( done ) {
			api( port, true )
				.get( "/" )
				.expectStatus( 401 )
				.end( function ( err ) {
					if ( err ) throw err;
					done();
				} );
		} );
	} );
});

describe("OAuth2 Token Bearer", function () {
	var port = 8005;

	tenso( {port: port, routes: routes, logs: {level: "error"}, auth: {bearer: {enabled: true, tokens:["abc-123"]}}} );

	describe( "GET /", function () {
		it( "returns an array of endpoints (authorized)", function ( done ) {
			api( port )
				.header('Authorization', 'Bearer abc-123')
				.get( "/" )
				.expectStatus( 200 )
				.expectValue( "data.link", [] )
				.expectValue( "data.result", ["/items"] )
				.expectValue( "error", null )
				.expectValue( "status", 200 )
				.end( function ( err ) {
					if ( err ) throw err;
					done();
				} );
		} );
	} );

	describe( "GET /", function () {
		it( "returns an 'unauthorized' error", function ( done ) {
			api( port, true )
				.get( "/" )
				.expectStatus( 401 )
				.end( function ( err ) {
					if ( err ) throw err;
					done();
				} );
		} );
	} );
});
