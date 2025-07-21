import assert from "node:assert";
import { describe, it, beforeEach } from "mocha";
import { tenso } from "../../dist/tenso.js";
// Import utility functions that tests are trying to use
import { sort } from "../../src/utils/sort.js";
import { serialize } from "../../src/utils/serialize.js";
import { hypermedia } from "../../src/utils/hypermedia.js";
import { clone } from "../../src/utils/clone.js";
import { explode } from "../../src/utils/explode.js";
import { id } from "../../src/utils/id.js";
import { marshal } from "../../src/utils/marshal.js";

describe("Utility Functions", () => {
	let app;

	beforeEach(() => {
		app = tenso({ maxListeners: 60, logging: { enabled: false } });
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

		// Enhanced clone tests from coverage-completion.test.js
		it("should handle Date objects (enhanced)", () => {
			const date = new Date("2024-01-01");
			const result = clone(date);

			assert(result instanceof Date);
			assert.strictEqual(result.getTime(), date.getTime());
			assert.notStrictEqual(result, date);
		});

		it("should handle RegExp objects", () => {
			const regex = /test/gi;
			const result = clone(regex);

			assert(result instanceof RegExp);
			assert.strictEqual(result.source, regex.source);
			assert.strictEqual(result.flags, regex.flags);
			assert.notStrictEqual(result, regex);
		});

		it("should handle Map objects", () => {
			const map = new Map([["key1", "value1"], ["key2", { nested: true }]]);
			const result = clone(map);

			assert(result instanceof Map);
			assert.strictEqual(result.get("key1"), "value1");
			assert.deepStrictEqual(result.get("key2"), { nested: true });
			assert.notStrictEqual(result, map);
			assert.notStrictEqual(result.get("key2"), map.get("key2"));
		});

		it("should handle Map objects with functions and undefined values", () => {
			const map = new Map([
				["key1", "value1"],
				["key2", function () { return "test"; }],
				["key3", undefined]
			]);
			const result = clone(map);

			assert(result instanceof Map);
			assert.strictEqual(result.get("key1"), "value1");
			assert.strictEqual(result.size, 1); // Functions and undefined should be filtered out
		});

		it("should handle Set objects", () => {
			const set = new Set([1, "test", { nested: true }]);
			const result = clone(set);

			assert(result instanceof Set);
			assert(result.has(1));
			assert(result.has("test"));
			assert.strictEqual(result.size, 3);
			assert.notStrictEqual(result, set);
		});

		it("should handle Set objects with functions and undefined values", () => {
			const set = new Set([1, function () { return "test"; }, undefined, "valid"]);
			const result = clone(set);

			assert(result instanceof Set);
			assert(result.has(1));
			assert(result.has("valid"));
			assert.strictEqual(result.size, 2); // Functions and undefined should be filtered out
		});

		it("should handle circular references", () => {
			const obj = { name: "test" };
			obj.self = obj;

			const result = clone(obj);

			assert.strictEqual(result.name, "test");
			assert.strictEqual(result.self, result);
			assert.notStrictEqual(result, obj);
		});

		it("should handle functions in arrays by converting to null", () => {
			const arr = [1, function () { return "test"; }, "valid"];
			const result = clone(arr);

			assert.deepStrictEqual(result, [1, null, "valid"]);
		});

		it("should handle undefined in arrays by converting to null", () => {
			const arr = [1, undefined, "valid"];
			const result = clone(arr);

			assert.deepStrictEqual(result, [1, null, "valid"]);
		});

		it("should handle functions in objects by filtering them out", () => {
			const obj = {
				name: "test",
				func: function () { return "test"; },
				value: 123
			};
			const result = clone(obj);

			assert.deepStrictEqual(result, { name: "test", value: 123 });
		});

		it("should handle undefined values in objects by filtering them out", () => {
			const obj = {
				name: "test",
				undef: undefined,
				value: 123
			};
			const result = clone(obj);

			assert.deepStrictEqual(result, { name: "test", value: 123 });
		});

		it("should handle custom class instances as plain objects", () => {
			class CustomClass {
				constructor (value) {
					this.value = value;
				}
			}

			const customInstance = new CustomClass("test");
			const result = clone(customInstance);

			// Custom classes are treated as plain objects and cloned
			assert.deepStrictEqual(result, { value: "test" });
			assert.notStrictEqual(result, customInstance);
			assert(!(result instanceof CustomClass));
		});

		it("should handle complex nested structures", () => {
			const complex = {
				array: [1, { nested: new Date("2024-01-01") }, new Set([1, 2])],
				map: new Map([["key", new RegExp("test")]]),
				date: new Date("2024-01-01"),
				regex: /test/g
			};

			const result = clone(complex);

			assert.notStrictEqual(result, complex);
			assert.notStrictEqual(result.array, complex.array);
			assert.notStrictEqual(result.array[1], complex.array[1]);
			assert(result.array[1].nested instanceof Date);
			assert(result.array[2] instanceof Set);
			assert(result.map instanceof Map);
			assert(result.date instanceof Date);
			assert(result.regex instanceof RegExp);
		});
	});

	describe("Explode Function", () => {
		it("should handle null argument", () => {
			const result = explode(null);
			assert.deepStrictEqual(result, [""]);
		});

		it("should handle undefined argument", () => {
			const result = explode(undefined);
			assert.deepStrictEqual(result, [""]);
		});

		it("should handle null delimiter", () => {
			const result = explode("a,b,c", null);
			assert.deepStrictEqual(result, ["a", "b", "c"]);
		});

		it("should handle undefined delimiter", () => {
			const result = explode("a,b,c", undefined);
			assert.deepStrictEqual(result, ["a", "b", "c"]);
		});

		it("should handle non-string delimiter", () => {
			const result = explode("a,b,c", 123);
			assert.deepStrictEqual(result, ["a", "b", "c"]);
		});

		it("should handle special regex characters in delimiter", () => {
			const result = explode("a|b|c", "|");
			assert.deepStrictEqual(result, ["a", "b", "c"]);
		});

		it("should handle regex metacharacters in delimiter", () => {
			const result = explode("a.b.c", ".");
			assert.deepStrictEqual(result, ["a", "b", "c"]);
		});

		it("should handle complex regex characters in delimiter", () => {
			const result = explode("a[]b[]c", "[]");
			assert.deepStrictEqual(result, ["a", "b", "c"]);
		});

		it("should handle custom delimiter with whitespace trimming", () => {
			const result = explode("a ; b ; c", ";");
			assert.deepStrictEqual(result, ["a", "b", "c"]);
		});
	});

	describe("ID Function", () => {
		it("should reject strings with whitespace", () => {
			assert.strictEqual(id("user id"), false);
			assert.strictEqual(id("user\tid"), false);
			assert.strictEqual(id("user\nid"), false);
		});

		it("should reject strings with dashes", () => {
			assert.strictEqual(id("user-id"), false);
		});

		it("should reject strings with dots", () => {
			assert.strictEqual(id("user.id"), false);
		});

		it("should reject strings with at symbols", () => {
			assert.strictEqual(id("user@id"), false);
		});

		it("should accept valid id patterns", () => {
			assert.strictEqual(id("id"), true);
			assert.strictEqual(id("userId"), true);
			assert.strictEqual(id("user_id"), true);
		});

		it("should reject empty strings", () => {
			assert.strictEqual(id(""), false);
		});

		it("should handle default parameter", () => {
			assert.strictEqual(id(), false);
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

		// Enhanced sort tests from coverage-completion.test.js
		it("should handle arrays with undefined values using structuredClone", () => {
			const req = {
				parsed: {
					searchParams: new URLSearchParams(),
					search: "string"
				}
			};
			const data = [{ name: "a" }, undefined, { name: "b" }];
			const result = sort(data, req);

			assert.deepStrictEqual(result, data);
			assert.notStrictEqual(result, data);
		});

		it("should handle missing search property", () => {
			const req = {
				parsed: {
					searchParams: new URLSearchParams()
					// search property missing
				}
			};
			const data = [{ name: "b" }, { name: "a" }];
			const result = sort(data, req);

			assert.deepStrictEqual(result, data);
		});

		it("should handle non-string search property", () => {
			const req = {
				parsed: {
					searchParams: new URLSearchParams(),
					search: 123
				}
			};
			const data = [{ name: "b" }, { name: "a" }];
			const result = sort(data, req);

			assert.deepStrictEqual(result, data);
		});

		it("should handle desc parameter alone", () => {
			const searchParams = new URLSearchParams();
			searchParams.append("order_by", "desc");
			const req = {
				parsed: {
					searchParams,
					search: "?order_by=desc"
				}
			};
			const data = [1, 2, 3];
			const result = sort(data, req);

			// For primitive arrays, sort returns cloned data without sorting
			assert.deepStrictEqual(result, [1, 2, 3]);
		});

		it("should handle desc parameter after field names", () => {
			const searchParams = new URLSearchParams();
			searchParams.append("order_by", "name");
			searchParams.append("order_by", "age");
			searchParams.append("order_by", "desc");
			const req = {
				parsed: {
					searchParams,
					search: "?order_by=name&order_by=age&order_by=desc"
				}
			};
			const data = [{ name: "a", age: 30 }, { name: "b", age: 25 }];
			const result = sort(data, req);

			assert.strictEqual(result[0].age, 25);
			assert.strictEqual(result[1].age, 30);
		});

		it("should handle empty order_by values", () => {
			const searchParams = new URLSearchParams();
			searchParams.append("order_by", "");
			searchParams.append("order_by", "name");
			searchParams.append("order_by", "  ");
			const req = {
				parsed: {
					searchParams,
					search: "?order_by=&order_by=name&order_by="
				}
			};
			const data = [{ name: "b" }, { name: "a" }];
			const result = sort(data, req);

			assert.strictEqual(result[0].name, "a");
			assert.strictEqual(result[1].name, "b");
		});

		it("should handle null array elements", () => {
			const req = {
				parsed: {
					searchParams: new URLSearchParams(),
					search: "string"
				}
			};
			const data = [null, null];
			const result = sort(data, req);

			assert.deepStrictEqual(result, data);
		});

		it("should handle boolean array elements", () => {
			const req = {
				parsed: {
					searchParams: new URLSearchParams(),
					search: "string"
				}
			};
			const data = [true, false];
			const result = sort(data, req);

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

			// Plain serializer returns original data directly
			assert(result && typeof result === "object");
			assert.strictEqual(result.name, "test");
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

			// Plain serializer returns original data directly
			assert(result && typeof result === "object");
			assert.strictEqual(result.name, "test");
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

		// Enhanced serialize tests from coverage-completion.test.js
		it("should handle unknown mime types", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams() },
				headers: { accept: "application/unknown" },
				server: {
					mimeType: "application/json",
					logging: { stackWire: false }
				}
			};
			const res = {
				statusCode: 200,
				getHeader: () => null,
				removeHeader: () => {},
				header: () => {}
			};
			const data = { name: "test" };
			const result = serialize(req, res, data);

			// Should fall back to default JSON format
			assert(result);
		});

		it("should handle error with stack trace enabled", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams() },
				headers: {},
				server: {
					mimeType: "application/json",
					logging: { stackWire: true }
				}
			};
			const res = {
				statusCode: 500,
				getHeader: () => null,
				removeHeader: () => {},
				header: () => {}
			};
			const error = new Error("Test error");
			const result = serialize(req, res, error);

			assert(result.error);
			assert(result.error.includes("Error: Test error"));
		});

		it("should handle status codes below 400 with error objects", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams() },
				headers: {},
				server: {
					mimeType: "application/json",
					logging: { stackWire: false }
				}
			};
			const res = {
				statusCode: 200, // Status < 400 but arg is Error
				getHeader: () => null,
				removeHeader: () => {},
				header: () => {}
			};
			const error = new Error("Test error");
			const result = serialize(req, res, error);

			// Should use 500 as fallback status
			assert.strictEqual(result.status, 500);
		});

		it("should handle content-type from response header", () => {
			const req = {
				parsed: { searchParams: new URLSearchParams() },
				headers: {},
				server: {
					mimeType: "application/json",
					logging: { stackWire: false }
				}
			};
			const res = {
				statusCode: 200,
				getHeader: header => header === "content-type" ? "text/plain" : null,
				removeHeader: () => {},
				header: () => {}
			};
			const data = { name: "test" };
			const result = serialize(req, res, data);

			assert(result);
		});
	});

	describe("Marshal Function", () => {
		it("should handle objects with absolute URIs", () => {
			const obj = {
				id: 1,
				website_url: "https://example.com/user/1"
			};
			const seen = new Set();
			const links = [];
			const server = { allowed: () => true };

			const result = marshal(obj, "item", "users", "http://localhost/users", seen, links, server);

			assert.strictEqual(result, obj);
			// Absolute URIs shouldn't generate links
			assert.strictEqual(links.length, 1); // Only the id should generate a link
		});

		it("should handle undefined and null values", () => {
			const obj = {
				id: 1,
				nullValue: null,
				undefinedValue: undefined,
				name: "test"
			};
			const seen = new Set();
			const links = [];
			const server = { allowed: () => true };

			const result = marshal(obj, "item", "users", "http://localhost/users", seen, links, server);

			assert.strictEqual(result, obj);
			assert.strictEqual(links.length, 1); // Only id should generate link
		});

		it("should handle empty objects", () => {
			const obj = {};
			const seen = new Set();
			const links = [];
			const server = { allowed: () => true };

			const result = marshal(obj, "item", "users", "http://localhost/users", seen, links, server);

			assert.strictEqual(result, null);
		});

		it("should handle URL-like properties with plural to singular conversion", () => {
			const obj = {
				category_url: "electronics",
				categories_url: "all-categories"
			};
			const seen = new Set();
			const links = [];
			const server = { allowed: () => true };

			const result = marshal(obj, "related", "items", "http://localhost/items", seen, links, server);

			assert.strictEqual(result, obj);
			assert(links.length > 0);
		});

		it("should handle properties ending with 'y' converted to 'ies'", () => {
			const obj = {
				category_url: "tech"
			};
			const seen = new Set();
			const links = [];
			const server = { allowed: () => true };

			const result = marshal(obj, "related", "items", "http://localhost/items", seen, links, server);

			assert.strictEqual(result, obj);
		});

		it("should avoid duplicate URIs using seen set", () => {
			const obj = {
				id: 1,
				user_id: 1 // Same value as id
			};
			const seen = new Set();
			const links = [];
			const server = { allowed: () => true };

			const result = marshal(obj, "item", "users", "http://localhost/users", seen, links, server);

			assert.strictEqual(result, obj);
			// Should only have one link despite two ID-like properties with same value
			assert.strictEqual(links.length, 1);
		});

		it("should handle server.allowed returning false", () => {
			const obj = {
				id: 1
			};
			const seen = new Set();
			const links = [];
			const server = { allowed: () => false }; // Not allowed

			const result = marshal(obj, "item", "users", "http://localhost/users", seen, links, server);

			assert.strictEqual(result, obj);
			assert.strictEqual(links.length, 0); // No links should be generated
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

		// Enhanced hypermedia tests from coverage-completion.test.js
		it("should handle root pathname that is not slash", () => {
			const req = {
				url: "/api/users/123/posts",
				method: "GET",
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				},
				server: {
					pageSize: 5,
					allowed: (method, path) => path === "/api/users" || path === "/api/users/123"
				},
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

			assert(result.links);
		});

		it("should handle non-GET methods", () => {
			const req = {
				url: "/users",
				method: "POST",
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				},
				server: {
					pageSize: 5,
					allowed: () => true
				},
				hypermedia: true
			};
			const res = {
				getHeaders: () => ({}),
				header: () => {}
			};
			const rep = {
				data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
				status: 201,
				links: []
			};

			const result = hypermedia(req, res, rep);

			// Should not do pagination for non-GET methods
			assert.strictEqual(result.data.length, 10);
		});

		it("should handle status codes outside 200-206 range", () => {
			const req = {
				url: "/users",
				method: "GET",
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				},
				server: {
					pageSize: 5,
					allowed: () => true
				},
				hypermedia: true
			};
			const res = {
				getHeaders: () => ({}),
				header: () => {}
			};
			const rep = {
				data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
				status: 400,
				links: []
			};

			const result = hypermedia(req, res, rep);

			// Should not do pagination for error status codes
			assert.strictEqual(result.data.length, 10);
		});

		it("should handle existing link headers", () => {
			const req = {
				url: "/users",
				method: "GET",
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				},
				server: {
					pageSize: 5,
					allowed: () => true
				},
				hypermedia: true,
				hypermediaHeader: true
			};
			const res = {
				getHeaders: () => ({ link: '</other>; rel="other"' }),
				header: () => {}
			};
			const rep = {
				data: [1, 2, 3],
				status: 200,
				links: []
			};

			const result = hypermedia(req, res, rep);

			assert(result.links.some(link => link.rel === "other"));
		});

		it("should handle array data with string elements", () => {
			const req = {
				url: "/users",
				method: "GET",
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				},
				server: {
					pageSize: 5,
					allowed: (method, uri) => uri.includes("user") || uri === "/users"
				},
				hypermedia: true
			};
			const res = {
				getHeaders: () => ({}),
				header: () => {}
			};
			const rep = {
				data: ["user1", "user2", "/users/absolute"],
				status: 200,
				links: []
			};

			const result = hypermedia(req, res, rep);

			assert(result.links);
		});

		it("should handle object data with parent URL calculation", () => {
			const req = {
				url: "/users/123/posts/456",
				method: "GET",
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				},
				server: {
					pageSize: 5,
					allowed: () => true
				},
				hypermedia: true
			};
			const res = {
				getHeaders: () => ({}),
				header: () => {}
			};
			const rep = {
				data: { id: 456, title: "Test Post" },
				status: 200,
				links: []
			};

			const result = hypermedia(req, res, rep);

			assert(result.data);
		});

		it("should handle single level parent URL", () => {
			const req = {
				url: "/users/123",
				method: "GET",
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				},
				server: {
					pageSize: 5,
					allowed: () => true
				},
				hypermedia: true
			};
			const res = {
				getHeaders: () => ({}),
				header: () => {}
			};
			const rep = {
				data: { id: 123, name: "Test User" },
				status: 200,
				links: []
			};

			const result = hypermedia(req, res, rep);

			assert(result.data);
		});

		it("should handle hypermediaHeader disabled", () => {
			const req = {
				url: "/users",
				method: "GET",
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				},
				server: {
					pageSize: 5,
					allowed: () => true
				},
				hypermedia: true,
				hypermediaHeader: false
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

			assert(result.links);
		});

		it("should handle pagination with last page calculation", () => {
			const page = new URLSearchParams();
			page.set("page", "1");
			page.set("page_size", "3");
			const req = {
				url: "/users",
				method: "GET",
				parsed: {
					searchParams: page,
					search: "?page=1&page_size=3"
				},
				server: {
					pageSize: 5,
					allowed: () => true
				},
				hypermedia: true
			};
			const res = {
				getHeaders: () => ({}),
				header: () => {}
			};
			const rep = {
				data: [1, 2, 3, 4, 5, 6, 7, 8, 9],
				status: 200,
				links: []
			};

			const result = hypermedia(req, res, rep);

			// Should have pagination links
			assert(result.links.some(link => link.rel === "next"));
			assert(result.links.some(link => link.rel === "last"));
		});

		it("should handle middle page pagination", () => {
			const page = new URLSearchParams();
			page.set("page", "2");
			page.set("page_size", "2");
			const req = {
				url: "/users",
				method: "GET",
				parsed: {
					searchParams: page,
					search: "?page=2&page_size=2"
				},
				server: {
					pageSize: 5,
					allowed: () => true
				},
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

			// Should have first, prev, and next links (but not last since page+1 < nth)
			assert(result.links.some(link => link.rel === "first"));
			assert(result.links.some(link => link.rel === "prev"));
			assert(result.links.some(link => link.rel === "next"));
		});

		it("should handle rep.links being undefined", () => {
			const req = {
				url: "/users",
				method: "GET",
				parsed: {
					searchParams: new URLSearchParams(),
					search: ""
				},
				server: {
					pageSize: 5,
					allowed: () => true
				},
				hypermedia: true
			};
			const res = {
				getHeaders: () => ({}),
				header: () => {}
			};
			const rep = {
				data: [1, 2, 3],
				status: 200
				// links property missing
			};

			const result = hypermedia(req, res, rep);

			// Should still process without error
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
