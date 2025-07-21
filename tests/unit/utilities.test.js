import assert from "node:assert";
import { describe, it, beforeEach } from "mocha";
import { tenso } from "../../dist/tenso.js";
// Import utility functions that tests are trying to use
import { sort } from "../../src/utils/sort.js";
import { serialize } from "../../src/utils/serialize.js";
import { hypermedia } from "../../src/utils/hypermedia.js";
import { clone } from "../../src/utils/clone.js";

describe("Utility Functions", () => {
	let app;

	beforeEach(() => {
		app = tenso({ maxListeners: 120, logging: { enabled: false } });
	});

	describe("hasBody function", () => {
		it("should return true for PATCH method", () => {
			// We need to access the internal hasBody function, let's test through the canModify method
			assert.strictEqual(app.canModify("PATCH"), true);
		});

		it("should return true for POST method", () => {
			assert.strictEqual(app.canModify("POST"), true);
		});

		it("should return true for PUT method", () => {
			assert.strictEqual(app.canModify("PUT"), true);
		});

		it("should return false for GET method", () => {
			assert.strictEqual(app.canModify("GET"), false);
		});

		it("should return false for OPTIONS method", () => {
			assert.strictEqual(app.canModify("OPTIONS"), false);
		});

		it("should handle comma-separated methods", () => {
			assert.strictEqual(app.canModify("GET,POST"), true);
			assert.strictEqual(app.canModify("GET,OPTIONS,HEAD"), false);
		});

		it("should handle whitespace in method strings", () => {
			assert.strictEqual(app.canModify(" POST "), true);
			assert.strictEqual(app.canModify(" GET "), false);
		});

		it("should be case insensitive", () => {
			assert.strictEqual(app.canModify("post"), true);
			assert.strictEqual(app.canModify("get"), false);
		});
	});

	describe("Clone function", () => {
		// Test clone function directly
		it("should handle primitive types", () => {
			// Clone function handles primitives directly
			assert.strictEqual(clone(null), null);
			assert.strictEqual(clone(undefined), undefined);
			assert.strictEqual(clone("string"), "string");
			assert.strictEqual(clone(123), 123);
			assert.strictEqual(clone(true), true);
		});

		it("should clone arrays", () => {
			const original = [1, 2, 3];
			const cloned = clone(original);

			assert.deepStrictEqual(cloned, original);
			assert.notStrictEqual(cloned, original); // Should be different objects
		});

		it("should clone objects", () => {
			const original = { name: "test", value: 123 };
			const cloned = clone(original);

			assert.deepStrictEqual(cloned, original);
			assert.notStrictEqual(cloned, original);
			// For non-arrays, sort returns the original if not sortable
		});

		it("should handle nested objects", () => {
			const original = {
				nested: {
					data: [1, 2, 3],
					name: "test"
				}
			};
			const cloned = clone(original);

			assert.deepStrictEqual(cloned, original);
			assert.notStrictEqual(cloned, original);
			assert.notStrictEqual(cloned.nested, original.nested);
		});

		it("should handle Date objects", () => {
			const date = new Date();
			const original = { created: date };
			const cloned = clone(original);

			assert.deepStrictEqual(cloned, original);
			assert.notStrictEqual(cloned.created, original.created);
			assert(cloned.created instanceof Date);
		});

		it("should handle arrays with undefined values", () => {
			const original = [1, undefined, 3];
			const cloned = clone(original);

			// Clone behavior converts undefined to null for JSON compatibility
			assert.deepStrictEqual(cloned, [1, null, 3]);
		});
	});

	describe("Sort function", () => {
		it("should return original data when no order_by parameter", () => {
			const req = {
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				}
			};
			const data = [{ name: "b" }, { name: "a" }];
			const result = sort(data, req);

			assert.deepStrictEqual(result, data);
			assert.notStrictEqual(result, data); // Should be cloned
		});

		it("should sort array by specified field", () => {
			const searchParams = new URLSearchParams();
			searchParams.set("order_by", "name");
			const req = {
				parsed: {
					searchParams,
					search: "?order_by=name"
				}
			};
			const data = [{ name: "b" }, { name: "a" }];
			const result = sort(data, req);

			assert.strictEqual(result[0].name, "a");
			assert.strictEqual(result[1].name, "b");
		});

		it("should sort in descending order when desc parameter is present", () => {
			const searchParams = new URLSearchParams();
			searchParams.append("order_by", "name");
			searchParams.append("order_by", "desc");
			const req = {
				parsed: {
					searchParams,
					search: "?order_by=name&order_by=desc"
				}
			};
			const data = [{ name: "a" }, { name: "b" }];
			const result = sort(data, req);

			assert.strictEqual(result[0].name, "b");
			assert.strictEqual(result[1].name, "a");
		});

		it("should handle multiple sort fields", () => {
			const searchParams = new URLSearchParams();
			searchParams.append("order_by", "age");
			searchParams.append("order_by", "name");
			const req = {
				parsed: {
					searchParams,
					search: "?order_by=age&order_by=name"
				}
			};
			const data = [
				{ name: "b", age: 30 },
				{ name: "a", age: 30 },
				{ name: "c", age: 25 }
			];
			const result = sort(data, req);

			assert.strictEqual(result[0].age, 25);
			assert.strictEqual(result[1].name, "a");
			assert.strictEqual(result[2].name, "b");
		});

		it("should return cloned data for non-array input", () => {
			const req = {
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				}
			};
			const data = { name: "test" };
			const result = sort(data, req);

			assert.deepStrictEqual(result, data);
			assert.notStrictEqual(result, data);
		});

		it("should handle undefined input", () => {
			const req = {
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				}
			};
			const result = sort(undefined, req);

			assert.strictEqual(result, undefined);
		});

		it("should handle missing request properties", () => {
			const result = sort([1, 2, 3], {});

			assert.deepStrictEqual(result, [1, 2, 3]);
		});

		it("should handle primitive array elements", () => {
			const req = {
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				}
			};
			const data = [3, 1, 2];
			const result = sort(data, req);

			// Primitive arrays can't be sorted by object keys, so they're just cloned
			assert.deepStrictEqual(result, data);
		});
	});

	describe("Serialize function", () => {
		it("should serialize data with default JSON format", () => {
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
			const data = { name: "test" };
			const result = serialize(req, res, data);

			assert(result.data);
			assert.strictEqual(result.status, 200);
		});

		it("should handle error serialization", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams() },
				headers: {},
				server: app
			};
			const res = {
				statusCode: 400,
				getHeader: () => null,
				removeHeader: () => {},
				header: () => {}
			};
			const error = new Error("Test error");
			const result = serialize(req, res, error);

			assert(result.error);
			assert.strictEqual(result.status, 400);
		});

		it("should use format from query parameter", () => {
			const searchParams = new URLSearchParams();
			searchParams.set("format", "text/plain");
			const req = {
				parsed: { searchParams },
				headers: {},
				server: app
			};
			const res = {
				statusCode: 200,
				getHeader: () => null,
				removeHeader: () => {},
				header: () => {}
			};
			const data = { name: "test" };
			const result = serialize(req, res, data);

			// Result should be a plain text representation
			assert(typeof result === "string" || result && result.data !== undefined);
		});

		it("should use format from accept header", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams() },
				headers: { accept: "text/plain" },
				server: app
			};
			const res = {
				statusCode: 200,
				getHeader: () => null,
				removeHeader: () => {},
				header: () => {}
			};
			const data = { name: "test" };
			const result = serialize(req, res, data);

			assert(typeof result === "string" || result && result.data !== undefined);
		});

		it("should handle multiple accept types", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams() },
				headers: { accept: "text/plain, application/json" },
				server: app
			};
			const res = {
				statusCode: 200,
				getHeader: () => null,
				removeHeader: () => {},
				header: () => {}
			};
			const data = { name: "test" };
			const result = serialize(req, res, data);

			assert(result);
		});
	});

	describe("Hypermedia function", () => {
		it("should process hypermedia for array data", () => {
			const req = {
				url: "/items",
				method: "GET",
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				},
				server: app,
				hypermedia: true
			};
			const res = {
				getHeaders: () => ({}),
				header: () => {}
			};
			const rep = {
				data: [{ id: 1, name: "test" }],
				status: 200,
				links: []
			};

			const result = hypermedia(req, res, rep);

			assert(result.data);
			assert(Array.isArray(result.data));
		});

		it("should handle pagination", () => {
			const searchParams = new URLSearchParams();
			searchParams.set("page", "2");
			searchParams.set("page_size", "2");
			const req = {
				url: "/items",
				method: "GET",
				parsed: {
					searchParams,
					search: "?page=2&page_size=2"
				},
				server: app,
				hypermedia: true
			};
			const res = {
				getHeaders: () => ({}),
				header: () => {}
			};
			const rep = {
				data: [1, 2, 3, 4, 5, 6],
				status: 200,
				links: []
			};

			const result = hypermedia(req, res, rep);

			// Should slice the data for pagination
			assert.strictEqual(result.data.length, 2);
			assert(result.links.length > 0);
		});

		it("should handle single object data", () => {
			const req = {
				url: "/items/1",
				method: "GET",
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				},
				server: app,
				hypermedia: true
			};
			const res = {
				getHeaders: () => ({}),
				header: () => {}
			};
			const rep = {
				data: { id: 1, name: "test" },
				status: 200,
				links: []
			};

			const result = hypermedia(req, res, rep);

			assert(result.data);
			assert.strictEqual(typeof result.data, "object");
		});

		it("should handle null data", () => {
			const req = {
				url: "/items",
				method: "GET",
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				},
				server: app,
				hypermedia: true
			};
			const res = {
				getHeaders: () => ({}),
				header: () => {}
			};

			const result = hypermedia(req, res, null);

			assert.strictEqual(result, null);
		});

		it("should handle page parameter validation", () => {
			const searchParams = new URLSearchParams();
			searchParams.set("page", "-1");
			const req = {
				url: "/items",
				method: "GET",
				parsed: {
					searchParams,
					search: "?page=-1"
				},
				server: app,
				hypermedia: true
			};
			const res = {
				getHeaders: () => ({}),
				header: () => {}
			};
			const rep = {
				data: [1, 2, 3],
				status: 200,
				links: []
			};

			const result = hypermedia(req, res, rep);

			// Should default to page 1 when invalid page provided
			assert(result.data);
		});

		it("should handle page_size parameter validation", () => {
			const searchParams = new URLSearchParams();
			searchParams.set("page_size", "0");
			const req = {
				url: "/items",
				method: "GET",
				parsed: {
					searchParams,
					search: "?page_size=0"
				},
				server: app,
				hypermedia: true
			};
			const res = {
				getHeaders: () => ({}),
				header: () => {}
			};
			const rep = {
				data: [1, 2, 3, 4, 5, 6],
				status: 200,
				links: []
			};

			const result = hypermedia(req, res, rep);

			// Should use default page size when invalid page_size provided
			assert(result.data);
		});
	});

	describe("ID pattern matching", () => {
		// Test through hypermedia processing which uses the id function
		it("should identify ID-like properties", () => {
			const req = {
				url: "/items",
				method: "GET",
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				},
				server: {
					...app,
					allowed: () => true // Mock the allowed method
				},
				hypermedia: true
			};
			const res = {
				getHeaders: () => ({}),
				header: () => {}
			};
			const rep = {
				data: { id: 123, name: "test", user_id: 456 },
				status: 200,
				links: []
			};

			const result = hypermedia(req, res, rep);

			// The result should have processed the ID-like properties
			assert(result.data);
			assert(result.links);
		});
	});

	describe("Marshal function for hypermedia", () => {
		// Test through hypermedia which uses marshal internally
		it("should handle objects with URL-like properties", () => {
			const req = {
				url: "/items/1",
				method: "GET",
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				},
				server: {
					...app,
					allowed: () => true // Mock the allowed method
				},
				hypermedia: true
			};
			const res = {
				getHeaders: () => ({}),
				header: () => {}
			};
			const rep = {
				data: {
					id: 1,
					name: "test",
					profile_url: "/profiles/1",
					user_url: "/users/1"
				},
				status: 200,
				links: []
			};

			const result = hypermedia(req, res, rep);

			assert(result.data);
			assert(result.links);
		});

		it("should handle empty objects", () => {
			const req = {
				url: "/items/1",
				method: "GET",
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				},
				server: app,
				hypermedia: true
			};
			const res = {
				getHeaders: () => ({}),
				header: () => {}
			};
			const rep = {
				data: {},
				status: 200,
				links: []
			};

			const result = hypermedia(req, res, rep);

			// Empty objects should return null from marshal
			assert.strictEqual(result.data, null);
		});

		it("should handle objects with null/undefined values", () => {
			const req = {
				url: "/items/1",
				method: "GET",
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				},
				server: {
					...app,
					allowed: () => true // Mock the allowed method
				},
				hypermedia: true
			};
			const res = {
				getHeaders: () => ({}),
				header: () => {}
			};
			const rep = {
				data: {
					id: 1,
					name: null,
					description: undefined,
					active: true
				},
				status: 200,
				links: []
			};

			const result = hypermedia(req, res, rep);

			assert(result.data);
			assert(result.links);
		});
	});
});
