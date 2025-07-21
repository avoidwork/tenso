import assert from "node:assert";
import { describe, it, beforeEach } from "mocha";
import { tenso } from "../../dist/tenso.js";

describe("Renderers", () => {
	let app;

	beforeEach(() => {
		app = tenso({ maxListeners: 60, logging: { enabled: false } });
	});

	describe("JSON Renderer", () => {
		let jsonRenderer;

		beforeEach(() => {
			jsonRenderer = app.renderers.get("application/json");
		});

		it("should render simple object", () => {
			const req = {
				server: app,
				headers: { accept: "application/json" }
			};
			const res = {};
			const data = { name: "test", value: 123 };

			const result = jsonRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			const parsed = JSON.parse(result);
			assert.deepStrictEqual(parsed, data);
		});

		it("should render array", () => {
			const req = {
				server: app,
				headers: { accept: "application/json" }
			};
			const res = {};
			const data = [1, 2, 3, "test"];

			const result = jsonRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			const parsed = JSON.parse(result);
			assert.deepStrictEqual(parsed, data);
		});

		it("should render null", () => {
			const req = {
				server: app,
				headers: { accept: "application/json" }
			};
			const res = {};

			const result = jsonRenderer(req, res, null);

			assert.strictEqual(result, "null");
		});

		it("should render undefined as null", () => {
			const req = {
				server: app,
				headers: { accept: "application/json" }
			};
			const res = {};

			const result = jsonRenderer(req, res, undefined);

			assert.strictEqual(result, "null");
		});

		it("should handle indentation from accept header", () => {
			const req = {
				headers: { accept: "application/json; indent=2" },
				server: app
			};
			const res = {};
			const data = { name: "test", nested: { value: 123 } };

			const result = jsonRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			assert(result.includes("\n")); // Should be indented
			assert(result.includes("  ")); // Should have spaces
		});

		it("should use custom JSON indentation when configured", () => {
			const customApp = tenso({ jsonIndent: 2, maxListeners: 60, logging: { enabled: false } });
			const customJsonRenderer = customApp.renderers.get("application/json");
			const req = {
				server: customApp,
				headers: { accept: "application/json" }
			};
			const res = {};
			const data = { name: "test" };

			const result = customJsonRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			assert(result.includes("\n")); // Should be indented

			customApp.stop();
		});

		it("should handle primitive values", () => {
			const req = {
				server: app,
				headers: { accept: "application/json" }
			};
			const res = {};

			assert.strictEqual(jsonRenderer(req, res, "string"), '"string"');
			assert.strictEqual(jsonRenderer(req, res, 123), "123");
			assert.strictEqual(jsonRenderer(req, res, true), "true");
			assert.strictEqual(jsonRenderer(req, res, false), "false");
		});

		it("should handle complex nested objects", () => {
			const req = {
				server: app,
				headers: { accept: "application/json" }
			};
			const res = {};
			const data = {
				user: {
					id: 1,
					profile: {
						name: "John",
						preferences: {
							theme: "dark",
							notifications: true
						}
					}
				},
				items: [1, 2, { nested: true }]
			};

			const result = jsonRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			const parsed = JSON.parse(result);
			assert.deepStrictEqual(parsed, data);
		});
	});

	describe("YAML Renderer", () => {
		let yamlRenderer;

		beforeEach(() => {
			yamlRenderer = app.renderers.get("application/yaml");
		});

		it("should render simple object", () => {
			const req = {};
			const res = {};
			const data = { name: "test", value: 123 };

			const result = yamlRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			assert(result.includes("name: test"));
			assert(result.includes("value: 123"));
		});

		it("should render array", () => {
			const req = {};
			const res = {};
			const data = ["item1", "item2", "item3"];

			const result = yamlRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			assert(result.includes("- item1"));
		});

		it("should handle null", () => {
			const req = {};
			const res = {};

			const result = yamlRenderer(req, res, null);

			assert.strictEqual(typeof result, "string");
		});

		it("should handle nested objects", () => {
			const req = {};
			const res = {};
			const data = {
				user: {
					name: "test",
					settings: {
						theme: "dark"
					}
				}
			};

			const result = yamlRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			assert(result.includes("user:"));
			assert(result.includes("name: test"));
		});

		it("should handle boolean and numeric values", () => {
			const req = {};
			const res = {};
			const data = {
				active: true,
				disabled: false,
				count: 42,
				rate: 3.14
			};

			const result = yamlRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			assert(result.includes("active: true"));
			assert(result.includes("count: 42"));
		});
	});

	describe("XML Renderer", () => {
		let xmlRenderer;

		beforeEach(() => {
			xmlRenderer = app.renderers.get("application/xml");
		});

		it("should render simple object", () => {
			const req = {};
			const res = {};
			const data = { name: "test", value: 123 };

			const result = xmlRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			assert(result.includes("<?xml"));
			assert(result.includes("<n>test</n>"));
			assert(result.includes("<value>123</value>"));
		});

		it("should render array", () => {
			const req = {};
			const res = {};
			const data = ["item1", "item2"];

			const result = xmlRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			assert(result.includes("<?xml"));
		});

		it("should handle null", () => {
			const req = {};
			const res = {};

			const result = xmlRenderer(req, res, null);

			assert.strictEqual(typeof result, "string");
			assert(result.includes("<?xml"));
		});

		it("should handle simple values", () => {
			const req = {};
			const res = {};

			const result1 = xmlRenderer(req, res, "simple string");
			const result2 = xmlRenderer(req, res, 123);
			const result3 = xmlRenderer(req, res, true);

			assert(result1.includes("<?xml"));
			assert(result2.includes("<?xml"));
			assert(result3.includes("<?xml"));
		});

		it("should handle nested objects without infinite recursion", () => {
			const req = {};
			const res = {};
			const data = {
				user: {
					name: "test",
					id: 1
				}
			};

			const result = xmlRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			assert(result.includes("<?xml"));
		});
	});

	describe("Plain Text Renderer", () => {
		let plainRenderer;

		beforeEach(() => {
			plainRenderer = app.renderers.get("text/plain");
		});

		it("should render string", () => {
			const req = {};
			const res = {};
			const data = "Hello, World!";

			const result = plainRenderer(req, res, data);

			assert.strictEqual(result, "Hello, World!");
		});

		it("should render number", () => {
			const req = {};
			const res = {};
			const data = 123;

			const result = plainRenderer(req, res, data);

			assert.strictEqual(result, "123");
		});

		it("should render boolean", () => {
			const req = {};
			const res = {};

			assert.strictEqual(plainRenderer(req, res, true), "true");
			assert.strictEqual(plainRenderer(req, res, false), "false");
		});

		it("should handle null and undefined", () => {
			const req = {};
			const res = {};

			// Plain renderer should handle null by converting to string
			assert.strictEqual(plainRenderer(req, res, null), "");

			// undefined should be converted to string as well
			assert.strictEqual(plainRenderer(req, res, undefined), "");
		});

		it("should render object as string", () => {
			const req = {
				headers: { accept: "text/plain" }
			};
			const res = {};
			const data = { name: "test" };

			const result = plainRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			// Should stringify the object
			assert(result.includes("test"));
		});

		it("should render array as string", () => {
			const req = {};
			const res = {};
			const data = [1, 2, 3];

			const result = plainRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			assert(result.includes("1"));
		});
	});

	describe("CSV Renderer", () => {
		let csvRenderer;

		beforeEach(() => {
			csvRenderer = app.renderers.get("text/csv");
		});

		it("should render array of objects", () => {
			const req = { url: "/data.csv" };
			const res = { statusCode: 200, header: () => {} };
			const data = [
				{ name: "John", age: 30, city: "New York" },
				{ name: "Jane", age: 25, city: "Boston" }
			];

			const result = csvRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			assert(result.includes("name,age,city"));
			assert(result.includes("John,30,New York"));
			assert(result.includes("Jane,25,Boston"));
		});

		it("should handle empty array", () => {
			const req = { url: "/data.csv" };
			const res = { statusCode: 200, header: () => {} };
			const data = [];

			const result = csvRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
		});

		it("should handle single object", () => {
			const req = { url: "/data.csv" };
			const res = { statusCode: 200, header: () => {} };
			const data = { name: "John", age: 30 };

			const result = csvRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
		});

		it("should handle objects with different keys", () => {
			const req = { url: "/data.csv" };
			const res = { statusCode: 200, header: () => {} };
			const data = [
				{ name: "John", age: 30 },
				{ name: "Jane", city: "Boston" },
				{ age: 35, country: "USA" }
			];

			const result = csvRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
		});

		it("should handle null and undefined values", () => {
			const req = { url: "/data.csv" };
			const res = { statusCode: 200, header: () => {} };
			const data = [
				{ name: "John", age: null, city: undefined },
				{ name: "Jane", age: 25, city: "Boston" }
			];

			const result = csvRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
		});
	});

	describe("HTML Renderer", () => {
		let htmlRenderer;

		beforeEach(() => {
			htmlRenderer = app.renderers.get("text/html");
		});

		it("should render with template", () => {
			const template = "<html><body>{{body}}</body></html>";
			const req = {
				server: app,
				parsed: { href: "http://example.com", protocol: "http:" },
				headers: {}
			};
			const res = { getHeaders: () => ({}) };
			const data = { message: "Hello" };

			const result = htmlRenderer(req, res, data, template);

			assert.strictEqual(typeof result, "string");
			assert(result.includes("<html>"));
			assert(result.includes("Hello"));
		});

		it("should handle empty template", () => {
			const template = "";
			const req = {
				server: app,
				parsed: { href: "http://example.com", protocol: "http:" },
				headers: {}
			};
			const res = { getHeaders: () => ({}) };
			const data = { test: "data" };

			const result = htmlRenderer(req, res, data, template);

			assert.strictEqual(result, "");
		});

		it("should render data using template", () => {
			const template = "<div>{{body}}</div>";
			const req = {
				server: app,
				parsed: { href: "http://example.com", protocol: "http:" },
				headers: {}
			};
			const res = { getHeaders: () => ({}) };
			const data = { test: "data" };

			const result = htmlRenderer(req, res, data, template);

			assert.strictEqual(typeof result, "string");
			assert(result.includes("<div>"));
			// Should include the JSON representation of data
			assert(result.includes("data"));
		});

		it("should sanitize HTML in data", () => {
			const template = "{{body}}";
			const req = {
				server: app,
				parsed: { href: "http://example.com", protocol: "http:" },
				headers: {}
			};
			const res = { getHeaders: () => ({}) };
			const data = '<script>alert("xss")</script>';

			const result = htmlRenderer(req, res, data, template);

			assert(result.includes("&lt;script&gt;"));
			assert(!result.includes("<script>"));
		});

		it("should handle template placeholders", () => {
			const template = "{{title}} - {{version}} - {{url}}";
			const req = {
				server: app,
				parsed: { href: "http://example.com", protocol: "http:" },
				headers: {}
			};
			const res = { getHeaders: () => ({}) };
			const data = {};

			const result = htmlRenderer(req, res, data, template);

			assert.strictEqual(typeof result, "string");
			assert(result.includes(app.title));
			assert(result.includes(app.version));
		});
	});

	describe("JavaScript Renderer", () => {
		let jsRenderer;

		beforeEach(() => {
			jsRenderer = app.renderers.get("application/javascript");
		});

		it("should render data as JSONP callback", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams("callback=myCallback") },
				headers: { accept: "application/javascript" }
			};
			const res = {
				header: () => {}
			};
			const data = { name: "test", value: 123 };

			const result = jsRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			assert(result.includes("myCallback"));
			assert(result.includes("name"));
			assert(result.includes("test"));
		});

		it("should handle missing callback parameter", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams() },
				headers: { accept: "application/javascript" }
			};
			const res = {
				header: () => {}
			};
			const data = { test: "data" };

			const result = jsRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			// Should have a default callback or just return JSON
		});

		it("should handle null data", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams("callback=test") },
				headers: { accept: "application/javascript" }
			};
			const res = {
				header: () => {}
			};

			const result = jsRenderer(req, res, null);

			assert.strictEqual(typeof result, "string");
			assert(result.includes("test"));
		});

		it("should handle complex data structures", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams("callback=processData") },
				headers: { accept: "application/javascript" }
			};
			const res = {
				header: () => {}
			};
			const data = {
				users: [
					{ id: 1, name: "John" },
					{ id: 2, name: "Jane" }
				],
				meta: { total: 2, page: 1 }
			};

			const result = jsRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			assert(result.includes("processData"));
			assert(result.includes("John"));
			assert(result.includes("Jane"));
		});
	});

	describe("JSONL Renderer", () => {
		let jsonlRenderer;

		beforeEach(() => {
			jsonlRenderer = app.renderers.get("application/jsonl");
		});

		it("should render array as JSON lines", () => {
			const req = {};
			const res = {};
			const data = [
				{ name: "Alice", age: 30 },
				{ name: "Bob", age: 25 },
				{ name: "Charlie", age: 35 }
			];

			const result = jsonlRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			const lines = result.trim().split("\n");
			assert.strictEqual(lines.length, 3);

			// Each line should be valid JSON
			lines.forEach(line => {
				const parsed = JSON.parse(line);
				assert.strictEqual(typeof parsed, "object");
			});
		});

		it("should handle single object", () => {
			const req = {};
			const res = {};
			const data = { name: "test", value: 123 };

			const result = jsonlRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			const parsed = JSON.parse(result.trim());
			assert.deepStrictEqual(parsed, data);
		});

		it("should handle empty array", () => {
			const req = {};
			const res = {};
			const data = [];

			const result = jsonlRenderer(req, res, data);

			assert.strictEqual(result.trim(), "[]");
		});

		it("should handle null", () => {
			const req = {};
			const res = {};

			// JSONL renderer expects array or object, so null will throw
			assert.throws(() => jsonlRenderer(req, res, null), Error);
		});

		it("should handle mixed data types in array", () => {
			const req = {};
			const res = {};
			const data = [
				{ name: "object" },
				{ type: "string", value: "test" },
				{ type: "number", value: 123 },
				{ type: "boolean", value: true },
				{ type: "null", value: null }
			];

			const result = jsonlRenderer(req, res, data);

			assert.strictEqual(typeof result, "string");
			const lines = result.trim().split("\n");
			assert.strictEqual(lines.length, 5);

			// Each line should be valid JSON
			assert.deepStrictEqual(JSON.parse(lines[0]), { name: "object" });
			assert.deepStrictEqual(JSON.parse(lines[1]), { type: "string", value: "test" });
			assert.deepStrictEqual(JSON.parse(lines[2]), { type: "number", value: 123 });
			assert.deepStrictEqual(JSON.parse(lines[3]), { type: "boolean", value: true });
			assert.deepStrictEqual(JSON.parse(lines[4]), { type: "null", value: null });
		});
	});

	describe("Renderer Registration", () => {
		it("should allow custom renderer registration", () => {
			const customRenderer = (req, res, data) => `Custom: ${data}`;
			app.renderer("text/custom", customRenderer);

			assert(app.renderers.has("text/custom"));
			assert.strictEqual(app.renderers.get("text/custom"), customRenderer);

			const result = customRenderer({}, {}, "test");
			assert.strictEqual(result, "Custom: test");
		});

		it("should override existing renderers", () => {
			const originalRenderer = app.renderers.get("application/json");
			const newRenderer = (req, res, data) => `Override: ${JSON.stringify(data)}`;

			app.renderer("application/json", newRenderer);

			assert.strictEqual(app.renderers.get("application/json"), newRenderer);
			assert.notStrictEqual(app.renderers.get("application/json"), originalRenderer);

			// Restore original renderer to prevent test pollution
			app.renderer("application/json", originalRenderer);
		});

		it("should have all expected default renderers", () => {
			const expectedRenderers = [
				"application/json",
				"application/yaml",
				"application/xml",
				"text/plain",
				"application/javascript",
				"text/csv",
				"text/html",
				"application/jsonl",
				"application/json-lines",
				"text/json-lines"
			];

			expectedRenderers.forEach(type => {
				assert(app.renderers.has(type), `Missing renderer: ${type}`);
				assert.strictEqual(typeof app.renderers.get(type), "function", `Renderer ${type} is not a function`);
			});
		});
	});
});
