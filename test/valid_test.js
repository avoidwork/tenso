const tinyhttptest = require("tiny-httptest"),
	tenso = require("../index"),
	routes = require("./routes.js"),
	timeout = 5000;

describe("Valid", function () {
	const port = 8021;

	this.timeout(timeout);
	this.tenso = tenso({port: port, routes: routes, etags: {enabled: true}, logging: {enabled: false}, security: {csrf: false}, static: "/sample"});

	it("GET / (200 / 'Array' - ETag capture)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/"})
			.etags()
			.expectStatus(200)
			.end();
	});

	it("HEAD / (200 / empty)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/", method: "head"})
			.expectStatus(200)
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.expectHeader("content-length", 320)
			.expectBody(/^$/)
			.end();
	});

	it("OPTIONS / (200 / empty)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/", method: "options"})
			.expectStatus(200)
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.expectHeader("content-length", 320)
			.expectValue("data", /\w/)
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET / (304 / empty - ETag reuse)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/"})
			.etags()
			.expectStatus(304)
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.expectHeader("content-length", undefined)
			.expectBody(/^$/)
			.end();
	});

	it("GET / (206 / 'Partial response - bytes=0-5')", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/", headers: {range: "bytes=0-5"}})
			.expectStatus(206)
			.expectHeader("content-range", /^bytes 0-5\/290$/)
			.expectHeader("content-length", 6)
			.expectBody(/^{"data$/)
			.end();
	});

	it("GET / (206 / 'Partial response - bytes=-5')", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/", headers: {range: "bytes=-5"}})
			.expectStatus(206)
			.expectHeader("content-range", /^bytes 286-290\/290$/)
			.expectHeader("content-length", 5)
			.expectBody(/^:200}$/)
			.end();
	});

	it("GET /null (200 / 'null')", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/null"})
			.expectStatus(200)
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.expectValue("data", null)
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET /sample (200 / redirect)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/sample"})
			.expectStatus(301)
			.expectHeader("location", "/sample/")
			.end();
	});

	it("GET /sample/ (200 / HTML)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/sample/"})
			.expectStatus(200)
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.end();
	});
});
