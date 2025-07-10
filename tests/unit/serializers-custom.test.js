import assert from "node:assert";
import {STATUS_CODES} from "node:http";
import {custom} from "../../src/serializers/custom.js";
import {INT_200, INT_400, INT_500} from "../../src/core/constants.js";

describe("serializers/custom", () => {
	describe("custom()", () => {
		it("should return structured object with data when no error", () => {
			const testData = {id: 1, name: "test"};
			const result = custom(testData, null);

			assert.strictEqual(typeof result, "object");
			assert.deepStrictEqual(result.data, testData);
			assert.strictEqual(result.error, null);
			assert.deepStrictEqual(result.links, []);
			assert.strictEqual(result.status, INT_200);
		});

		it("should return structured object for various data types when no error", () => {
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
				const result = custom(testCase, null);
				assert.deepStrictEqual(result.data, testCase);
				assert.strictEqual(result.error, null);
				assert.deepStrictEqual(result.links, []);
				assert.strictEqual(result.status, INT_200);
			});
		});

		it("should return structured object with error message when error is provided", () => {
			const error = new Error("Test error message");
			const testData = "data";
			const result = custom(testData, error);

			assert.deepStrictEqual(result.data, testData);
			assert.strictEqual(result.error, "Test error message");
			assert.deepStrictEqual(result.links, []);
			assert.strictEqual(result.status, INT_200);
		});

		it("should return structured object with error stack when stack parameter is true", () => {
			const error = new Error("Test error message");
			const testData = "data";
			const result = custom(testData, error, INT_500, true);

			assert.deepStrictEqual(result.data, testData);
			assert.strictEqual(result.error, error.stack);
			assert.deepStrictEqual(result.links, []);
			assert.strictEqual(result.status, INT_500);
		});

		it("should return structured object with string error directly", () => {
			const errorString = "String error message";
			const testData = "data";
			const result = custom(testData, errorString, INT_400);

			assert.deepStrictEqual(result.data, testData);
			assert.strictEqual(result.error, errorString);
			assert.deepStrictEqual(result.links, []);
			assert.strictEqual(result.status, INT_400);
		});

		it("should return structured object with error object when error has no message", () => {
			const errorObj = {code: "ERROR_CODE"};
			const testData = "data";
			const result = custom(testData, errorObj, INT_400);

			assert.deepStrictEqual(result.data, testData);
			assert.deepStrictEqual(result.error, errorObj);
			assert.deepStrictEqual(result.links, []);
			assert.strictEqual(result.status, INT_400);
		});

		it("should return structured object with STATUS_CODES message when error is falsy but not null", () => {
			const testData = "data";
			const result = custom(testData, "", INT_400);

			assert.deepStrictEqual(result.data, testData);
			assert.strictEqual(result.error, STATUS_CODES[INT_400]);
			assert.deepStrictEqual(result.links, []);
			assert.strictEqual(result.status, INT_400);
		});

		it("should throw error when err is undefined", () => {
			const testData = "data";
			assert.throws(() => {
				custom(testData, undefined, INT_500);
			}, TypeError);
		});

		it("should return error object when error has no message property", () => {
			const error = {};
			const testData = "data";
			const result = custom(testData, error, INT_400);

			assert.deepStrictEqual(result.data, testData);
			assert.deepStrictEqual(result.error, error);
			assert.deepStrictEqual(result.links, []);
			assert.strictEqual(result.status, INT_400);
		});

		it("should use default status INT_200 when not provided", () => {
			const testData = "data";
			const result = custom(testData, "");

			assert.strictEqual(result.status, INT_200);
			assert.strictEqual(result.error, STATUS_CODES[INT_200]);
		});

		it("should use default stack false when not provided", () => {
			const error = new Error("Test error");
			const testData = "data";
			const result = custom(testData, error);

			assert.strictEqual(result.error, error.message);
			assert.notStrictEqual(result.error, error.stack);
		});

		it("should always include all required fields in response structure", () => {
			const testData = {complex: "data"};
			const result = custom(testData, null);

			assert.strictEqual(Object.hasOwnProperty.call(result, "data"), true);
			assert.strictEqual(Object.hasOwnProperty.call(result, "error"), true);
			assert.strictEqual(Object.hasOwnProperty.call(result, "links"), true);
			assert.strictEqual(Object.hasOwnProperty.call(result, "status"), true);
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
			const result = custom(complexData, null, INT_200);

			assert.deepStrictEqual(result.data, complexData);
			assert.strictEqual(result.error, null);
			assert.deepStrictEqual(result.links, []);
			assert.strictEqual(result.status, INT_200);
		});

		it("should preserve links array structure", () => {
			const testData = "data";
			const result = custom(testData, null);

			assert.strictEqual(Array.isArray(result.links), true);
			assert.strictEqual(result.links.length, 0);
		});
	});
});
