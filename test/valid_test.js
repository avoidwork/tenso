const tinyhttptest = require("tiny-httptest"),
	tenso = require("../index"),
	routes = require("./routes.js"),
	timeout = 5000;

describe("Valid", function () {
	const port = 8021;

	this.timeout(timeout);
	this.tenso = tenso({port: port, routes: routes, logging: {level: "error"}, security: {csrf: false}});

	it("GET / (200 / 'Array' - gzip)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/", headers: {"accept-encoding": "gzip"}})
			.expectStatus(200)
			.expectHeader("content-encoding", "gzip")
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.end();
	});

	it("GET / (200 / 'Array' - deflate)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/", headers: {"accept-encoding": "deflate"}})
			.expectStatus(200)
			.expectHeader("content-encoding", "deflate")
			.expectHeader("allow", "GET, HEAD, OPTIONS")
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
			.expectHeader("content-length", 48)
			.expectBody(/^$/)
			.end();
	});

	it("GET / (304 / empty)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/"})
			.etags()
			.expectStatus(304)
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.expectHeader("content-length", undefined)
			.expectBody(/^$/)
			.end();
	});

	it("GET / (206 / 'Partial response - 0 offset - bytes')", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/", headers: {range: "bytes=0-5"}})
			.expectStatus(206)
			.expectHeader("content-range", /^bytes 0-5\/5(3|8)$/)
			.expectHeader("content-length", undefined)
			.expectBody(/^\<html>$/)
			.end();
	});

	it("GET / (206 / 'Partial response - 0 offset')", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/", headers: {range: "0-5"}})
			.expectStatus(206)
			.expectHeader("content-range", /^bytes 0-5\/5(3|8)$/)
			.expectHeader("content-length", undefined)
			.expectBody(/^\<html>$/)
			.end();
	});

	it("GET / (206 / 'Partial response - offset')", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/", headers: {range: "2-4"}})
			.expectStatus(206)
			.expectHeader("content-range", /^bytes 2-4\/5(3|8)$/)
			.expectHeader("content-length", undefined)
			.expectBody(/^tml$/)
			.end();
	});
});
