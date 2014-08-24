var expect = require('chai').expect,
    hippie = require( "hippie" ),
    tenso  = require( "../lib/tenso" ),
    routes = require( "./routes.js" ),
    array  = require( "keigai" ).util.array;

function api ( port, not_json ) {
	var obj = hippie().base("http://localhost:" + port)

	return not_json ? obj : obj.expectHeader("Content-Type", "application/json").json();
}

function persistCookies ( opts, next ) {
	opts.jar = true;
	next( opts );
}

describe("Permissions", function () {
	var port = 8001;

	tenso( {port: port, routes: routes, logs: {level: "error"}} );

	describe("GET /", function () {
		it("returns an array of endpoints", function (done) {
			api( port )
				.get( "/" )
				.expectStatus( 200 )
				.expectHeader( "allow", "GET, HEAD, OPTIONS" )
				.expectValue( "data.link", [{uri:'http://localhost:8001/items', rel:'related'}] )
				.expectValue( "data.result", null )
				.expectValue( "error", null )
				.expectValue( "status", 200 )
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

	describe("GET /somethings/abc", function () {
		it("returns an entity that has hypermedia properties, and data", function (done) {
			api( port )
				.get("/somethings/abc")
				.expectStatus(200)
				.expectValue("data.link", [{ uri: "http://localhost:" + port + "/somethings", rel: "collection" }, { uri: "http://localhost:" + port + "/users/123", rel: "related" }, { uri: "http://source.tld", rel: "related" }])
				.expectValue("data.result", {"something_id": "abc", "title": "This is a title", "body": "Where is my body?"})
				.expectValue("error", null)
				.expectValue("status", 200)
				.end(function(err) {
					if (err) throw err;
					done();
				});
		});
	});

	describe("GET /somethings/def", function () {
		it("returns an entity that has hypermedia properties, and no data", function (done) {
			api( port )
				.get("/somethings/def")
				.expectStatus(200)
				.expectValue("data.link", [{ uri: "http://localhost:" + port + "/somethings", rel: "collection" }, { uri: "http://localhost:" + port + "/users/123", rel: "related" }, { uri: "http://source.tld", rel: "related" }])
				.expectValue("data.result", null)
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

	tenso( {port: port, routes: routes, logs: {level: "error"}, auth: {basic: {enabled: true, list:["test:123"], protect: ["/"]}}} );

	describe( "GET /", function () {
		it( "returns an array of endpoints (authorized)", function ( done ) {
			api( port )
				.auth('test', '123')
				.get( "/" )
				.expectStatus( 200 )
				.expectValue( "data.link", [{uri:'http://localhost:8004/items', rel:'related'}] )
				.expectValue( "data.result", null )
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

	tenso( {port: port, routes: routes, logs: {level: "error"}, auth: {bearer: {enabled: true, tokens:["abc-123"], protect:["/"]}}} );

	describe( "GET /", function () {
		it( "returns an array of endpoints (authorized)", function ( done ) {
			api( port )
				.header('Authorization', 'Bearer abc-123')
				.get( "/" )
				.expectStatus( 200 )
				.expectValue( "data.link", [{uri:'http://localhost:8005/items', rel:'related'}] )
				.expectValue( "data.result", null )
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

describe("Local", function () {
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
				auth: function ( req, res ) {
					var args = req.body ? array.chunk( req.body.split( /&|=/ ), 2 ) : [];
					if ( !req.session.authorized ) {
						if ( args.length > 0 && args[0][1] == "test" && args[1][1] == "123" ) {
							req.session.authorized = true;
						}
						else {
							req.session.authorized = false;
						}

						req.session.save();
					}

					if ( req.session.authorized ) {
						res.redirect( "/uuid" );
					}
					else {
						res.error( 401, "Unauthorized" );
					}
				},
				middleware: function( req, res, next ) {
					if ( req.url !== "/login" ) {
						if ( req.session.authorized ) {
							next();
						}
						else {
							res.error( 401, "Unauthorized" );
						}
					}
				},
				protect: ["/uuid"]
			},
			session: {}
		}
	} );

	describe("GET /uuid (invalid)", function () {
		it("returns an 'unauthorized' error", function (done) {
			api( port )
				.get("/uuid")
				.expectStatus(401)
				.expectValue("data", null)
				.expectValue("error", "Unauthorized")
				.expectValue("status", 401)
				.end(function(err) {
					if (err) throw err;
					done();
				});
		});
	});

	describe("GET /login", function () {
		it("returns an authentication message", function (done) {
			api( port )
				.get("/login")
				.expectStatus(200)
				.expectValue("data.link", [])
				.expectValue("data.result", "POST credentials to authenticate")
				.expectValue("error", null)
				.expectValue("status", 200)
				.end(function(err) {
					if (err) throw err;
					done();
				});
		});
	});

	describe("POST /login (invalid)", function () {
		it("returns an 'unauthorized' error", function (done) {
			api( port )
				.post("/login")
				.form()
				.send({username:"test", password:1232})
				.expectStatus(401)
				.expectValue("data", null)
				.expectValue("error", "Unauthorized")
				.expectValue("status", 401)
				.end(function(err) {
					if (err) throw err;
					done();
				});
		});
	});

	describe("POST /login", function () {
		it("redirects to a predetermined URI", function (done) {
			api( port, true )
				.post("/login")
				.form()
				.send({username:"test", password:123})
				.expectStatus(302)
				.expectHeader("Location", "/uuid")
				.use(persistCookies)
				.end(function(err) {
					if (err) throw err;
					done();
				});
		});
	});

	describe("GET /uuid (session)", function () {
		it("returns a version 4 uuid", function (done) {
			api( port )
				.get("/uuid")
				.expectStatus(200)
				.expectValue("data.link", [])
				.expectValue("error", null)
				.expectValue("status", 200)
				.use(persistCookies)
				.end(function(err) {
					if (err) throw err;
					done();
				});
		});
	});
});

describe("Rate Limiting", function () {
	var port = 8007;

	tenso( {port: port, routes: routes, logs: {level: "error"}, rate: {enabled: true, limit: 2, reset: 900}} );

	describe( "GET /", function () {
		it( "returns an array of endpoints (1/2)", function ( done ) {
			api( port )
				.get( "/" )
				.expectStatus( 200 )
				.expectHeader( "x-ratelimit-limit", "2" )
				.expectHeader( "x-ratelimit-remaining", "1" )
				.expectValue( "data.link", [{uri:'http://localhost:8007/items', rel:'related'}] )
				.expectValue( "data.result", null )
				.expectValue( "error", null )
				.expectValue( "status", 200 )
				.end( function ( err ) {
					if ( err ) throw err;
					done();
				} );
		} );
	} );

	describe( "GET /", function () {
		it( "returns an array of endpoints (2/2)", function ( done ) {
			api( port )
				.get( "/" )
				.expectStatus( 200 )
				.expectHeader( "x-ratelimit-limit", "2" )
				.expectHeader( "x-ratelimit-remaining", "0" )
				.expectValue( "data.link", [{uri:'http://localhost:8007/items', rel:'related'}] )
				.expectValue( "data.result", null )
				.expectValue( "error", null )
				.expectValue( "status", 200 )
				.end( function ( err ) {
					if ( err ) throw err;
					done();
				} );
		} );
	} );

	describe( "GET /", function () {
		it( "returns a 'too many requests' error", function ( done ) {
			api( port )
				.get( "/" )
				.expectStatus( 429 )
				.expectValue("data", null)
				.expectValue("error", "Too many requests")
				.expectValue("status", 429)
				.end( function ( err ) {
					if ( err ) throw err;
					done();
				} );
		} );
	} );
});


describe("Request body max byte size", function () {
	var port = 8008;

	tenso( {port: port, routes: routes, logs: {level: "error"}, maxBytes: 2} );

	describe( "POST /test", function () {
		it( "returns an a result", function ( done ) {
			api( port )
				.post( "/test" )
				.expectStatus( 200 )
				.expectValue( "data.link", [] )
				.expectValue( "data.result", "OK!" )
				.expectValue( "error", null )
				.expectValue( "status", 200 )
				.end( function ( err ) {
					if ( err ) throw err;
					done();
				} );
		} );
	} );

	describe( "POST /test (invalid)", function () {
		it( "returns a 'request entity too large' error", function ( done ) {
			api( port )
				.post( "/test" )
				.send({"abc": true})
				.expectStatus(413)
				.expectValue("data", null)
				.expectValue("error", "Request Entity Too Large")
				.expectValue("status", 413)
				.end( function ( err ) {
					if ( err ) throw err;
					done();
				} );
		} );
	} );
})