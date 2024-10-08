import {httptest} from "tiny-httptest";
import {tenso} from "../dist/tenso.cjs";
import {routes} from "./routes.js";

const timeout = 5000;

describe("Valid", function () {
	const port = 3021;

	this.timeout(timeout);
	this.tenso = tenso({
		port: port,
		initRoutes: routes,
		etags: {enabled: true},
		logging: {enabled: false},
		security: {csrf: false}
	});

	const server = this.tenso.start();

	it("GET / (200 / 'Array')", function () {
		return httptest({url: "http://localhost:" + port + "/"})
			.expectStatus(200)
			.end();
	});

	it("HEAD / (200 / empty)", function () {
		return httptest({url: "http://localhost:" + port + "/", method: "head"})
			.expectStatus(200)
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.expectHeader("content-length", 320)
			.expectBody(/^$/)
			.end();
	});

	it("OPTIONS / (200 / empty)", function () {
		return httptest({url: "http://localhost:" + port + "/", method: "options"})
			.expectStatus(200)
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.expectHeader("content-length", 320)
			.expectValue("data", /\w/)
			.expectValue("error", null)
			.expectValue("status", 200)
			.end();
	});

	it("GET / (206 / 'Partial response - bytes=0-5')", function () {
		return httptest({url: "http://localhost:" + port + "/", headers: {range: "bytes=0-5"}})
			.expectStatus(206)
			.expectHeader("content-range", /^bytes 0-5\/290$/)
			.expectHeader("content-length", 5)
			.expectBody(/^{"dat$/)
			.end();
	});

	it("GET / (206 / 'Partial response - bytes=-5')", function () {
		return httptest({url: "http://localhost:" + port + "/", headers: {range: "bytes=-5"}})
			.expectStatus(206)
			.expectHeader("content-range", /^bytes 285-290\/290$/)
			.expectHeader("content-length", 5)
			.expectBody(/^:200}$/)
			.end();
	});

	it("GET /null (200 / 'null')", function () {
		return httptest({url: "http://localhost:" + port + "/null"})
			.expectStatus(200)
			.expectHeader("allow", "GET, HEAD, OPTIONS")
			.expectValue("data", null)
			.expectValue("error", null)
			.expectValue("status", 200)
			.end().then(() => server.stop());
	});
});
