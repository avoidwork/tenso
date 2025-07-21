import assert from "node:assert";
import {describe, it} from "mocha";
import {custom} from "../../src/serializers/custom.js";
import {INT_200, INT_400, INT_500} from "../../src/core/constants.js";

/**
 * Unit tests for custom serializer module
 */
describe("serializers/custom", () => {
	describe("custom()", () => {
		it("should return structured object with data and no error when err is null", () => {
			const data = {name: "test", value: 123};
			const result = custom(data, null);

			assert.strictEqual(typeof result, "object");
			assert.deepStrictEqual(result.data, data);
			assert.strictEqual(result.error, null);
			assert.deepStrictEqual(result.links, []);
			assert.strictEqual(result.status, INT_200);
		});

		it("should handle primitive data types", () => {
			const stringResult = custom("hello", null);
			assert.strictEqual(stringResult.data, "hello");
			assert.strictEqual(stringResult.error, null);

			const numberResult = custom(42, null);
			assert.strictEqual(numberResult.data, 42);
			assert.strictEqual(numberResult.error, null);

			const booleanResult = custom(true, null);
			assert.strictEqual(booleanResult.data, true);
			assert.strictEqual(booleanResult.error, null);
		});

		it("should handle null and undefined data", () => {
			const nullResult = custom(null, null);
			assert.strictEqual(nullResult.data, null);
			assert.strictEqual(nullResult.error, null);

			const undefinedResult = custom(undefined, null);
			assert.strictEqual(undefinedResult.data, undefined);
			assert.strictEqual(undefinedResult.error, null);
		});

		it("should handle array data", () => {
			const arrayData = ["a", "b", "c"];
			const result = custom(arrayData, null);

			assert.deepStrictEqual(result.data, arrayData);
			assert.strictEqual(result.error, null);
		});

		it("should include error message when err is an Error object", () => {
			const data = {test: "value"};
			const error = new Error("Something went wrong");
			const result = custom(data, error);

			assert.deepStrictEqual(result.data, data);
			assert.strictEqual(result.error, "Something went wrong");
			assert.deepStrictEqual(result.links, []);
			assert.strictEqual(result.status, INT_200);
		});

		it("should include error stack when stack=true and err is an Error object", () => {
			const data = {test: "value"};
			const error = new Error("Something went wrong");
			const result = custom(data, error, INT_200, true);

			assert.deepStrictEqual(result.data, data);
			assert.strictEqual(result.error, error.stack);
			assert.deepStrictEqual(result.links, []);
			assert.strictEqual(result.status, INT_200);
		});

		it("should handle string error", () => {
			const data = {test: "value"};
			const errorString = "Error string";
			const result = custom(data, errorString);

			assert.deepStrictEqual(result.data, data);
			assert.strictEqual(result.error, errorString);
			assert.deepStrictEqual(result.links, []);
			assert.strictEqual(result.status, INT_200);
		});

		it("should handle empty string error", () => {
			const data = {test: "value"};
			const result = custom(data, "");

			assert.deepStrictEqual(result.data, data);
			assert.strictEqual(result.error, "OK");
			assert.deepStrictEqual(result.links, []);
			assert.strictEqual(result.status, INT_200);
		});

		it("should use custom status code", () => {
			const data = {test: "value"};
			const result = custom(data, null, INT_400);

			assert.deepStrictEqual(result.data, data);
			assert.strictEqual(result.error, null);
			assert.deepStrictEqual(result.links, []);
			assert.strictEqual(result.status, INT_400);
		});

		it("should fallback to status code message when error has no message", () => {
			const data = {test: "value"};
			const result = custom(data, "", INT_500);

			assert.deepStrictEqual(result.data, data);
			assert.strictEqual(result.error, "Internal Server Error");
			assert.deepStrictEqual(result.links, []);
			assert.strictEqual(result.status, INT_500);
		});

		it("should handle Error object without message", () => {
			const data = {test: "value"};
			const error = new Error();
			error.message = "";
			const result = custom(data, error);

			assert.deepStrictEqual(result.data, data);
			assert.strictEqual(result.error, error);
			assert.deepStrictEqual(result.links, []);
			assert.strictEqual(result.status, INT_200);
		});

		it("should handle complex nested data structures", () => {
			const complexData = {
				user: {
					id: 1,
					name: "John Doe",
					settings: {
						theme: "dark",
						notifications: true
					}
				},
				posts: [
					{id: 1, title: "First post"},
					{id: 2, title: "Second post"}
				]
			};
			const result = custom(complexData, null);

			assert.deepStrictEqual(result.data, complexData);
			assert.strictEqual(result.error, null);
			assert.deepStrictEqual(result.links, []);
			assert.strictEqual(result.status, INT_200);
		});

		it("should maintain object structure consistency", () => {
			const result = custom("test", "error", INT_400, true);

			assert.ok(Object.hasOwn(result, "data"));
			assert.ok(Object.hasOwn(result, "error"));
			assert.ok(Object.hasOwn(result, "links"));
			assert.ok(Object.hasOwn(result, "status"));
			assert.strictEqual(Object.keys(result).length, 4);
		});

		it("should handle Error object with custom properties", () => {
			const data = {test: "value"};
			const error = new Error("Custom error");
			error.code = "CUSTOM_CODE";
			error.details = {additional: "info"};
			const result = custom(data, error);

			assert.deepStrictEqual(result.data, data);
			assert.strictEqual(result.error, "Custom error");
			assert.deepStrictEqual(result.links, []);
			assert.strictEqual(result.status, INT_200);
		});

		it("should handle various falsy error values", () => {
			const data = {test: "value"};

			const nullResult = custom(data, null);
			assert.strictEqual(nullResult.error, null);

			const falseResult = custom(data, false);
			assert.strictEqual(falseResult.error, "OK");

			const zeroResult = custom(data, 0);
			assert.strictEqual(zeroResult.error, "OK");
		});
	});
});
