const path = require("path"),
	tinyhttptest = require("tiny-httptest"),
	tenso = require("../index"),
	routes = require("./routes.js"),
	timeout = 5000;

describe("Valid", function () {
	const port = 8071;

	this.timeout(timeout);
	this.tenso = tenso({port: port, http2: true, routes: routes, logging: {level: "error"}, security: {csrf: false}, ssl: {
		key: path.join(__dirname, "..", "ssl", "localhost.key"),
		cert: path.join(__dirname, "..", "ssl", "localhost.crt")
	}});

	it("GET / (200 / 'Array' - ETag capture)", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/"})
			.etags()
			.expectStatus(200)
			.end();
	});

	it("GET / (200 / 'Array' - gzip)", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/", headers: {"accept-encoding": "gzip"}})
			.expectStatus(200)
			.expectHeader("content-encoding", "gzip")
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.end();
	});

	it("GET / (200 / 'Array' - deflate)", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/", headers: {"accept-encoding": "deflate"}})
			.expectStatus(200)
			.expectHeader("content-encoding", "deflate")
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.end();
	});

	it("HEAD / (200 / empty)", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/", method: "head"})
			.expectStatus(200)
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.expectHeader("content-length", 320)
			.expectBody(/^$/)
			.end();
	});

	it("OPTIONS / (200 / empty)", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/", method: "options"})
			.expectStatus(200)
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.expectHeader("content-length", 90)
			.expectValue("data", /\w/)
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET / (304 / empty - ETag reuse)", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/"})
			.etags()
			.expectStatus(304)
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.expectHeader("content-length", undefined)
			.expectBody(/^$/)
			.end();
	});

	it("GET / (206 / 'Partial response - bytes=0-5')", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/", headers: {range: "bytes=0-5"}})
			.expectStatus(206)
			.expectHeader("content-range", /^bytes 0-5\/290$/)
			.expectHeader("content-length", undefined)
			.expectBody(/^{"data$/)
			.end();
	});

	it("GET / (206 / 'Partial response - bytes=-5')", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/", headers: {range: "bytes=-5"}})
			.expectStatus(206)
			.expectHeader("content-range", /^bytes 285-290\/290$/)
			.expectHeader("content-length", undefined)
			.expectBody(/^:200}$/)
			.end();
	});

	it("GET /null (200 / 'null')", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/null"})
			.expectStatus(200)
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.expectValue("data", null)
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});
});
