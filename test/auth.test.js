import {httptest} from "tiny-httptest";
import jwt from "jsonwebtoken";
import {tenso} from "../dist/tenso.js";
import {routes} from "./routes.js";

const timeout = 5000;
const basePort = 3000;

process.setMaxListeners(0);

describe("Permissions (CSRF disabled)", function () {
	const port = basePort + 1;

	this.timeout(timeout);
	this.tenso = tenso({port: port, initRoutes: routes, logging: {enabled: false}, security: {csrf: false}});

	const server = this.tenso.start();

	it("GET / - returns an array of endpoints", function () {
		return httptest({url: "http://localhost:" + port})
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
		return httptest({url: "http://localhost:" + port + "/invalid"})
			.expectJson()
			.expectStatus(404)
			.expectValue("data", null)
			.expectValue("error", "Not Found")
			.expectValue("status", 404)
			.end();
	});

	it("DELETE / - returns a 'method not allowed' error", function () {
		return httptest({url: "http://localhost:" + port, method: "delete"})
			.expectJson()
			.expectStatus(405)
			.expectValue("data", null)
			.expectValue("error", "Method Not Allowed")
			.expectValue("status", 405)
			.end();
	});

	it("POST / - returns a 'method not allowed' error", function () {
		return httptest({url: "http://localhost:" + port, method: "post"})
			.expectJson()
			.expectStatus(405)
			.expectValue("data", null)
			.expectValue("error", "Method Not Allowed")
			.expectValue("status", 405)
			.end();
	});

	it("PUT / - returns a 'method not allowed' error", function () {
		return httptest({url: "http://localhost:" + port, method: "put"})
			.expectJson()
			.expectStatus(405)
			.expectValue("data", null)
			.expectValue("error", "Method Not Allowed")
			.expectValue("status", 405)
			.end();
	});

	it("PATCH / - returns a 'method not allowed' error", function () {
		return httptest({url: "http://localhost:" + port, method: "patch"})
			.expectJson()
			.expectStatus(405)
			.expectValue("data", null)
			.expectValue("error", "Method Not Allowed")
			.expectValue("status", 405)
			.end().then(() => server.stop());
	});
});

describe("Basic Auth", function () {
	const port = basePort + 2;

	this.timeout(timeout);
	this.tenso = tenso({
		port: port,
		initRoutes: routes,
		logging: {enabled: false},
		auth: {basic: {enabled: true, list: ["test:123"]}, protect: ["/uuid"]}
	});

	const server = this.tenso.start();

	it("GET / - returns links", function () {
		return httptest({url: "http://localhost:" + port})
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
		return httptest({url: "http://test:123@localhost:" + port + "/uuid"})
			.expectJson()
			.expectStatus(200)
			.expectValue("links", [{uri: "/", rel: "collection"}])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET /uuid - returns an 'unauthorized' error", function () {
		return httptest({url: "http://localhost:" + port + "/uuid"})
			.expectStatus(401)
			.end().then(() => server.stop());
	});
});

describe("OAuth2 Token Bearer", function () {
	const port = basePort + 3;

	this.timeout(timeout);
	this.tenso = tenso({
		port: port,
		initRoutes: routes,
		logging: {enabled: false},
		auth: {bearer: {enabled: true, tokens: ["abc-123"]}, protect: ["/"]}
	});

	const server = this.tenso.start();

	it("GET / - returns an array of endpoints (authorized)", function () {
		return httptest({url: "http://localhost:" + port, headers: {authorization: "Bearer abc-123"}})
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
		return httptest({url: "http://localhost:" + port})
			.expectStatus(401)
			.end().then(() => server.stop());
	});
});

describe("JWT", function () {
	const port = basePort + 5,
		secret = "jennifer",
		token = jwt.sign({username: "jason@attack.io"}, secret);

	this.timeout(timeout);
	this.tenso = tenso({
		port: port, initRoutes: routes, logging: {enabled: false}, auth: {
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

	const server = this.tenso.start();

	it("GET /uuid - returns a uuid (authorized)", function () {
		return httptest({url: "http://localhost:" + port + "/uuid", headers: {authorization: "Bearer " + token}})
			.expectStatus(200)
			.expectJson()
			.expectValue("links", [{uri: "/", rel: "collection"}])
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET /uuid - returns an 'unauthorized' error", function () {
		return httptest({url: "http://localhost:" + port + "/uuid"})
			.expectStatus(401)
			.end().then(() => server.stop());
	});
});
