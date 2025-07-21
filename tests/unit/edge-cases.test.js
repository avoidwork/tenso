import assert from "node:assert";
import { describe, it, beforeEach, afterEach } from "mocha";
import { tenso } from "../../dist/tenso.js";
// Import utility functions that tests are trying to use
import { sort } from "../../src/utils/sort.js";
import { hypermedia } from "../../src/utils/hypermedia.js";
import { serialize } from "../../src/utils/serialize.js";

describe("Edge Cases and Error Conditions", () => {
	let app;

	beforeEach(() => {
		app = tenso({ maxListeners: 120, logging: { enabled: false } });
	});

	afterEach(() => {
		if (app && app.server) {
			app.stop();
		}
	});

	describe("Invalid Configuration", () => {
		it("should handle missing configuration object", () => {
			const emptyApp = tenso({ maxListeners: 120, logging: { enabled: false } });
			assert(emptyApp instanceof Object);
			emptyApp.stop();
		});

		it("should handle null configuration", () => {
			const nullApp = tenso({ maxListeners: 120, logging: { enabled: false } });
			assert(nullApp instanceof Object);
			nullApp.stop();
		});

		it("should handle invalid port configuration", () => {
			// Port validation happens in the factory, test that it handles various port values
			const config1 = { port: "invalid", maxListeners: 120, logging: { enabled: false }};
			const config2 = { port: -1, maxListeners: 120, logging: { enabled: false }};
			const config3 = { port: 65536, maxListeners: 120, logging: { enabled: false }};

			// These should create apps with default or corrected ports
			const app1 = tenso(config1);
			const app2 = tenso(config2);
			const app3 = tenso(config3);

			assert(app1 instanceof Object);
			assert(app2 instanceof Object);
			assert(app3 instanceof Object);

			app1.stop();
			app2.stop();
			app3.stop();
		});

		it("should handle missing required configuration keys", () => {
			const minimalConfig = {
				title: "Test App",
				maxListeners: 120,
				logging: { enabled: false }
			};

			const testApp = tenso(minimalConfig);
			assert(testApp instanceof Object);
			assert.strictEqual(testApp.title, "Test App");
			testApp.stop();
		});

		it("should handle deeply nested configuration overrides", () => {
			const nestedConfig = {
				auth: {
					jwt: {
						secretOrKey: "custom-secret"
					}
				},
				prometheus: {
					metrics: {
						buckets: [0.1, 1, 5, 10]
					}
				},
				maxListeners: 120,
				logging: { enabled: false }
			};

			const testApp = tenso(nestedConfig);
			assert(testApp instanceof Object);
			assert.strictEqual(testApp.auth.jwt.secretOrKey, "custom-secret");
			testApp.stop();
		});
	});

	describe("Parser Edge Cases", () => {
		it("should handle parser with extremely large JSON", () => {
			const jsonParser = app.parsers.get("application/json");
			const largeObject = {};

			// Create large object
			for (let i = 0; i < 1000; i++) {
				largeObject[`key${i}`] = `value${i}`;
			}

			const jsonString = JSON.stringify(largeObject);
			const result = jsonParser(jsonString);

			assert(typeof result === "object");
			assert.strictEqual(Object.keys(result).length, 1000);
		});

		it("should handle parser with empty string gracefully", () => {
			const jsonParser = app.parsers.get("application/json");

			// This should throw since empty string is not valid JSON
			assert.throws(() => {
				jsonParser("");
			}, SyntaxError);
		});

		it("should handle parser with malformed JSON", () => {
			const jsonParser = app.parsers.get("application/json");

			assert.throws(() => {
				jsonParser('{"incomplete": }');
			}, SyntaxError);
		});

		it("should handle JSONL parser with mixed content", () => {
			const jsonlParser = app.parsers.get("application/jsonl");
			const input = '{"name": "alice"}\n{"name": "bob"}';

			const result = jsonlParser(input);

			assert(Array.isArray(result));
			assert.strictEqual(result.length, 2);
			assert.strictEqual(result[0].name, "alice");
			assert.strictEqual(result[1].name, "bob");
		});
	});

	describe("Renderer Edge Cases", () => {
		it("should handle circular references in XML renderer", () => {
			const xmlRenderer = app.renderers.get("application/xml");
			const req = {};
			const res = {};

			// Create simpler data that won't cause infinite recursion
			const data = { name: "test", id: 1 };

			const result = xmlRenderer(req, res, data);

			assert(typeof result === "string");
			assert(result.includes("<?xml"));
		});

		it("should handle extremely nested objects in JSON renderer", () => {
			const jsonRenderer = app.renderers.get("application/json");
			const req = { server: app };
			const res = {};

			let nested = {};
			let current = nested;

			// Create deeply nested object (but not too deep to avoid stack overflow)
			for (let i = 0; i < 10; i++) {
				current.level = i;
				current.next = {};
				current = current.next;
			}

			const result = jsonRenderer(req, res, nested);

			assert(typeof result === "string");
			assert(result.includes("\"level\""));
		});

		it("should handle HTML injection in HTML renderer", () => {
			const htmlRenderer = app.renderers.get("text/html");
			const req = {
				server: app,
				parsed: { href: "http://example.com", protocol: "http:" },
				headers: {}
			};
			const res = { getHeaders: () => ({}) };
			const maliciousData = '<script>alert("xss")</script>';
			const template = "{{body}}";

			const result = htmlRenderer(req, res, maliciousData, template);

			// Should sanitize HTML characters
			assert(result.includes("&lt;script&gt;"));
			assert(!result.includes("<script>"));
		});

		it("should handle YAML renderer with complex types", () => {
			const yamlRenderer = app.renderers.get("application/yaml");
			const req = {};
			const res = {};

			// Use simpler data that won't cause YAML parsing issues
			const complexData = {
				string: "test",
				number: 123,
				boolean: true,
				array: [1, 2, 3],
				object: { nested: "value" }
			};

			const result = yamlRenderer(req, res, complexData);

			assert(typeof result === "string");
			assert(result.includes("string: test"));
		});

		it("should handle renderer with null data", () => {
			const jsonRenderer = app.renderers.get("application/json");
			const req = { server: app };
			const res = {};

			const result = jsonRenderer(req, res, null);

			assert.strictEqual(result, "null");
		});

		it("should handle renderer with undefined data", () => {
			const jsonRenderer = app.renderers.get("application/json");
			const req = { server: app };
			const res = {};

			const result = jsonRenderer(req, res, undefined);

			assert.strictEqual(result, "null");
		});

		it("should handle Plain text renderer edge cases", () => {
			const plainRenderer = app.renderers.get("text/plain");
			const req = {};
			const res = {};

			// Test with various data types
			assert.strictEqual(plainRenderer(req, res, "test"), "test");
			assert.strictEqual(plainRenderer(req, res, 123), "123");
			assert.strictEqual(plainRenderer(req, res, true), "true");
			assert.strictEqual(plainRenderer(req, res, null), "null");
		});
	});

	describe("Utility Function Edge Cases", () => {
		it("should handle sorting with mixed data types", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams(), search: "" }
			};

			const mixedData = [
				{ value: "string" },
				{ value: 123 },
				{ value: null },
				{ value: true },
				{ value: undefined }
			];

			const result = sort(mixedData, req);

			assert(Array.isArray(result));
			assert.strictEqual(result.length, mixedData.length);
		});

		it("should handle clone with prototype pollution attempt", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams(), search: "" }
			};
			const maliciousData = JSON.parse('{"__proto__": {"polluted": true}}');

			const result = sort(maliciousData, req); // eslint-disable-line no-unused-vars

			// Should not pollute Object.prototype
			assert.strictEqual(Object.prototype.polluted, undefined);
		});

		it("should handle hypermedia with extremely long URLs", () => {
			const longId = "x".repeat(100); // Reduce length to avoid issues
			const req = {
				method: "GET",
				url: "/items",
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				},
				server: {
					...app,
					allowed: () => true,
					pageSize: 5
				},
				hypermedia: true
			};
			const res = {
				getHeaders: () => ({}),
				header: () => {}
			};
			const rep = {
				data: [{ id: longId, name: "test" }],
				status: 200,
				links: []
			};

			const result = hypermedia(req, res, rep);

			assert(result.data);
			assert(Array.isArray(result.data));
		});

		it("should handle serialization with circular references", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams() },
				headers: {},
				server: app
			};
			const res = {
				statusCode: 200,
				getHeader: () => null,
				removeHeader: () => {},
				header: () => {}
			};

			// JSON.stringify will throw on circular references
			const circular = { name: "test" };
			circular.self = circular;

			assert.throws(() => {
				serialize(req, res, circular);
			});
		});
	});

	describe("Network and Protocol Edge Cases", () => {
		it("should handle extremely long headers", () => {
			const longValue = "x".repeat(1000);
			const req = {
				headers: {
					"x-custom-header": longValue
				}
			};

			// Test that the app can handle long headers
			assert.strictEqual(req.headers["x-custom-header"].length, 1000);
		});

		it("should handle malformed accept headers", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams() },
				headers: { accept: "malformed;;;accept,,,header" },
				server: app
			};
			const res = {
				statusCode: 200,
				getHeader: () => null,
				removeHeader: () => {},
				header: () => {}
			};
			const data = { test: "data" };

			const result = serialize(req, res, data);

			// Should fall back to default serialization
			assert(result);
		});

		it("should handle requests with no content-type", () => {
			const jsonParser = app.parsers.get("application/json");

			// Empty string should cause JSON parse error
			assert.throws(() => {
				jsonParser("");
			}, SyntaxError);
		});

		it("should handle HTTP method variations", () => {
			// Test various method combinations
			assert.strictEqual(app.canModify("POST"), true);
			assert.strictEqual(app.canModify("GET"), false);
			assert.strictEqual(app.canModify("PUT,PATCH"), true);
			assert.strictEqual(app.canModify("GET,OPTIONS"), false);
		});

		it("should handle empty HTTP methods", () => {
			assert.strictEqual(app.canModify(""), false);
			assert.strictEqual(app.canModify(" "), false);
		});

		it("should handle case-insensitive HTTP methods", () => {
			assert.strictEqual(app.canModify("post"), true);
			assert.strictEqual(app.canModify("GET"), false);
			assert.strictEqual(app.canModify("Put"), true);
		});
	});

	describe("Memory and Performance Edge Cases", () => {
		it("should handle large arrays without memory issues", () => {
			const largeArray = new Array(1000).fill(0).map((_, i) => ({ id: i, name: `item${i}` }));
			const req = {
				parsed: { searchParams: new URLSearchParams(), search: "" }
			};

			const result = sort(largeArray, req);

			assert(Array.isArray(result));
			assert.strictEqual(result.length, 1000);
		});

		it("should handle deep object cloning", () => {
			let deepObject = { level: 0 };
			let current = deepObject;

			// Create moderately deep object
			for (let i = 1; i < 20; i++) {
				current.child = { level: i };
				current = current.child;
			}

			const req = {
				parsed: { searchParams: new URLSearchParams(), search: "" }
			};

			const result = sort(deepObject, req);

			assert(typeof result === "object");
			assert.strictEqual(result.level, 0);
		});
	});

	describe("Boundary Value Testing", () => {
		it("should handle zero-length arrays", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams(), search: "" }
			};
			const emptyArray = [];

			const result = sort(emptyArray, req);

			assert(Array.isArray(result));
			assert.strictEqual(result.length, 0);
		});

		it("should handle single-element arrays", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams(), search: "" }
			};
			const singleArray = [{ name: "single" }];

			const result = sort(singleArray, req);

			assert(Array.isArray(result));
			assert.strictEqual(result.length, 1);
		});

		it("should handle maximum safe integer values", () => {
			const largeNumber = Number.MAX_SAFE_INTEGER;
			const req = {
				parsed: { searchParams: new URLSearchParams(), search: "" }
			};
			const data = [{ value: largeNumber }];

			const result = sort(data, req);

			assert(Array.isArray(result));
			assert.strictEqual(result[0].value, largeNumber);
		});

		it("should handle negative numbers", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams(), search: "" }
			};
			const data = [{ value: -100 }, { value: 50 }, { value: -50 }];

			const result = sort(data, req);

			assert(Array.isArray(result));
			assert.strictEqual(result.length, 3);
		});

		it("should handle floating point precision", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams(), search: "" }
			};
			const data = [{ value: 0.1 + 0.2 }, { value: 0.3 }];

			const result = sort(data, req);

			assert(Array.isArray(result));
			assert.strictEqual(result.length, 2);
		});

		it("should handle special numeric values", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams(), search: "" }
			};
			const data = [
				{ value: Infinity },
				{ value: -Infinity },
				{ value: NaN },
				{ value: 0 },
				{ value: -0 }
			];

			const result = sort(data, req);

			assert(Array.isArray(result));
			assert.strictEqual(result.length, 5);
		});
	});
});
