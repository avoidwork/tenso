const tinyhttptest = require("tiny-httptest"),
	jwt = require("jsonwebtoken"),
	tenso = require("../index"),
	routes = require("./routes.js"),
	csrf = "x-csrf-token",
	timeout = 5000;

process.setMaxListeners(0);

describe("Permissions (CSRF disabled)", function () {
	const port = 8001;

	this.timeout(timeout);
	this.tenso = tenso({port: port, routes: routes, logging: {enabled: false}, security: {csrf: false}});

	const server = this.tenso.server;

	it("GET / - returns an array of endpoints", function () {
		return tinyhttptest({url: "http://localhost:" + port})
			.expectJson()
			.expectStatus(200)
			.expectHeader("allow", "GET, HEAD, OPTIONS")
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

	it("GET /invalid - returns a 'not found' error", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/invalid"})
			.expectJson()
			.expectStatus(404)
			.expectValue("data", null)
			.expectValue("error", "Not Found")
			.expectValue("status", 404)
			.end();
	});

	it("DELETE / - returns a 'method not allowed' error", function () {
		return tinyhttptest({url: "http://localhost:" + port, method: "delete"})
			.expectJson()
			.expectStatus(405)
			.expectValue("data", null)
			.expectValue("error", "Method Not Allowed")
			.expectValue("status", 405)
			.end();
	});

	it("POST / - returns a 'method not allowed' error", function () {
		return tinyhttptest({url: "http://localhost:" + port, method: "post"})
			.expectJson()
			.expectStatus(405)
			.expectValue("data", null)
			.expectValue("error", "Method Not Allowed")
			.expectValue("status", 405)
			.end();
	});

	it("PUT / - returns a 'method not allowed' error", function () {
		return tinyhttptest({url: "http://localhost:" + port, method: "put"})
			.expectJson()
			.expectStatus(405)
			.expectValue("data", null)
			.expectValue("error", "Method Not Allowed")
			.expectValue("status", 405)
			.end();
	});

	it("PATCH / - returns a 'method not allowed' error", function () {
		return tinyhttptest({url: "http://localhost:" + port, method: "patch"})
			.expectJson()
			.expectStatus(405)
			.expectValue("data", null)
			.expectValue("error", "Method Not Allowed")
			.expectValue("status", 405)
			.end().then(() => server.close());
	});
});

describe("Basic Auth", function () {
	const port = 8004;

	this.timeout(timeout);
	this.tenso = tenso({
		port: port,
		routes: routes,
		logging: {level: "error"},
		auth: {basic: {enabled: true, list: ["test:123"]}, protect: ["/uuid"]}
	});

	const server = this.tenso.server;

	it("GET / - returns links", function () {
		return tinyhttptest({url: "http://localhost:" + port})
			.expectJson()
			.expectStatus(200)
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

	it("GET /uuid - returns a uuid (authorized)", function () {
		return tinyhttptest({url: "http://test:123@localhost:" + port + "/uuid"})
			.expectJson()
			.expectStatus(200)
			.expectValue("links", [{uri: "/", rel: "collection"}])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET /uuid - returns an 'unauthorized' error", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/uuid"})
			.expectStatus(401)
			.end().then(() => server.close());
	});
});

describe("OAuth2 Token Bearer", function () {
	const port = 8005;

	this.timeout(timeout);
	this.tenso = tenso({
		port: port,
		routes: routes,
		logging: {level: "error"},
		auth: {bearer: {enabled: true, tokens: ["abc-123"]}, protect: ["/"]}
	});

	const server = this.tenso.server;

	it("GET / - returns an array of endpoints (authorized)", function () {
		return tinyhttptest({url: "http://localhost:" + port, headers: {authorization: "Bearer abc-123"}})
			.expectJson()
			.expectStatus(200)
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

	it("GET / - returns an 'unauthorized' error", function () {
		return tinyhttptest({url: "http://localhost:" + port})
			.expectStatus(401)
			.end().then(() => server.close());
	});
});

describe("Local", function () {
	const port = 8006,
		valid = 123,
		invalid = 1234;

	this.timeout(timeout);
	this.tenso = tenso({
		port: port, routes: routes, logging: {level: "error"}, auth: {
			local: {
				enabled: true,
				auth: function (username, password, callback) {
					if (username === "test" && password === valid) {
						callback(null, {username: username, password: password});
					} else {
						callback(true, null);
					}
				}
			},
			protect: ["/uuid"]
		}
	});

	const server = this.tenso.server,
		login = this.tenso.config.auth.uri.login;

	it("GET /uuid (invalid) - returns an 'unauthorized' error", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/uuid"})
			.cookies()
			.expectStatus(401)
			.end();
	});

	it("GET /auth/login - returns an authentication message", function () {
		return tinyhttptest({url: "http://localhost:" + port + login})
			.cookies()
			.captureHeader(csrf)
			.expectJson()
			.expectStatus(200)
			.expectValue("links", [{
				"uri": "/auth",
				"rel": "collection"
			}])
			.expectValue("data", {instruction: "POST 'username' & 'password' to authenticate"})
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("POST /auth/login (invalid / no CSRF token) - returns an 'unauthorized' error", function () {
		return tinyhttptest({url: "http://localhost:" + port + login, method: "post"})
			.cookies()
			.json({username: "test", password: invalid})
			.expectStatus(403)
			.expectValue("data", null)
			.expectValue("error", "CSRF token missing")
			.expectValue("status", 403)
			.end();
	});

	it("POST /auth/login (invalid) - returns an 'unauthorized' error", function () {
		return tinyhttptest({url: "http://localhost:" + port + login, method: "post"})
			.cookies()
			.reuseHeader(csrf)
			.json({username: "test", password: invalid})
			.expectStatus(401)
			.expectValue("data", null)
			.expectValue("error", "Unauthorized")
			.expectValue("status", 401)
			.end();
	});

	it("POST /auth/login - redirects to a predetermined URI", function () {
		return tinyhttptest({url: "http://localhost:" + port + login, method: "post"})
			.cookies()
			.reuseHeader(csrf)
			.json({username: "test", password: valid})
			.expectStatus(302)
			.expectHeader("content-type", undefined)
			.expectHeader("location", "/")
			.end();
	});

	it("GET /uuid (session) - returns a version 4 uuid", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/uuid"})
			.cookies()
			.expectStatus(200)
			.expectJson()
			.expectValue("links", [{uri: "/", rel: "collection"}])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end().then(() => server.close());
	});
});

describe("JWT", function () {
	const port = 8012,
		secret = "jennifer",
		token = jwt.sign({username: "jason@attack.io"}, secret);

	this.timeout(timeout);
	this.tenso = tenso({
		port: port, routes: routes, logging: {level: "error"}, auth: {
			jwt: {
				enabled: true,
				auth: function (arg, cb) {
					if (arg.username === "jason@attack.io") {
						cb(null, arg);
					} else {
						cb(new Error("Invalid token"), null);
					}
				},
				secretOrKey: secret
			},
			security: {
				csrf: false
			},
			protect: ["/uuid"]
		}
	});

	const server = this.tenso.server;

	it("GET /uuid - returns a uuid (authorized)", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/uuid", headers: {authorization: "Bearer " + token}})
			.expectStatus(200)
			.expectJson()
			.expectValue("links", [{uri: "/", rel: "collection"}])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET /uuid - returns an 'unauthorized' error", function () {
		return tinyhttptest({url: "http://localhost:" + port + "/uuid"})
			.expectStatus(401)
			.end().then(() => server.close());
	});
});
