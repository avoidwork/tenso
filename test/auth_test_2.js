const path = require("path"),
	tinyhttptest = require("tiny-httptest"),
	//jwt = require("jsonwebtoken"),
	tenso = require("../index"),
	routes = require("./routes.js"),
	//csrf = "x-csrf-token",
	timeout = 5000;

process.setMaxListeners(0);
/*
describe("Permissions (CSRF disabled) (HTTP2)", function () {
	const port = 8151;

	this.timeout(timeout);
	this.tenso = tenso({port: port, http2: true, routes: routes, logging: {level: "error"}, security: {csrf: false}, ssl: {
		key: path.join(__dirname, "..", "ssl", "localhost.key"),
		cert: path.join(__dirname, "..", "ssl", "localhost.crt")
	}});

	it("GET / - returns an array of endpoints", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port})
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
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/invalid"})
			.expectJson()
			.expectStatus(404)
			.expectValue("data", null)
			.expectValue("error", "Not Found")
			.expectValue("status", 404)
			.end();
	});

	it("DELETE / - returns a 'method not allowed' error", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port, method: "delete"})
			.expectJson()
			.expectStatus(405)
			.expectValue("data", null)
			.expectValue("error", "Method Not Allowed")
			.expectValue("status", 405)
			.end();
	});

	it("POST / - returns a 'method not allowed' error", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port, method: "post"})
			.expectJson()
			.expectStatus(405)
			.expectValue("data", null)
			.expectValue("error", "Method Not Allowed")
			.expectValue("status", 405)
			.end();
	});

	it("PUT / - returns a 'method not allowed' error", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port, method: "put"})
			.expectJson()
			.expectStatus(405)
			.expectValue("data", null)
			.expectValue("error", "Method Not Allowed")
			.expectValue("status", 405)
			.end();
	});

	it("PATCH / - returns a 'method not allowed' error", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port, method: "patch"})
			.expectJson()
			.expectStatus(405)
			.expectValue("data", null)
			.expectValue("error", "Method Not Allowed")
			.expectValue("status", 405)
			.end();
	});
});
*/
describe("Basic Auth", function () {
	const port = 8154;

	this.timeout(timeout);
	this.tenso = tenso({port: port, http2: true, routes: routes, logging: {level: "error"}, auth: {basic: {enabled: true, list: ["test:123"]}, protect: ["/uuid"]}, ssl: {
		key: path.join(__dirname, "..", "ssl", "localhost.key"),
		cert: path.join(__dirname, "..", "ssl", "localhost.crt")
	}});

	/*it("GET / - returns links", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port})
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
	});*/

	it("GET /uuid - returns a uuid (authorized)", function () {
		return tinyhttptest({http2: true, url: "http://test:123@localhost:" + port + "/uuid"})
			.expectJson()
			.expectStatus(200)
			.expectValue("links", [{uri: "/", rel: "collection"}])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	/*it("GET /uuid - returns an 'unauthorized' error", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/uuid"})
			.expectStatus(401)
			.end();
	});*/
});
/*
describe("OAuth2 Token Bearer", function () {
	const port = 8155;

	this.timeout(timeout);
	this.tenso = tenso({port: port, http2: true, routes: routes, logging: {level: "error"}, auth: {bearer: {enabled: true, tokens: ["abc-123"]}, protect: ["/"]}, ssl: {
		key: path.join(__dirname, "..", "ssl", "localhost.key"),
		cert: path.join(__dirname, "..", "ssl", "localhost.crt")
	}});

	it("GET / - returns an array of endpoints (authorized)", function () {
		return tinyhttptest({http2: true, url: "http://localhost:" + port, headers: {authorization: "Bearer abc-123"}})
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
		return tinyhttptest({http2: true, url: "http://localhost:" + port})
			.expectStatus(401)
			.end();
	});
});

describe("Local", function () {
	const port = 8156,
		valid = 123,
		invalid = 1234;

	this.timeout(timeout);
	this.tenso = tenso({port: port, http2: true, routes: routes, logging: {level: "error"}, auth: {
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
	}, ssl: {
		key: path.join(__dirname, "..", "ssl", "localhost.key"),
		cert: path.join(__dirname, "..", "ssl", "localhost.crt")
	}});

	it("GET /uuid (invalid) - returns an 'unauthorized' error", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/uuid"})
			.cookies()
			.expectStatus(302)
			.expectHeader("location", "/login")
			.end();
	});

	it("GET /login - returns an authentication message", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/login"})
			.cookies()
			.captureHeader(csrf)
			.expectJson()
			.expectStatus(200)
			.expectValue("links", [{uri: "/", rel: "collection"}])
			.expectValue("data", {instruction: "POST 'username' & 'password' to authenticate"})
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("POST /login (invalid / no CSRF token) - returns an 'unauthorized' error", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/login", method: "post"})
			.cookies()
			.json({username: "test", password: invalid})
			.expectStatus(403)
			.expectValue("data", null)
			.expectValue("error", "CSRF token missing")
			.expectValue("status", 403)
			.end();
	});

	it("POST /login (invalid) - returns an 'unauthorized' error", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/login", method: "post"})
			.cookies()
			.reuseHeader(csrf)
			.json({username: "test", password: invalid})
			.expectStatus(401)
			.expectValue("data", null)
			.expectValue("error", "Unauthorized")
			.expectValue("status", 401)
			.end();
	});

	it("POST /login - redirects to a predetermined URI", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/login", method: "post"})
			.cookies()
			.reuseHeader(csrf)
			.json({username: "test", password: valid})
			.expectStatus(302)
			.expectHeader("content-type", "text/html; charset=utf-8") // anti-pattern of strategy
			.expectHeader("location", "/")
			.end();
	});

	it("GET /uuid (session) - returns a version 4 uuid", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/uuid"})
			.cookies()
			.expectStatus(200)
			.expectJson()
			.expectValue("links", [{uri: "/", rel: "collection"}])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});
});

describe("JWT", function () {
	const port = 8152,
		secret = "jennifer",
		token = jwt.sign({username: "jason@attack.io"}, secret);

	this.timeout(timeout);
	this.tenso = tenso({port: port, http2: true, routes: routes, logging: {level: "error"}, auth: {
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
	}, ssl: {
		key: path.join(__dirname, "..", "ssl", "localhost.key"),
		cert: path.join(__dirname, "..", "ssl", "localhost.crt")
	}});

	it("GET /uuid - returns a uuid (authorized)", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/uuid", headers: {authorization: "Bearer " + token}})
			.expectStatus(200)
			.expectJson()
			.expectValue("links", [{uri: "/", rel: "collection"}])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET /uuid - returns an 'unauthorized' error", function () {
		return tinyhttptest({http2: true, url: "https://localhost:" + port + "/uuid"})
			.expectStatus(401)
			.end();
	});
});
*/
