const tinyhttptest = require("tiny-httptest"),
	tenso = require("../index"),
	routes = require("./routes.js"),
	timeout = 5000;

describe("Pagination", function () {
	const port = 8002;

	this.timeout(timeout);
	this.tenso = tenso({port: port, routes: routes, logging: {enabled: false}, security: {csrf: false}});

	it("GET /empty - returns an empty array", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/empty"})
			.expectStatus(200)
			.expectValue("links", [{uri: "/", rel: "collection"}])
			.expectValue("data", [])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET /items/ - returns page 1/3 of an array of numbers", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/items/"})
			.expectStatus(200)
			.expectValue("links", [{"uri": "/", "rel": "collection"}, {
				"uri": "/items/?page=3&page_size=5",
				"rel": "last"
			}, {"uri": "/items/?page=2&page_size=5", "rel": "next"}])
			.expectValue("data", [1, 2, 3, 4, 5])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET /items - returns page 1/3 of an array of numbers", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/items"})
			.expectStatus(200)
			.expectValue("links", [{"uri": "/", "rel": "collection"}, {
				"uri": "/items?page=3&page_size=5",
				"rel": "last"
			}, {"uri": "/items?page=2&page_size=5", "rel": "next"}])
			.expectValue("data", [1, 2, 3, 4, 5])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET /items?page=a&page_size=b - returns page 1/3 of an array of numbers", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/items?page=a&page_size=b"})
			.expectStatus(200)
			.expectValue("links", [{"uri": "/", "rel": "collection"}, {
				"uri": "/items?page=3&page_size=5",
				"rel": "last"
			}, {"uri": "/items?page=2&page_size=5", "rel": "next"}])
			.expectValue("data", [1, 2, 3, 4, 5])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET /items?page=0&page_size=5 - returns page 1/3 of an array of numbers", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/items?page=0&page_size=5"})
			.expectStatus(200)
			.expectValue("links", [{"uri": "/", "rel": "collection"}, {
				"uri": "/items?page=3&page_size=5",
				"rel": "last"
			}, {"uri": "/items?page=2&page_size=5", "rel": "next"}])
			.expectValue("data", [1, 2, 3, 4, 5])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET /items?page=0&page_size=-1 - returns page 1/3 of an array of numbers", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/items?page=0&page_size=-1"})
			.expectStatus(200)
			.expectValue("links", [{"uri": "/", "rel": "collection"}, {
				"uri": "/items?page=3&page_size=5",
				"rel": "last"
			}, {"uri": "/items?page=2&page_size=5", "rel": "next"}])
			.expectValue("data", [1, 2, 3, 4, 5])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET /items?page=2&page_size=5 - returns page 2/3 of an array of numbers", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/items?page=2&page_size=5"})
			.expectStatus(200)
			.expectValue("links", [{"uri": "/", "rel": "collection"}, {
				"uri": "/items?page=1&page_size=5",
				"rel": "first"
			}, {"uri": "/items?page=3&page_size=5", "rel": "last"}])
			.expectValue("data", [6, 7, 8, 9, 10])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET /items?page=3&page_size=5 - returns page 3/3 of an array of numbers", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/items?page=3&page_size=5"})
			.expectStatus(200)
			.expectValue("links", [{"uri": "/", "rel": "collection"}, {
				"uri": "/items?page=1&page_size=5",
				"rel": "first"
			}, {"uri": "/items?page=2&page_size=5", "rel": "prev"}])
			.expectValue("data", [11, 12, 13, 14, 15])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET /items?page=4&page_size=5 - returns page 4/3 of an array of numbers (empty)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/items?page=4&page_size=5"})
			.expectStatus(200)
			.expectValue("links", [{"uri": "/", "rel": "collection"}, {
				"uri": "/items?page=1&page_size=5",
				"rel": "first"
			}, {"uri": "/items?page=3&page_size=5", "rel": "last"}])
			.expectValue("data", [])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET /items?email=user@domain.com - returns page 1/3 of an array of numbers, preserving the query string via encoding", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/items?email=user@domain.com"})
			.expectStatus(200)
			.expectValue("links", [{
				uri: "/",
				rel: "collection"
			}, {
				uri: "/items?email=user%40domain.com&page=3&page_size=5",
				rel: "last"
			}, {
				uri: "/items?email=user%40domain.com&page=2&page_size=5",
				rel: "next"
			}])
			.expectValue("data", [1, 2, 3, 4, 5])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});
});

