import assert from "node:assert";
import { describe, it, beforeEach, afterEach } from "mocha";
import { tenso } from "../../dist/tenso.js";
import { hypermedia } from "../../src/utils/hypermedia.js";

describe("Integration Tests - Full Request/Response Cycle", () => {
	let app;

	beforeEach(() => {
		app = tenso({ port: 0, host: "127.0.0.1", maxListeners: 100, logging: { enabled: false } }); // Use random port
	});

	afterEach(() => {
		if (app && app.server) {
			app.stop();
		}
	});

	describe("Server Lifecycle", () => {
		it("should start and stop server successfully", () => {
			app.start();
			assert(app.server !== null);

			app.stop();
			assert(app.server === null);
		});

		it("should handle multiple start/stop cycles", () => {
			// First cycle
			app.start();
			assert(app.server !== null);
			app.stop();
			assert(app.server === null);

			// Second cycle
			app.start();
			assert(app.server !== null);
			app.stop();
			assert(app.server === null);
		});
	});

	describe("Request Processing Pipeline", () => {
		it("should process request through complete pipeline", () => {
			// Mock request/response objects that mimic real HTTP flow
			const req = {
				method: "GET",
				url: "/test",
				headers: {
					accept: "application/json",
					"content-type": "application/json"
				},
				parsed: {
					pathname: "/test",
					searchParams: new URLSearchParams(),
					search: "",
					href: "http://127.0.0.1:8000/test",
					protocol: "http:"
				},
				body: "",
				cors: false,
				allow: "GET,POST"
			};

			const res = {
				statusCode: 200,
				headers: {},
				removeHeader: function (name) { delete this.headers[name]; },
				header: function (name, value) { this.headers[name] = value; },
				getHeader: function (name) { return this.headers[name]; },
				getHeaders: function () { return this.headers; }
			};

			// Step 1: Connection setup
			app.connect(req, res);
			assert.strictEqual(req.server, app);
			assert.strictEqual(req.url, "/test");
			assert.strictEqual(req.csrf, true);
			assert.strictEqual(req.hypermedia, true);

			// Step 2: Data processing
			const testData = { message: "Hello World", timestamp: Date.now() };

			// Step 3: Serialization
			const serialized = app.serialize(req, res, testData);
			assert.strictEqual(typeof serialized, "object");
			assert.deepStrictEqual(serialized.data, testData);
			assert.strictEqual(serialized.error, null);

			// Step 4: Hypermedia processing
			const hypermediaResult = hypermedia(req, res, serialized);
			assert.strictEqual(typeof hypermediaResult, "object");
			assert(Array.isArray(hypermediaResult.links));

			// Step 5: Final processing
			const finalResult = app.final(req, res, hypermediaResult);
			assert.strictEqual(finalResult, hypermediaResult);

			// Step 6: Rendering
			const rendered = app.render(req, res, finalResult);
			assert(typeof rendered === "string");
			assert(rendered.includes('"message":"Hello World"'));
		});

		it("should handle error processing pipeline", () => {
			const req = {
				method: "POST",
				url: "/error",
				headers: { accept: "application/json" },
				parsed: {
					pathname: "/error",
					searchParams: new URLSearchParams(),
					search: "",
					href: "http://127.0.0.1:8000/error",
					protocol: "http:"
				},
				cors: false,
				allow: "GET,POST"
			};

			const res = {
				statusCode: 500,
				headers: {},
				removeHeader: function (name) { delete this.headers[name]; },
				header: function (name, value) { this.headers[name] = value; },
				getHeader: function (name) { return this.headers[name]; },
				getHeaders: function () { return this.headers; }
			};

			app.connect(req, res);

			const error = new Error("Test error occurred");
			const serialized = app.serialize(req, res, error);

			assert.strictEqual(serialized.data, null);
			assert.strictEqual(serialized.error, "Test error occurred");
			assert.strictEqual(serialized.status, 500);

			const rendered = app.render(req, res, serialized);
			assert(typeof rendered === "string");
			assert(rendered.includes('"error":"Test error occurred"'));
		});
	});

	describe("Content Negotiation Integration", () => {
		it("should handle JSON request/response cycle", () => {
			const req = {
				method: "POST",
				headers: {
					"content-type": "application/json",
					accept: "application/json"
				},
				parsed: {
					searchParams: new URLSearchParams(),
					pathname: "/api/users"
				},
				body: '{"name": "John", "age": 30}',
				cors: false,
				allow: "GET,POST,PUT,DELETE"
			};

			const res = {
				statusCode: 201,
				headers: {},
				removeHeader: function (name) { delete this.headers[name]; },
				header: function (name, value) { this.headers[name] = value; },
				getHeader: function (name) { return this.headers[name]; },
				getHeaders: function () { return this.headers; }
			};

			app.connect(req, res);

			// Parse incoming data
			const parser = app.parsers.get("application/json");
			const parsedBody = parser(req.body);
			assert.deepStrictEqual(parsedBody, { name: "John", age: 30 });

			// Process and respond
			const responseData = {
				id: 1,
				...parsedBody,
				created: "2023-01-01T00:00:00Z"
			};

			const serialized = app.serialize(req, res, responseData);
			const rendered = app.render(req, res, serialized);

			assert(typeof rendered === "string");
			assert(rendered.includes('"name":"John"'));
			assert(rendered.includes('"age":30'));
			assert(rendered.includes('"id":1'));
		});

		it("should handle form data request/response cycle", () => {
			const req = {
				method: "POST",
				headers: {
					"content-type": "application/x-www-form-urlencoded",
					accept: "text/plain"
				},
				parsed: {
					searchParams: new URLSearchParams(),
					pathname: "/contact"
				},
				body: "name=Jane+Doe&email=jane%40example.com&message=Hello+World",
				cors: false,
				allow: "GET,POST"
			};

			const res = {
				statusCode: 200,
				headers: {},
				removeHeader: function (name) { delete this.headers[name]; },
				header: function (name, value) { this.headers[name] = value; },
				getHeader: function (name) { return this.headers[name]; },
				getHeaders: function () { return this.headers; }
			};

			app.connect(req, res);

			// Parse form data
			const parser = app.parsers.get("application/x-www-form-urlencoded");
			const parsedBody = parser(req.body);

			assert.strictEqual(parsedBody.name, "Jane Doe");
			assert.strictEqual(parsedBody.email, "jane@example.com");
			assert.strictEqual(parsedBody.message, "Hello World");

			// Process and respond
			const responseData = "Thank you for your message!";
			const serialized = app.serialize(req, res, responseData);
			const rendered = app.render(req, res, serialized);

			assert.strictEqual(rendered, "Thank you for your message!");
		});

		it("should handle CSV export request/response cycle", () => {
			const req = {
				method: "GET",
				headers: { accept: "text/csv" },
				url: "/export/users.csv",
				parsed: {
					searchParams: new URLSearchParams(),
					pathname: "/export/users.csv"
				},
				cors: false,
				allow: "GET"
			};

			const res = {
				statusCode: 200,
				headers: {},
				removeHeader: function (name) { delete this.headers[name]; },
				header: function (name, value) { this.headers[name] = value; },
				getHeader: function (name) { return this.headers[name]; },
				getHeaders: function () { return this.headers; }
			};

			app.connect(req, res);

			const userData = [
				{ id: 1, name: "John", email: "john@example.com" },
				{ id: 2, name: "Jane", email: "jane@example.com" }
			];

			const serialized = app.serialize(req, res, userData);
			const rendered = app.render(req, res, serialized);

			assert(typeof rendered === "string");
			assert(rendered.includes("id,name,email"));
			assert(rendered.includes("John"));
			assert(rendered.includes("Jane"));
			assert(res.headers["content-disposition"].includes("users"));
		});
	});

	describe("Middleware Integration", () => {
		it("should integrate rate limiting with request processing", () => {
			app.rate = { limit: 2, reset: 3600 };

			const createRequest = sessionId => ({
				sessionID: sessionId,
				ip: "127.0.0.1",
				method: "GET",
				headers: { accept: "application/json" },
				parsed: {
					searchParams: new URLSearchParams(),
					pathname: "/api/test"
				},
				cors: false,
				allow: "GET,POST"
			});

			const res = {
				statusCode: 200,
				headers: {},
				removeHeader: function (name) { delete this.headers[name]; },
				header: function (name, value) { this.headers[name] = value; },
				getHeader: function (name) { return this.headers[name]; },
				getHeaders: function () { return this.headers; }
			};

			// First request - should succeed
			let req1 = createRequest("rate-test-1");
			app.connect(req1, res);
			let [valid1] = app.rateLimit(req1);
			assert.strictEqual(valid1, true);

			// Second request - should succeed
			let req2 = createRequest("rate-test-1");
			let [valid2] = app.rateLimit(req2);
			assert.strictEqual(valid2, true);

			// Third request - should fail
			let req3 = createRequest("rate-test-1");
			let [valid3] = app.rateLimit(req3);
			assert.strictEqual(valid3, false);
		});

		it("should integrate hypermedia with pagination", () => {
			const testApp = tenso({ maxListeners: 100, logging: { enabled: false } });

			const items = Array.from({ length: 10 }, (_, i) => ({
				id: i + 1,
				name: `Item ${i + 1}`
			}));

			const req = {
				method: "GET",
				parsed: {
					searchParams: new URLSearchParams("page=2&page_size=3"),
					pathname: "/api/items"
				},
				cors: false,
				allow: "GET,POST"
			};

			const res = {
				statusCode: 200,
				headers: {},
				removeHeader: function (name) { delete this.headers[name]; },
				header: function (name, value) { this.headers[name] = value; },
				getHeader: function (name) { return this.headers[name]; },
				getHeaders: function () { return this.headers; }
			};

			testApp.connect(req, res);

			const response = { data: items, status: 200, links: [] };
			const hypermediaResult = hypermedia(req, res, response);

			// Should be paginated (page 2, size 3 = items 4-6)
			assert.strictEqual(hypermediaResult.data.length, 3);
			assert.strictEqual(hypermediaResult.data[0].id, 4);
			assert.strictEqual(hypermediaResult.data[2].id, 6);

			// Should have pagination links
			assert(hypermediaResult.links.length > 0);
			const linkRels = hypermediaResult.links.map(link => link.rel);
			assert(linkRels.includes("first"));
			assert(linkRels.includes("prev"));
			assert(linkRels.includes("next"));
		});
	});

	describe("Error Handling Integration", () => {
		it("should handle parsing errors gracefully", () => {
			const req = {
				method: "POST",
				headers: {
					"content-type": "application/json",
					accept: "application/json"
				},
				parsed: {
					searchParams: new URLSearchParams(),
					pathname: "/api/test"
				},
				body: '{"invalid": json}', // Malformed JSON
				cors: false,
				allow: "GET,POST"
			};

			const res = {
				statusCode: 400,
				headers: {},
				removeHeader: function (name) { delete this.headers[name]; },
				header: function (name, value) { this.headers[name] = value; },
				getHeader: function (name) { return this.headers[name]; },
				getHeaders: function () { return this.headers; }
			};

			app.connect(req, res);

			// Attempt to parse should throw
			const parser = app.parsers.get("application/json");
			assert.throws(() => parser(req.body), SyntaxError);

			// Error handling
			const parseError = new SyntaxError("Unexpected token j in JSON");
			const serialized = app.serialize(req, res, parseError);

			assert.strictEqual(serialized.data, null);
			assert(serialized.error.includes("Unexpected token"));
			assert.strictEqual(serialized.status, 400);
		});

		it("should handle rendering errors gracefully", () => {
			const req = {
				method: "GET",
				headers: { accept: "application/xml" },
				parsed: {
					searchParams: new URLSearchParams(),
					pathname: "/api/test"
				},
				cors: false,
				allow: "GET,POST"
			};

			const res = {
				statusCode: 200,
				headers: {},
				removeHeader: function (name) { delete this.headers[name]; },
				header: function (name, value) { this.headers[name] = value; },
				getHeader: function (name) { return this.headers[name]; },
				getHeaders: function () { return this.headers; }
			};

			app.connect(req, res);

			// Data that might cause rendering issues
			const problematicData = {
				circular: null,
				special: 'chars<>&"',
				number: NaN,
				infinity: Infinity
			};
			problematicData.circular = problematicData;

			const serialized = app.serialize(req, res, problematicData);
			const rendered = app.render(req, res, serialized);

			// Should still produce valid XML
			assert(typeof rendered === "string");
			assert(rendered.includes("<?xml"));
			assert(rendered.includes("<o>"));
		});
	});

	describe("Configuration Integration", () => {
		it("should integrate all configuration options in request processing", () => {
			const customApp = tenso({
				port: 0,
				host: "127.0.0.1",
				pageSize: 2,
				jsonIndent: 2,
				hypermedia: { enabled: true, header: true },
				maxListeners: 100,
				renderHeaders: false,
				corsExpose: "x-custom-header",
				defaultHeaders: { "x-api-version": "1.0" },
				logging: { enabled: false }
			});

			const req = {
				method: "GET",
				headers: { accept: "application/json" },
				parsed: {
					searchParams: new URLSearchParams(),
					pathname: "/api/items"
				},
				hypermedia: true,
				hypermediaHeader: true,
				server: customApp,
				cors: true,
				allow: "GET,POST,PUT,DELETE"
			};

			const res = {
				statusCode: 200,
				headers: {},
				removeHeader: function (name) { delete this.headers[name]; },
				header: function (name, value) { this.headers[name] = value; },
				getHeader: function (name) { return this.headers[name]; },
				getHeaders: function () { return this.headers; }
			};

			customApp.connect(req, res);

			const data = [
				{ id: 1, name: "Item 1" },
				{ id: 2, name: "Item 2" },
				{ id: 3, name: "Item 3" }
			];

			const response = { data, status: 200, links: [] };
			const hypermediaResult = hypermedia(req, res, response);

			// Should use configured pageSize
			assert.strictEqual(hypermediaResult.data.length, customApp.pageSize);

			const rendered = customApp.render(req, res, hypermediaResult);

			// Should use configured JSON indentation
			assert(rendered.includes("\n"));
			assert(rendered.includes("  "));

			customApp.stop();
		});
	});

	describe("Complete Application Flow", () => {
		it("should handle a complete REST API request cycle", () => {
			// Simulate a complete REST API interaction
			const users = [
				{ id: 1, name: "John Doe", email: "john@example.com" },
				{ id: 2, name: "Jane Smith", email: "jane@example.com" }
			];

			// GET /api/users - List all users
			const listReq = {
				method: "GET",
				url: "/api/users",
				headers: { accept: "application/json" },
				parsed: {
					searchParams: new URLSearchParams(),
					pathname: "/api/users",
					href: "http://127.0.0.1:8000/api/users",
					protocol: "http:"
				},
				hypermedia: true,
				hypermediaHeader: true,
				server: app,
				cors: false,
				allow: "GET,POST,PUT,DELETE"
			};

			const listRes = {
				statusCode: 200,
				headers: {},
				removeHeader: function (name) { delete this.headers[name]; },
				header: function (name, value) { this.headers[name] = value; },
				getHeader: function (name) { return this.headers[name]; },
				getHeaders: function () { return this.headers; }
			};

			app.connect(listReq, listRes);
			const listResponse = { data: users, status: 200, links: [] };
			const listHypermedia = hypermedia(listReq, listRes, listResponse);
			const listRendered = app.render(listReq, listRes, listHypermedia);

			assert(listRendered.includes('"name":"John Doe"'));
			assert(listRendered.includes('"name":"Jane Smith"'));

			// POST /api/users - Create new user
			const createReq = {
				method: "POST",
				url: "/api/users",
				headers: {
					"content-type": "application/json",
					accept: "application/json"
				},
				parsed: {
					searchParams: new URLSearchParams(),
					pathname: "/api/users"
				},
				body: '{"name": "Bob Wilson", "email": "bob@example.com"}',
				cors: false,
				allow: "GET,POST,PUT,DELETE"
			};

			const createRes = {
				statusCode: 201,
				headers: {},
				removeHeader: function (name) { delete this.headers[name]; },
				header: function (name, value) { this.headers[name] = value; },
				getHeader: function (name) { return this.headers[name]; },
				getHeaders: function () { return this.headers; }
			};

			app.connect(createReq, createRes);

			const parser = app.parsers.get("application/json");
			const newUserData = parser(createReq.body);
			const createdUser = { id: 3, ...newUserData };

			const createResponse = { data: createdUser, status: 201, links: [] };
			const createSerialized = app.serialize(createReq, createRes, createResponse);
			const createRendered = app.render(createReq, createRes, createSerialized);

			assert(createRendered.includes('"id":3'));
			assert(createRendered.includes('"name":"Bob Wilson"'));
			assert(createRendered.includes('"email":"bob@example.com"'));
		});
	});
});
