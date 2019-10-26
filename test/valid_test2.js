const path = require("path"),
	tinyhttptest = require("tiny-httptest"),
	tenso = require("../index"),
	routes = require("./routes.js"),
	timeout = 5000;

describe("Valid (HTTP2)", function () {
	const port = 8071;

	this.timeout(timeout);
	this.tenso = tenso({http2: true, port: port, routes: routes, etags: {enabled: true}, logging: {level: "error"}, security: {csrf: false}, static: "/sample(/)?", ssl: {
		key: path.join(__dirname, "..", "ssl", "localhost.key"),
		cert: path.join(__dirname, "..", "ssl", "localhost.crt")
	}});

	it("GET / (200 / 'Array' - ETag capture)", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/"})
			.etags()
			.expectStatus(200)
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
			.expectHeader("content-length", 320)
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
			.expectHeader("content-length", 6)
			.expectBody(/^{"data$/)
			.end();
	});

	it("GET / (206 / 'Partial response - bytes=-5')", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/", headers: {range: "bytes=-5"}})
			.expectStatus(206)
			.expectHeader("content-range", /^bytes 286-290\/290$/)
			.expectHeader("content-length", 5)
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

	it("GET /sample (301 / redirect)", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/sample"})
			.expectStatus(301)
			.expectHeader("location", "/sample/")
			.end();
	});

	it("GET /sample/ (200 / HTML)", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/sample/"})
			.expectStatus(200)
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.end();
	});
});