describe("Hypermedia", function () {
	const port = 8003;

	this.timeout(timeout);
	this.tenso = tenso({port: port, routes: routes, logging: {level: "error"}, security: {csrf: false}});

	it("GET /things - returns a collection of representations that has hypermedia properties", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/things"})
			.expectStatus(200)
			.expectValue("links", [{
				uri: "/",
				rel: "collection"
			}])
			.expectValue("data", [{id: 1, name: "thing 1", user_id: 1, welcome: "<h1>blahblah</h1>"}, {
				id: 2,
				name: "thing 2",
				user_id: 1
			}, {id: 3, name: "thing 3", user_id: 2}])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET /somethings/abc - returns an entity that has hypermedia properties, and data", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/somethings/abc"})
			.expectStatus(200)
			.expectValue("links", [{"uri": "/somethings", "rel": "collection"}, {
				"uri": "/somethings/abc",
				"rel": "item"
			}, {"uri": "/users/123", "rel": "related"}])
			.expectValue("data", {
				_id: "abc",
				user_id: 123,
				title: "This is a title",
				body: "Where is my body?",
				source_url: "http://source.tld"
			})
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET /somethings/def - returns an entity that has hypermedia properties, and no data", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/somethings/def"})
			.expectStatus(200)
			.expectValue("links", [{"uri": "/somethings", "rel": "collection"}, {
				"uri": "/somethings/def",
				"rel": "item"
			}, {"uri": "/users/123", "rel": "related"}])
			.expectValue("data", {_id: "def", user_id: 123, source_url: "http://source.tld"})
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});
});

describe("Rate Limiting", function () {
	const port = 8007;

	this.timeout(timeout);
	this.tenso = tenso({
		port: port,
		routes: routes,
		logging: {level: "error"},
		security: {csrf: false},
		rate: {enabled: true, limit: 2, reset: 900}
	});

	it("GET / - returns an array of endpoints (1/2)", function () {
		return tinyhttptest({url: "http://localhost:" + port})
			.cookies()
			.expectStatus(200)
			.expectHeader("x-ratelimit-limit", "2")
			.expectHeader("x-ratelimit-remaining", "1")
			.expectValue("links", [{uri: "/empty", rel: "item"},
				{uri: "/items", rel: "item"},
				{uri: "/somethings", rel: "item"},
				{uri: "/test", rel: "item"},
				{uri: "/things", rel: "item"},
				{uri: "/?page=2&page_size=5", rel: "last"}])
			.expectValue("data", ["empty", "items", "somethings", "test", "things"])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET / - returns an array of endpoints (2/2)", function () {
		return tinyhttptest({url: "http://localhost:" + port})
			.cookies()
			.expectStatus(200)
			.expectHeader("x-ratelimit-limit", "2")
			.expectHeader("x-ratelimit-remaining", "0")
			.expectValue("links", [{uri: "/empty", rel: "item"},
				{uri: "/items", rel: "item"},
				{uri: "/somethings", rel: "item"},
				{uri: "/test", rel: "item"},
				{uri: "/things", rel: "item"},
				{uri: "/?page=2&page_size=5", rel: "last"}])
			.expectValue("data", ["empty", "items", "somethings", "test", "things"])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET / - returns a 'too many requests' error", function () {
		return tinyhttptest({url: "http://localhost:" + port})
			.cookies()
			.expectStatus(429)
			.expectValue("data", null)
			.expectValue("error", "Too Many Requests")
			.expectValue("status", 429)
			.end();
	});
});

