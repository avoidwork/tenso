const tinyhttptest = require("tiny-httptest"),
	tenso = require("../index"),
	routes = require("./routes.js"),
	timeout = 5000;

process.setMaxListeners(0);

describe("Renderers", function () {
	const port = 8011;
	let server;

	this.timeout(timeout);
	server = tenso({port: port, routes: routes, logging: {level: "error"}, security: {csrf: false}});
	server.renderer("custom", function (arg) {
		return arg;
	}, "application/json");

	it("GET CSV (header)", function () {
		return tinyhttptest({url: "http://localhost:" + port, headers: {accept: "text/csv"}})
			.expectStatus(200)
			.expectHeader("content-type", "text/csv")
			.end();
	});

	it("GET CSV (query string)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/?format=text/csv"})
			.expectStatus(200)
			.expectHeader("content-type", "text/csv")
			.end();
	});

	it("GET JSONP (header)", function () {
		return tinyhttptest({url: "http://localhost:" + port, headers: {accept: "application/javascript"}})
			.expectStatus(200)
			.expectHeader("content-type", "application/javascript")
			.expectBody(/^callback\(/)
			.end();
	});

	it("GET JSONP (query string)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/?format=application/javascript"})
			.expectStatus(200)
			.expectHeader("content-type", "application/javascript")
			.expectBody(/^callback\(/)
			.end();
	});

	it("GET JSONP (header - custom callback)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/?callback=custom", headers: {accept: "application/javascript"}})
			.expectStatus(200)
			.expectHeader("content-type", "application/javascript")
			.expectBody(/^custom\(/)
			.end();
	});

	it("GET JSONP (query string - custom callback)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/?format=application/javascript&callback=custom"})
			.expectStatus(200)
			.expectHeader("content-type", "application/javascript")
			.expectBody(/^custom\(/)
			.end();
	});

	it("GET HTML (header)", function () {
		return tinyhttptest({url: "http://localhost:" + port, headers: {accept: "text/html"}})
			.expectStatus(200)
			.expectHeader("content-type", "text/html")
			.end();
	});

	it("GET HTML (query string)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/?format=text/html"})
			.expectStatus(200)
			.expectHeader("content-type", "text/html")
			.end();
	});

	it("GET HTML (body)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/html?format=text/html"})
			.expectStatus(200)
			.expectHeader("content-type", "text/html")
			.expectBody(/^([^](?!<\/html>))*[^]<\/html>[\n\r\s]*$/gi)
			.end();
	});

	it("GET YAML (header)", function () {
		return tinyhttptest({url: "http://localhost:" + port, headers: {accept: "application/yaml"}})
			.expectStatus(200)
			.expectHeader("content-type", "application/yaml")
			.end();
	});

	it("GET YAML (query string)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/?format=application/yaml"})
			.expectStatus(200)
			.expectHeader("content-type", "application/yaml")
			.end();
	});

	it("GET XML (header)", function () {
		return tinyhttptest({url: "http://localhost:" + port, headers: {accept: "application/xml"}})
			.expectStatus(200)
			.expectHeader("content-type", "application/xml")
			.end();
	});

	it("GET XML (query string)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/?format=application/xml"})
			.expectStatus(200)
			.expectHeader("content-type", "application/xml")
			.end();
	});

	it("GET Custom (header)", function () {
		return tinyhttptest({url: "http://localhost:" + port, headers: {accept: "application/custom"}})
			.expectStatus(200)
			.expectHeader("content-type", "application/json")
			.end();
	});

	it("GET Custom (query string)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/?format=application/custom"})
			.expectStatus(200)
			.expectHeader("content-type", "application/json")
			.end();
	});
});
