var hippie = require("hippie"),
	tenso = require("../lib/index"),
	routes = require("./routes.js"),
	csrf = 'x-csrf-token';

function persistCookies (opts, next) {
	opts.jar = true;
	next(opts);
}

function api (port, not_json) {
	var obj = hippie().base("http://localhost:" + port).use(persistCookies);

	return not_json ? obj : obj.expectHeader("Content-Type", "application/json").json();
}

process.setMaxListeners(0);

describe("Renderers", function () {
	var port = 8010, server;

	server = tenso({port: port, routes: routes, logs: {level: "error"}});
	server.renderer("custom", function (arg) {
		return arg;
	}, "application/json");

	this.timeout(5000);

	it("GET CSV (header)", function (done) {
		api(port, true)
			.get("/")
			.header("accept", "text/csv")
			.expectStatus(200)
			.expectHeader("Content-Type", "text/csv")
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("GET CSV (query string)", function (done) {
		api(port, true)
			.get("/?format=text/csv")
			.expectStatus(200)
			.expectHeader("Content-Type", "text/csv")
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("GET HTML (header)", function (done) {
		api(port, true)
			.get("/")
			.header("accept", "text/html")
			.expectStatus(200)
			.expectHeader("Content-Type", "text/html")
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("GET HTML (query string)", function (done) {
		api(port, true)
			.get("/?format=text/html")
			.expectStatus(200)
			.expectHeader("Content-Type", "text/html")
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("GET YAML (header)", function (done) {
		api(port, true)
			.get("/")
			.header("accept", "application/yaml")
			.expectStatus(200)
			.expectHeader("Content-Type", "application/yaml")
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("GET YAML (query string)", function (done) {
		api(port, true)
			.get("/?format=application/yaml")
			.expectStatus(200)
			.expectHeader("Content-Type", "application/yaml")
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("GET XML (header)", function (done) {
		api(port, true)
			.get("/")
			.header("accept", "application/xml")
			.expectStatus(200)
			.expectHeader("Content-Type", "application/xml")
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("GET XML (query string)", function (done) {
		api(port, true)
			.get("/?format=application/xml")
			.expectStatus(200)
			.expectHeader("Content-Type", "application/xml")
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("GET Custom (header)", function (done) {
		api(port, true)
			.get("/")
			.header("accept", "application/custom")
			.expectStatus(200)
			.expectHeader("Content-Type", "application/json")
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("GET Custom (query string)", function (done) {
		api(port, true)
			.get("/?format=application/custom")
			.expectStatus(200)
			.expectHeader("Content-Type", "application/json")
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});
});
