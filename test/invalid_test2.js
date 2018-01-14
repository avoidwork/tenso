const path = require("path"),
	tinyhttptest = require("tiny-httptest"),
	tenso = require("../index"),
	routes = require("./routes.js"),
	http = require("http"),
	timeout = 5000;

describe("Invalid", function () {
	const port = 8060;

	this.timeout(timeout);
	this.tenso = tenso({port: port, http2: true, routes: routes, logging: {level: "error"}, security: {csrf: false}, ssl: {
		key: path.join(__dirname, "..", "ssl", "localhost.key"),
		cert: path.join(__dirname, "..", "ssl", "localhost.crt")
	}});

	it("GET / (416 / 'Partial response - invalid')", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/", headers: {range: "a-b"}})
			.expectStatus(416)
			.expectValue("error", http.STATUS_CODES[416])
			.end();
	});

	it("GET / (416 / 'Partial response - invalid #2')", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/", headers: {range: "5-0"}})
			.expectStatus(416)
			.expectValue("error", http.STATUS_CODES[416])
			.end();
	});

	it("POST / (405 / 'Method Not Allowed')", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/", method: "post"})
			.expectStatus(405)
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.expectValue("error", http.STATUS_CODES[405])
			.end();
	});

	it("PUT / (405 / 'Method Not Allowed')", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/", method: "put"})
			.expectStatus(405)
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.expectValue("error", http.STATUS_CODES[405])
			.end();
	});

	it("PATCH / (405 / 'Method Not Allowed')", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/", method: "patch"})
			.expectStatus(405)
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.expectValue("error", http.STATUS_CODES[405])
			.end();
	});

	it("DELETE / (405 / 'Method Not Allowed')", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/", method: "delete"})
			.expectStatus(405)
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.expectValue("error", http.STATUS_CODES[405])
			.end();
	});

	it("GET /nothere.html (404 / 'Not Found')", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/nothere.html"})
			.expectStatus(404)
			.expectHeader("allow", undefined)
			.expectValue("error", http.STATUS_CODES[404])
			.end();
	});

	it("GET /nothere.html%3fa=b?=c (404 / 'Not Found')", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/nothere.html%3fa=b?=c"})
			.expectStatus(404)
			.expectHeader("allow", undefined)
			.expectValue("error", http.STATUS_CODES[404])
			.end();
	});

	it("GET /nothere.x_%22%3E%3Cimg%20src=x%20onerror=prompt(1)%3E.html (404 / 'Not Found')", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/nothere.x_%22%3E%3Cimg%20src=x%20onerror=prompt(1)%3E.html"})
			.expectStatus(404)
			.expectHeader("allow", undefined)
			.expectValue("error", http.STATUS_CODES[404])
			.end();
	});

	it("POST /nothere.html (404 / 'Not Found')", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/nothere.html", method: "post"})
			.expectStatus(404)
			.expectHeader("allow", undefined)
			.expectValue("error", http.STATUS_CODES[404])
			.end();
	});

	it("PUT /nothere.html (404 / 'Not Found')", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/nothere.html", method: "put"})
			.expectStatus(404)
			.expectHeader("allow", undefined)
			.expectValue("error", http.STATUS_CODES[404])
			.end();
	});

	it("PATCH /nothere.html (404 / 'Not Found')", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/nothere.html", method: "patch"})
			.expectStatus(404)
			.expectHeader("allow", undefined)
			.expectValue("error", http.STATUS_CODES[404])
			.end();
	});

	it("DELETE /nothere.html (404 / 'Not Found')", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/nothere.html", method: "delete"})
			.expectStatus(404)
			.expectHeader("allow", undefined)
			.expectValue("error", http.STATUS_CODES[404])
			.end();
	});

	it("GET /../README (404 / 'Not Found')", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/../README"})
			.expectStatus(404)
			.expectHeader("allow", undefined)
			.expectValue("error", http.STATUS_CODES[404])
			.end();
	});

	it("GET /././../README (404 / 'Not Found')", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/././../README"})
			.expectStatus(404)
			.expectHeader("allow", undefined)
			.expectValue("error", http.STATUS_CODES[404])
			.end();
	});
});
