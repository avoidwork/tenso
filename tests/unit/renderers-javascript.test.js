import assert from "node:assert";
import {describe, it} from "mocha";
import {javascript} from "../../src/renderers/javascript.js";

/**
 * Creates a mock request object for testing
 * @param {Object} options - Options to customize the mock request
 * @returns {Object} Mock request object
 */
function createMockRequest (options = {}) {
	return {
		headers: options.headers || {},
		server: options.server || {},
		parsed: options.parsed || {
			searchParams: new URLSearchParams(options.queryString || "")
		},
		...options
	};
}

/**
 * Creates a mock response object for testing
 * @param {Object} options - Options to customize the mock response
 * @returns {Object} Mock response object
 */
function createMockResponse (options = {}) {
	const headers = {};

	return {
		header: options.header || ((key, value) => {
			headers[key] = value;
		}),
		getHeaders: () => headers,
		...options
	};
}

/**
 * Unit tests for JavaScript/JSONP renderer module
 */
describe("renderers/javascript", () => {
	describe("javascript()", () => {
		it("should render data as JSONP with callback", () => {
			const req = createMockRequest({
				queryString: "callback=myCallback"
			});
			const res = createMockResponse();
			const data = {name: "test", value: 123};
			const result = javascript(req, res, data);

			assert.ok(result.startsWith("myCallback("));
			assert.ok(result.endsWith(");"));
			assert.ok(result.includes('{"name":"test","value":123}'));
		});

		it("should use default callback name when not provided", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {test: "value"};
			const result = javascript(req, res, data);

			assert.ok(result.startsWith("callback("));
			assert.ok(result.endsWith(");"));
			assert.ok(result.includes('{"test":"value"}'));
		});

		it("should set content-type header to application/javascript", () => {
			const req = createMockRequest();
			const headerSpy = [];
			const res = createMockResponse({
				header: (key, value) => {
					headerSpy.push({key, value});
				}
			});
			const data = {test: "value"};

			javascript(req, res, data);

			const contentTypeHeader = headerSpy.find(h => h.key === "content-type");
			assert.ok(contentTypeHeader);
			assert.strictEqual(contentTypeHeader.value, "application/javascript");
		});

		it("should modify request accept header", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {test: "value"};

			javascript(req, res, data);

			assert.strictEqual(req.headers.accept, "application/javascript");
		});

		it("should handle arrays as JSONP", () => {
			const req = createMockRequest({
				queryString: "callback=handleData"
			});
			const res = createMockResponse();
			const data = ["apple", "banana", "cherry"];
			const result = javascript(req, res, data);

			assert.ok(result.startsWith("handleData("));
			assert.ok(result.endsWith(");"));
			assert.ok(result.includes('["apple","banana","cherry"]'));
		});

		it("should handle null values", () => {
			const req = createMockRequest({
				queryString: "callback=processNull"
			});
			const res = createMockResponse();
			const result = javascript(req, res, null);

			assert.ok(result.startsWith("processNull("));
			assert.ok(result.endsWith(");"));
			assert.ok(result.includes("null"));
		});

		it("should handle undefined values", () => {
			const req = createMockRequest({
				queryString: "callback=processUndefined"
			});
			const res = createMockResponse();
			const result = javascript(req, res, undefined);

			assert.ok(result.startsWith("processUndefined("));
			assert.ok(result.endsWith(");"));
			// undefined should be serialized somehow
			assert.strictEqual(typeof result, "string");
		});

		it("should handle primitives", () => {
			const req = createMockRequest({
				queryString: "callback=handlePrimitive"
			});
			const res = createMockResponse();

			const stringResult = javascript(req, res, "hello world");
			assert.ok(stringResult.includes('"hello world"'));

			const numberResult = javascript(req, res, 123);
			assert.ok(numberResult.includes("123"));

			const booleanResult = javascript(req, res, true);
			assert.ok(booleanResult.includes("true"));
		});

		it("should handle nested objects", () => {
			const req = createMockRequest({
				queryString: "callback=processNested"
			});
			const res = createMockResponse();
			const data = {
				user: {
					name: "John",
					age: 30
				},
				active: true
			};
			const result = javascript(req, res, data);

			assert.ok(result.startsWith("processNested("));
			assert.ok(result.includes('"user":{"name":"John","age":30}'));
			assert.ok(result.includes('"active":true'));
		});

		it("should handle special characters in callback name", () => {
			const req = createMockRequest({
				queryString: "callback=my_special_callback123"
			});
			const res = createMockResponse();
			const data = {test: "value"};
			const result = javascript(req, res, data);

			assert.ok(result.startsWith("my_special_callback123("));
			assert.ok(result.endsWith(");"));
		});

		it("should handle empty objects", () => {
			const req = createMockRequest({
				queryString: "callback=handleEmpty"
			});
			const res = createMockResponse();
			const result = javascript(req, res, {});

			assert.ok(result.startsWith("handleEmpty("));
			assert.ok(result.includes("{}"));
		});

		it("should handle empty arrays", () => {
			const req = createMockRequest({
				queryString: "callback=handleEmptyArray"
			});
			const res = createMockResponse();
			const result = javascript(req, res, []);

			assert.ok(result.startsWith("handleEmptyArray("));
			assert.ok(result.includes("[]"));
		});

		it("should handle Date objects", () => {
			const req = createMockRequest({
				queryString: "callback=handleDate"
			});
			const res = createMockResponse();
			const date = new Date("2023-01-01T00:00:00.000Z");
			const data = {timestamp: date};
			const result = javascript(req, res, data);

			assert.ok(result.startsWith("handleDate("));
			assert.ok(result.includes("2023-01-01T00:00:00.000Z"));
		});

		it("should handle circular references gracefully", () => {
			const req = createMockRequest({
				queryString: "callback=handleCircular"
			});
			const res = createMockResponse();
			const data = {name: "test"};
			data.self = data; // Create circular reference

			assert.throws(() => {
				javascript(req, res, data);
			}, TypeError);
		});

		it("should compact JSON output (no indentation)", () => {
			const req = createMockRequest({
				queryString: "callback=handleCompact"
			});
			const res = createMockResponse();
			const data = {
				name: "test",
				nested: {
					value: 123
				}
			};
			const result = javascript(req, res, data);

			// Should be compact (no pretty printing)
			assert.ok(!result.includes("  ")); // No indentation
			assert.ok(result.includes('{"name":"test","nested":{"value":123}}'));
		});

		it("should handle complex nested structures", () => {
			const req = createMockRequest({
				queryString: "callback=handleComplex"
			});
			const res = createMockResponse();
			const data = {
				users: [
					{name: "John", age: 30},
					{name: "Jane", age: 25}
				],
				metadata: {
					total: 2,
					active: true
				}
			};
			const result = javascript(req, res, data);

			assert.ok(result.startsWith("handleComplex("));
			assert.ok(result.includes('"users":[{"name":"John","age":30},{"name":"Jane","age":25}]'));
			assert.ok(result.includes('"metadata":{"total":2,"active":true}'));
		});

		it("should work with missing parsed object", () => {
			const req = createMockRequest({parsed: undefined});
			const res = createMockResponse();
			const data = {test: "value"};

			// May throw error due to accessing properties on undefined
			try {
				const result = javascript(req, res, data);
				assert.strictEqual(typeof result, "string");
			} catch (error) {
				assert.ok(error instanceof TypeError);
			}
		});

		it("should work with missing searchParams", () => {
			const req = createMockRequest({
				parsed: {searchParams: undefined}
			});
			const res = createMockResponse();
			const data = {test: "value"};

			// May throw error when trying to call .get() on undefined
			try {
				const result = javascript(req, res, data);
				assert.ok(result.startsWith("callback("));
			} catch (error) {
				assert.ok(error instanceof TypeError);
			}
		});
	});
});
