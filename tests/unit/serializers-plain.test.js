import assert from "node:assert";
import {STATUS_CODES} from "node:http";
import {plain} from "../../src/serializers/plain.js";
import {INT_200, INT_400, INT_500} from "../../src/core/constants.js";

describe("serializers/plain", () => {
	describe("plain()", () => {
		it("should return original data when no error", () => {
			const testData = {id: 1, name: "test"};
			const result = plain(testData, null);
			assert.deepStrictEqual(result, testData);
		});

		it("should return original data for various types when no error", () => {
			const testCases = [
				"string data",
				42,
				true,
				[1, 2, 3],
				{key: "value"},
				null,
				undefined
			];

			testCases.forEach(testCase => {
				const result = plain(testCase, null);
				assert.deepStrictEqual(result, testCase);
			});
		});

		it("should return error message when error is provided", () => {
			const error = new Error("Test error message");
			const result = plain("data", error);
			assert.strictEqual(result, "Test error message");
		});

		it("should return error stack when stack parameter is true", () => {
			const error = new Error("Test error message");
			const result = plain("data", error, INT_200, true);
			assert.strictEqual(result, error.stack);
		});

		it("should return string error directly when error is a string", () => {
			const errorString = "String error message";
			const result = plain("data", errorString);
			assert.strictEqual(result, errorString);
		});

		it("should return error object directly when error has no message", () => {
			const errorObj = {code: "ERROR_CODE"};
			const result = plain("data", errorObj);
			assert.deepStrictEqual(result, errorObj);
		});

		it("should return STATUS_CODES message when error is falsy but not null", () => {
			const result = plain("data", "", INT_400);
			assert.strictEqual(result, STATUS_CODES[INT_400]);
		});

		it("should throw error when err is undefined", () => {
			assert.throws(() => {
				plain("data", undefined, INT_500);
			}, TypeError);
		});

		it("should return error object when error has no message property", () => {
			const error = {};
			const result = plain("data", error, INT_400);
			assert.deepStrictEqual(result, error);
		});

		it("should use default status INT_200 when not provided", () => {
			const result = plain("data", "");
			assert.strictEqual(result, STATUS_CODES[INT_200]);
		});

		it("should use default stack false when not provided", () => {
			const error = new Error("Test error");
			const result = plain("data", error);
			assert.strictEqual(result, error.message);
			assert.notStrictEqual(result, error.stack);
		});

		it("should handle complex data structures", () => {
			const complexData = {
				users: [
					{id: 1, name: "John", meta: {active: true}},
					{id: 2, name: "Jane", meta: {active: false}}
				],
				total: 2,
				pagination: {page: 1, limit: 10}
			};
			const result = plain(complexData, null);
			assert.deepStrictEqual(result, complexData);
		});
	});
});
