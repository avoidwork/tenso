var expect = require('chai').expect,
    hippie = require( "hippie" ),
    tenso  = require( "../lib/tenso" ),
    routes = require( "./routes.js" ),
    app    = tenso( {routes: routes, logs: {level: "error"}} );

function api () {
	return hippie()
		.json()
		.base("http://localhost:8000")
		.expectHeader("Content-Type", "application/json");
}

describe("Permissions", function () {
	describe("GET /", function () {
		it("returns an array of endpoints", function (done) {
			api()
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
			api()
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
			api()
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
			api()
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
			api()
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
			api()
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
	describe("GET /items", function () {
		it("returns page 1/3 of an array of numbers", function (done) {
			api()
				.get("/items")
				.expectStatus(200)
				.expectValue("data.link", [{ uri: "http://localhost:8000/items?page=2&page_size=5", rel: "next" }, { uri: "http://localhost:8000/items?page=3&page_size=5", rel: "last" }])
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
			api()
				.get("/items?page=2&page_size=5")
				.expectStatus(200)
				.expectValue("data.link", [{ uri: "http://localhost:8000/items?page=1&page_size=5", rel: "first" }, { uri: "http://localhost:8000/items?page=3&page_size=5", rel: "last" }])
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
			api()
				.get("/items?page=3&page_size=5")
				.expectStatus(200)
				.expectValue("data.link", [{ uri: "http://localhost:8000/items?page=1&page_size=5", rel: "first" }, { uri: "http://localhost:8000/items?page=2&page_size=5", rel: "prev" }])
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
			api()
				.get("/items?page=4&page_size=5")
				.expectStatus(200)
				.expectValue("data.link", [{ uri: "http://localhost:8000/items?page=1&page_size=5", rel: "first" }, { uri: "http://localhost:8000/items?page=3&page_size=5", rel: "last" }])
				.expectValue("data.result", [])
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
	describe("GET /something", function () {
		it("returns an entity that has hypermedia properties", function (done) {
			api()
				.get("/something")
				.expectStatus(200)
				.expectValue("data.link", [{ uri: "http://localhost:8000/users/123", rel: "related" }, { uri: "http://source.tld", rel: "related" }])
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
