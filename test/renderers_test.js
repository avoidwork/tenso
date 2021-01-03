const tinyhttptest = require("tiny-httptest"),
	csv = require("csv.js"),
	tenso = require("../index"),
	routes = require("./routes.js"),
	timeout = 5000;

process.setMaxListeners(0);

describe("Renderers", function () {
	const port = 8011;

	this.timeout(timeout);
	this.tenso = tenso({port: port, routes: routes, logging: {enabled: false}, security: {csrf: false}});
	this.tenso.renderer("custom", arg => arg);

	it("GET CSV (header)", function () {
		return tinyhttptest({url: "http://localhost:" + port, headers: {accept: "text/csv"}})
			.expectStatus(200)
			.expectHeader("content-type", "text/csv")
			.expectHeader("content-disposition", "attachment; filename=\"download.csv\"")
			.expectBody(arg => csv.decode(arg) instanceof Object)
			.end();
	});

	it("GET CSV (query string)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/?format=text/csv"})
			.expectStatus(200)
			.expectHeader("content-type", "text/csv")
			.expectHeader("content-disposition", "attachment; filename=\"download.csv\"")
			.expectBody(arg => csv.decode(arg) instanceof Object)
			.end();
	});

	it("GET CSV (invalid)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/abc/?format=text/csv"})
			.expectStatus(404)
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

	it("GET JSONP (invalid)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/abc/?format=application/javascript"})
			.expectStatus(404)
			.end();
	});

	it("GET JSONP (header - custom callback)", function () {
		return tinyhttptest({
			url: "http://localhost:" + port + "/?callback=custom",
			headers: {accept: "application/javascript"}
		})
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

	it("GET JSONP (invalid)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/abc/?format=application/javascript&callback=custom"})
			.expectStatus(404)
			.end();
	});

	it("GET HTML (header)", function () {
		return tinyhttptest({
			url: "http://localhost:" + port,
			headers: {accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8"}
		})
			.expectStatus(200)
			.expectHeader("content-type", /text\/html/)
			.expectBody(/<!DOCTYPE/)
			.end();
	});

	it("GET HTML (query string)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/things?format=text/html"})
			.expectStatus(200)
			.expectHeader("content-type", /text\/html/)
			.expectBody(/&lt;h1&gt;blahblah&lt;\/h1&gt;/)
			.end();
	});

	it("GET HTML (invalid)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/abc/?format=text/html"})
			.expectStatus(404)
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

	it("GET YAML (invalid)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/abc/?format=application/yaml"})
			.expectStatus(404)
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

	it("GET XML (invalid)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/abc/?format=application/xml"})
			.expectStatus(404)
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

	it("GET Custom (invalid)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/abc/?format=application/custom"})
			.expectStatus(404)
			.end();
	});

	it("GET Plain Text (header)", function () {
		return tinyhttptest({url: "http://localhost:" + port, headers: {accept: "text/plain"}})
			.expectStatus(200)
			.expectHeader("content-type", "text/plain")
			.end();
	});

	it("GET Plain Text (query string)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/?format=text/plain"})
			.expectStatus(200)
			.expectHeader("content-type", "text/plain")
			.end();
	});

	it("GET Plain Text (invalid)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/abc/?format=text/plain"})
			.expectStatus(404)
			.end();
	});
});
