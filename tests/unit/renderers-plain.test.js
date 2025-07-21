import assert from "node:assert";
import {describe, it} from "mocha";
import {plain} from "../../src/renderers/plain.js";

/**
 * Creates a mock request object for testing
 * @param {Object} options - Options to customize the mock request
 * @returns {Object} Mock request object
 */
function createMockRequest (options = {}) {
	return {
		headers: options.headers || {},
		server: options.server || {},
		...options
	};
}

/**
 * Creates a mock response object for testing
 * @param {Object} options - Options to customize the mock response
 * @returns {Object} Mock response object
 */
function createMockResponse (options = {}) {
	return {
		header: options.header || (() => {}),
		...options
	};
}

/**
 * Unit tests for plain text renderer module
 */
describe("renderers/plain", () => {
	describe("plain()", () => {
		it("should render null as 'null'", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const result = plain(req, res, null);

			assert.strictEqual(result, "null");
		});

		it("should render undefined as empty string", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const result = plain(req, res, undefined);

			assert.strictEqual(result, "");
		});

		it("should render strings as-is", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const result = plain(req, res, "hello world");

			assert.strictEqual(result, "hello world");
		});

		it("should render numbers as strings", () => {
			const req = createMockRequest();
			const res = createMockResponse();

			assert.strictEqual(plain(req, res, 123), "123");
			assert.strictEqual(plain(req, res, 123.45), "123.45");
			assert.strictEqual(plain(req, res, 0), "0");
		});

		it("should render booleans as strings", () => {
			const req = createMockRequest();
			const res = createMockResponse();

			assert.strictEqual(plain(req, res, true), "true");
			assert.strictEqual(plain(req, res, false), "false");
		});

		it("should render arrays as comma-separated values", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = ["apple", "banana", "cherry"];
			const result = plain(req, res, data);

			assert.strictEqual(result, "apple,banana,cherry");
		});

		it("should render nested arrays recursively", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [["a", "b"], ["c", "d"]];
			const result = plain(req, res, data);

			assert.strictEqual(result, "a,b,c,d");
		});

		it("should render Date objects as ISO strings", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const date = new Date("2023-01-01T00:00:00.000Z");
			const result = plain(req, res, date);

			assert.strictEqual(result, "2023-01-01T00:00:00.000Z");
		});

		it("should render functions as their string representation", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const func = function testFunction () { return "test"; };
			const result = plain(req, res, func);

			assert.strictEqual(result, func.toString());
		});

		it("should render objects as JSON strings", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {name: "test", value: 123};
			const result = plain(req, res, data);

			assert.strictEqual(result, '{"name":"test","value":123}');
		});

		it("should use server jsonIndent for objects", () => {
			const req = createMockRequest({
				server: {jsonIndent: 2}
			});
			const res = createMockResponse();
			const data = {name: "test", value: 123};
			const result = plain(req, res, data);

			assert.strictEqual(result, '{\n  "name": "test",\n  "value": 123\n}');
		});

		it("should use accept header for object indentation", () => {
			const req = createMockRequest({
				headers: {accept: "text/plain; indent=4"},
				server: {jsonIndent: 0}
			});
			const res = createMockResponse();
			const data = {name: "test"};
			const result = plain(req, res, data);

			assert.strictEqual(result, '{\n    "name": "test"\n}');
		});

		it("should handle arrays containing different types", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [
				"string",
				123,
				true,
				{key: "value"},
				null
			];
			const result = plain(req, res, data);

			assert.strictEqual(result, 'string,123,true,{"key":"value"},null');
		});

		it("should handle empty arrays", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const result = plain(req, res, []);

			assert.strictEqual(result, "");
		});

		it("should handle empty objects", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const result = plain(req, res, {});

			assert.strictEqual(result, "{}");
		});

		it("should handle missing headers gracefully", () => {
			const req = createMockRequest({headers: undefined});
			const res = createMockResponse();
			const data = {test: "value"};
			const result = plain(req, res, data);

			assert.strictEqual(result, '{"test":"value"}');
		});

		it("should handle missing server configuration gracefully", () => {
			const req = createMockRequest({server: undefined});
			const res = createMockResponse();
			const data = {test: "value"};
			const result = plain(req, res, data);

			assert.strictEqual(result, '{"test":"value"}');
		});

		it("should use caching for objects", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {name: "test"};

			// First call
			const result1 = plain(req, res, data);
			// Second call with same object should use cache
			const result2 = plain(req, res, data);

			assert.strictEqual(result1, result2);
			assert.strictEqual(result1, '{"name":"test"}');
		});

		it("should handle complex nested structures", () => {
			const req = createMockRequest();
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
			const result = plain(req, res, data);

			assert.strictEqual(result, '{"users":[{"name":"John","age":30},{"name":"Jane","age":25}],"metadata":{"total":2,"active":true}}');
		});

		it("should handle special number values", () => {
			const req = createMockRequest();
			const res = createMockResponse();

			assert.strictEqual(plain(req, res, NaN), "NaN");
			assert.strictEqual(plain(req, res, Infinity), "Infinity");
			assert.strictEqual(plain(req, res, -Infinity), "-Infinity");
		});
	});
});
