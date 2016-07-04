var hippie = require("hippie"),
	emitter = require("events"),
	tenso = require("../index"),
	routes = require("./routes.js"),
	array = require("retsu"),
	csrf = 'x-csrf-token';

process.setMaxListeners(0);

function persistCookies (opts, next) {
	opts.jar = true;
	next(opts);
}

function api (port, not_json) {
	var obj = hippie().base("http://localhost:" + port).use(persistCookies);

	return not_json ? obj : obj.expectHeader("Content-Type", "application/json").json();
}

function get_token (port, fn, url) {
	return api(port).get(url || "/login").end(fn);
}

describe("Permissions (CSRF disabled)", function () {
	var port = 8001;

	tenso({port: port, routes: routes, logging: {level: "error"}, security: {csrf: false}});

	this.timeout(5000);

	it("GET / - returns an array of endpoints", function (done) {
		api(port)
			.get("/")
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
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("GET /invalid - returns a 'not found' error", function (done) {
		api(port)
			.get("/invalid")
			.expectStatus(404)
			.expectValue("data", null)
			.expectValue("error", "Not Found")
			.expectValue("status", 404)
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("DELETE / - returns a 'method not allowed' error", function (done) {
		api(port)
			.del("/")
			.expectStatus(405)
			.expectValue("data", null)
			.expectValue("error", "Method Not Allowed")
			.expectValue("status", 405)
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("POST / - returns a 'method not allowed' error", function (done) {
		api(port)
			.post("/")
			.expectStatus(405)
			.expectValue("data", null)
			.expectValue("error", "Method Not Allowed")
			.expectValue("status", 405)
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("PUT / - returns a 'method not allowed' error", function (done) {
		api(port)
			.put("/")
			.expectStatus(405)
			.expectValue("data", null)
			.expectValue("error", "Method Not Allowed")
			.expectValue("status", 405)
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("PATCH / - returns a 'method not allowed' error", function (done) {
		api(port)
			.patch("/")
			.expectStatus(405)
			.expectValue("data", null)
			.expectValue("error", "Method Not Allowed")
			.expectValue("status", 405)
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});
});

describe("Basic Auth", function () {
	var port = 8004;

	tenso({
		port: port,
		routes: routes,
		logging: {level: "error"},
		auth: {basic: {enabled: true, list: ["test:123"]}, protect: ["/uuid"]}
	});

	this.timeout(5000);

	it("GET / - returns links", function (done) {
		api(port)
			.get("/")
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
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("GET /uuid - returns a uuid (authorized)", function (done) {
		api(port)
			.auth('test', '123')
			.get("/uuid")
			.expectStatus(200)
			.expectValue("links", [{uri: "/", rel: "collection"}])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("GET /uuid - returns an 'unauthorized' error", function (done) {
		api(port, true)
			.get("/uuid")
			.expectStatus(401)
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});
});

describe("OAuth2 Token Bearer", function () {
	var port = 8005;

	tenso({
		port: port,
		routes: routes,
		logging: {level: "error"},
		auth: {bearer: {enabled: true, tokens: ["abc-123"]}, protect: ["/"]}
	});

	this.timeout(5000);

	it("GET / - returns an array of endpoints (authorized)", function (done) {
		api(port)
			.header('Authorization', 'Bearer abc-123')
			.get("/")
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
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("GET / - returns an 'unauthorized' error", function (done) {
		api(port, true)
			.get("/")
			.expectStatus(401)
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});
});

describe("Local", function () {
	var port = 8006;

	tenso({
		port: port,
		routes: require("./routes.js"),
		logging: {
			level: "error",
			dtrace: true,
			stderr: true
		},
		auth: {
			local: {
				enabled: true,
				auth: function (username, password, callback) {
					if (username === "test" && password === 123) {
						callback(null, {username: username, password: password});
					} else {
						callback(true, null);
					}
				}
			},
			protect: ["/uuid"]
		}
	});

	this.timeout(5000);

	it("GET /uuid (invalid) - returns an 'unauthorized' error", function (done) {
		api(port, true)
			.get("/uuid")
			.expectStatus(302)
			.expectHeader("Location", "/login")
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("GET /login - returns an authentication message", function (done) {
		api(port)
			.get("/login")
			.expectStatus(200)
			.expectValue("links", [{uri: "/", rel: "collection"}])
			.expectValue("data", {instruction: "POST 'username' & 'password' to authenticate"})
			.expectValue("error", null)
			.expectValue("status", 200)
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("POST /login (invalid / no CSRF token) - returns an 'unauthorized' error", function (done) {
		api(port)
			.post("/login")
			.form()
			.send({username: "test", password: 1232})
			.expectStatus(403)
			.expectValue("data", null)
			.expectValue("error", "CSRF token missing")
			.expectValue("status", 403)
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});

	it("POST /login (invalid) - returns an 'unauthorized' error", function (done) {
		get_token(port, function (err, res) {
			var token;

			if (err) throw err;

			token = res.headers[csrf];

			api(port, true)
				.header(csrf, token)
				.header("accept", "application/json")
				.post("/login")
				.form()
				.send({username: "test", password: 1232})
				.json()
				.expectStatus(401)
				.expectValue("data", null)
				.expectValue("error", "Unauthorized")
				.expectValue("status", 401)
				.end(function (err, body, res) {
					if (err) throw err;
					done();
				});
		});
	});

	// needs to reuse the session cookie header for identification
	it("POST /login - redirects to a predetermined URI", function (done) {
		get_token(port, function (err, res) {
			var token;

			if (err) throw err;

			token = res.headers[csrf];

			api(port, true)
				.header(csrf, token)
				.post("/login")
				.form()
				.send({username: "test", password: 123})
				.expectStatus(302)
				.expectHeader("Location", "/")
				.end(function (err) {
					if (err) throw err;
					done();
				});
		});
	});

	it("GET /uuid (session) - returns a version 4 uuid", function (done) {
		api(port)
			.get("/uuid")
			.expectStatus(200)
			.expectValue("links", [{uri: "/", rel: "collection"}])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end(function (err) {
				if (err) throw err;
				done();
			});
	});
});