describe("Rate Limiting (Override)", function () {
	const port = 8009;
	let i = 1;

	this.timeout(timeout);
	this.tenso = tenso({
		port: port, routes: routes, logging: {level: "error"}, security: {csrf: false}, rate: {
			enabled: true,
			limit: 2,
			reset: 900,
			override: function (req, rate) {
				if (++i > 1 && rate.limit < 100) {
					rate.limit += 100;
					rate.remaining += 100;
				}

				return rate;
			}
		}
	});

	it("GET / - returns an array of endpoints (1/2)", function () {
		return tinyhttptest({url: "http://localhost:" + port})
			.cookies()
			.expectStatus(200)
			.expectHeader("x-ratelimit-limit", "102")
			.expectHeader("x-ratelimit-remaining", "101")
			.expectValue("links", [{uri: "/empty", rel: "item"},
				{uri: "/items", rel: "item"},
				{uri: "/somethings", rel: "item"},
				{uri: "/test", rel: "item"},
				{uri: "/things", rel: "item"},
				{uri: "/?page=2&page_size=5", rel: "last"}])
			.expectValue("data", ["empty", "items", "somethings", "test", "things"])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET / - returns an array of endpoints (2/2)", function () {
		return tinyhttptest({url: "http://localhost:" + port})
			.cookies()
			.expectStatus(200)
			.expectHeader("x-ratelimit-limit", "102")
			.expectHeader("x-ratelimit-remaining", "100")
			.expectValue("links", [{uri: "/empty", rel: "item"},
				{uri: "/items", rel: "item"},
				{uri: "/somethings", rel: "item"},
				{uri: "/test", rel: "item"},
				{uri: "/things", rel: "item"},
				{uri: "/?page=2&page_size=5", rel: "last"}])
			.expectValue("data", ["empty", "items", "somethings", "test", "things"])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});
});

describe("Request body max byte size", function () {
	const port = 8008;

	this.timeout(timeout);
	this.tenso = tenso({port: port, routes: routes, logging: {level: "error"}, security: {csrf: false}, maxBytes: 10});

	it("POST /test - returns an a result", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/test", method: "post"})
			.json({"x": 1})
			.expectStatus(200)
			.expectValue("links", [{uri: "/", rel: "collection"}])
			.expectValue("data", "OK!")
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("POST /test (invalid) - returns a 'request entity too large' error", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/test", method: "post"})
			.json({"abc": true})
			.expectStatus(413)
			.expectValue("data", null)
			.expectValue("error", "Payload Too Large")
			.expectValue("status", 413)
			.end();
	});
});

describe("Route parameters", function () {
	const port = 8010;

	this.timeout(timeout);
	this.tenso = tenso({port: port, routes: routes, logging: {level: "error"}, security: {csrf: false}});

	it("GET /test/hidden - returns an a 'hidden' result", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/test/hidden"})
			.expectStatus(200)
			.expectValue("links", [{uri: "/test", rel: "collection"}])
			.expectValue("data", "hidden")
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});
});

describe("CORS", function () {
	const port = 8013;

	this.timeout(timeout);
	this.tenso = tenso({port: port, routes: routes, logging: {level: "error"}, security: {csrf: false}});

	it("OPTIONS /empty - returns an empty array", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/empty", method: "options"})
			.cors("http://not.localhost")
			.expectStatus(200)
			.end();
	});

	it("GET /empty - returns an empty array", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/empty"})
			.cors("http://not.localhost")
			.expectStatus(200)
			.end();
	});
});

describe("CORS Headers", function () {
	const port = 8015;

	this.timeout(timeout);
	this.tenso = tenso({port: port, routes: routes, logging: {level: "error"}, security: {csrf: true}});

	it("GET /test - exposes x-csrf-token header", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/test"})
			.cors("http://not.localhost")
			.expectHeader("access-control-expose-headers", /x-csrf-token/)
			.expectHeader("x-csrf-token", /\w/)
			.expectStatus(200)
			.end();
	});
});

describe("Sorting", function () {
	const port = 8014;

	this.timeout(timeout);
	this.tenso = tenso({port: port, routes: routes, logging: {level: "error"}, security: {csrf: false}});

	it("GET /things?order_by=user_id%20asc&order_by=name%20desc - returns a sorted array of objects", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/things?order_by=user_id%20asc&order_by=name%20desc"})
			.expectStatus(200)
			.expectValue("data", [
				{
					"id": 2,
					"name": "thing 2",
					"user_id": 1
				},
				{
					"id": 1,
					"name": "thing 1",
					"user_id": 1,
					"welcome": "<h1>blahblah</h1>"
				},
				{
					"id": 3,
					"name": "thing 3",
					"user_id": 2
				}
			])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET /items?order_by=asc - returns a sorted array of primitives", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/items?order_by=asc"})
			.expectStatus(200)
			.expectValue("data", [
				1,
				2,
				3,
				4,
				5
			])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET /items?order_by=desc - returns a sorted array of primitives", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/items?order_by=desc"})
			.expectStatus(200)
			.expectValue("data", [
				15,
				14,
				13,
				12,
				11
			])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});
});
