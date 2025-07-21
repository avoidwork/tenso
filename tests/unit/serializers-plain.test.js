import assert from "node:assert";
import {describe, it} from "mocha";
import {plain} from "../../src/serializers/plain.js";
import {INT_200, INT_400, INT_500} from "../../src/core/constants.js";

/**
 * Unit tests for plain serializer module
 */
describe("serializers/plain", () => {
	describe("plain()", () => {
		it("should return original data when err is null", () => {
			const data = {name: "test", value: 123};
			const result = plain(data, null);

			assert.deepStrictEqual(result, data);
		});

		it("should handle primitive data types when no error", () => {
			assert.strictEqual(plain("hello", null), "hello");
			assert.strictEqual(plain(42, null), 42);
			assert.strictEqual(plain(true, null), true);
			assert.strictEqual(plain(false, null), false);
		});

		it("should handle null and undefined data when no error", () => {
			assert.strictEqual(plain(null, null), null);
			assert.strictEqual(plain(undefined, null), undefined);
		});

		it("should handle array data when no error", () => {
			const arrayData = ["a", "b", "c"];
			const result = plain(arrayData, null);

			assert.deepStrictEqual(result, arrayData);
		});

		it("should return error message when err is an Error object", () => {
			const data = {test: "value"};
			const error = new Error("Something went wrong");
			const result = plain(data, error);

			assert.strictEqual(result, "Something went wrong");
		});

		it("should return error stack when stack=true and err is an Error object", () => {
			const data = {test: "value"};
			const error = new Error("Something went wrong");
			const result = plain(data, error, INT_200, true);

			assert.strictEqual(result, error.stack);
		});

		it("should handle string error", () => {
			const data = {test: "value"};
			const errorString = "Error string";
			const result = plain(data, errorString);

			assert.strictEqual(result, errorString);
		});

		it("should handle empty string error and fallback to status message", () => {
			const data = {test: "value"};
			const result = plain(data, "", INT_200);

			assert.strictEqual(result, "OK");
		});

		it("should fallback to status code message when error has no message", () => {
			const data = {test: "value"};
			const result = plain(data, "", INT_500);

			assert.strictEqual(result, "Internal Server Error");
		});

		it("should handle Error object without message", () => {
			const data = {test: "value"};
			const error = new Error();
			error.message = "";
			const result = plain(data, error, INT_400);

			assert.strictEqual(result, error);
		});

		it("should handle complex nested data structures when no error", () => {
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
			const result = plain(complexData, null);

			assert.deepStrictEqual(result, complexData);
		});

		it("should handle Error object with custom properties", () => {
			const data = {test: "value"};
			const error = new Error("Custom error");
			error.code = "CUSTOM_CODE";
			error.details = {additional: "info"};
			const result = plain(data, error);

			assert.strictEqual(result, "Custom error");
		});

		it("should handle various falsy error values", () => {
			const data = {test: "value"};

			const nullResult = plain(data, null);
			assert.deepStrictEqual(nullResult, data);

			const falseResult = plain(data, false, INT_200);
			assert.strictEqual(falseResult, "OK");

			const zeroResult = plain(data, 0, INT_200);
			assert.strictEqual(zeroResult, "OK");
		});

		it("should respect stack parameter for different error types", () => {
			const data = {test: "value"};
			const error = new Error("Test error");

			// Without stack
			const withoutStack = plain(data, error, INT_200, false);
			assert.strictEqual(withoutStack, "Test error");

			// With stack
			const withStack = plain(data, error, INT_200, true);
			assert.strictEqual(withStack, error.stack);
		});

		it("should handle edge case where error is truthy but has no message or stack", () => {
			const data = {test: "value"};
			const weirdError = {toString: () => ""};
			const result = plain(data, weirdError, INT_500);

			assert.strictEqual(result, weirdError);
		});

		it("should preserve data type and structure when returning data", () => {
			const dateData = new Date("2023-01-01");
			const dateResult = plain(dateData, null);
			assert.strictEqual(dateResult, dateData);
			assert.ok(dateResult instanceof Date);

			const regexData = /test/gi;
			const regexResult = plain(regexData, null);
			assert.strictEqual(regexResult, regexData);
			assert.ok(regexResult instanceof RegExp);
		});

		it("should handle function data types when no error", () => {
			const funcData = () => "test";
			const result = plain(funcData, null);
			assert.strictEqual(result, funcData);
			assert.strictEqual(typeof result, "function");
		});

		it("should handle symbol data when no error", () => {
			const symbolData = Symbol("test");
			const result = plain(symbolData, null);
			assert.strictEqual(result, symbolData);
			assert.strictEqual(typeof result, "symbol");
		});
	});
});
