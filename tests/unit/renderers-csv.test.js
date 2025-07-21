import assert from "node:assert";
import {describe, it} from "mocha";
import {csv} from "../../src/renderers/csv.js";

/**
 * Creates a mock request object for testing
 * @param {Object} options - Options to customize the mock request
 * @returns {Object} Mock request object
 */
function createMockRequest (options = {}) {
	return {
		url: options.url || "/test.csv",
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
	const headers = {};

	return {
		statusCode: options.statusCode || 200,
		header: options.header || ((key, value) => {
			headers[key] = value;
		}),
		getHeaders: () => headers,
		...options
	};
}

/**
 * Unit tests for CSV renderer module
 */
describe("renderers/csv", () => {
	describe("csv()", () => {
		it("should render array of objects as CSV with headers", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [
				{name: "John", age: 30, active: true},
				{name: "Jane", age: 25, active: false}
			];
			const result = csv(req, res, data);

			assert.ok(result.includes("name,age,active"));
			assert.ok(result.includes("John,30,true"));
			assert.ok(result.includes("Jane,25,false"));
		});

		it("should render single object as CSV", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {name: "John", age: 30, active: true};
			const result = csv(req, res, data);

			assert.ok(result.includes("name,age,active"));
			assert.ok(result.includes("John,30,true"));
		});

		it("should set content-disposition header with filename", () => {
			const req = createMockRequest({url: "/users/data.csv"});
			const res = createMockResponse();
			const headerSpy = [];
			res.header = (key, value) => {
				headerSpy.push({key, value});
			};

			const data = [{name: "test"}];
			csv(req, res, data);

			const contentDisposition = headerSpy.find(h => h.key === "content-disposition");
			assert.ok(contentDisposition);
			assert.ok(contentDisposition.value.includes("data"));
		});

		it("should handle boolean values correctly", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [
				{name: "test1", active: true},
				{name: "test2", active: false}
			];
			const result = csv(req, res, data);

			assert.ok(result.includes("true"));
			assert.ok(result.includes("false"));
		});

		it("should handle Date objects correctly", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const date = new Date("2023-01-01T00:00:00.000Z");
			const data = [{name: "test", timestamp: date}];
			const result = csv(req, res, data);

			assert.ok(result.includes("2023-01-01T00:00:00.000Z"));
		});

		it("should handle numbers correctly", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [
				{name: "test1", value: 123},
				{name: "test2", value: 456.78}
			];
			const result = csv(req, res, data);

			assert.ok(result.includes("123"));
			assert.ok(result.includes("456.78"));
		});

		it("should handle error responses (status >= 400)", () => {
			const req = createMockRequest();
			const res = createMockResponse({statusCode: 400});
			const data = "Bad Request";
			const result = csv(req, res, data);

			assert.ok(result.includes("Error"));
			assert.ok(result.includes("Bad Request"));
		});

		it("should handle 500 error responses", () => {
			const req = createMockRequest();
			const res = createMockResponse({statusCode: 500});
			const data = "Internal Server Error";
			const result = csv(req, res, data);

			assert.ok(result.includes("Error"));
			assert.ok(result.includes("Internal Server Error"));
		});

		it("should handle empty arrays", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [];
			const result = csv(req, res, data);

			// Empty array should still produce headers if any
			assert.strictEqual(typeof result, "string");
		});

		it("should handle null values in data", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [
				{name: "John", age: 30},
				{name: "Jane", age: null}
			];
			const result = csv(req, res, data);

			assert.ok(result.includes("name,age"));
			assert.ok(result.includes("John,30"));
			assert.ok(result.includes("Jane,"));
		});

		it("should handle mixed data types", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [
				{
					string: "text",
					number: 123,
					boolean: true,
					date: new Date("2023-01-01"),
					null_value: null
				}
			];
			const result = csv(req, res, data);

			assert.ok(result.includes("string,number,boolean,date,null_value"));
			assert.ok(result.includes("text"));
			assert.ok(result.includes("123"));
			assert.ok(result.includes("true"));
		});

		it("should extract filename from complex URLs", () => {
			const req = createMockRequest({url: "/api/v1/users/export.csv?format=csv"});
			const res = createMockResponse();
			const headerSpy = [];
			res.header = (key, value) => {
				headerSpy.push({key, value});
			};

			const data = [{name: "test"}];
			csv(req, res, data);

			const contentDisposition = headerSpy.find(h => h.key === "content-disposition");
			assert.ok(contentDisposition);
			assert.ok(contentDisposition.value.includes("export"));
		});

		it("should handle URLs without file extension", () => {
			const req = createMockRequest({url: "/api/users/data"});
			const res = createMockResponse();
			const headerSpy = [];
			res.header = (key, value) => {
				headerSpy.push({key, value});
			};

			const data = [{name: "test"}];
			csv(req, res, data);

			const contentDisposition = headerSpy.find(h => h.key === "content-disposition");
			assert.ok(contentDisposition);
			assert.ok(contentDisposition.value.includes("data"));
		});

		it("should handle objects with different keys", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [
				{name: "John", age: 30},
				{name: "Jane", city: "NYC"}
			];
			const result = csv(req, res, data);

			// CSV should handle missing fields gracefully
			assert.ok(result.includes("name"));
			assert.ok(result.includes("John"));
			assert.ok(result.includes("Jane"));
		});

		it("should produce quoted=false CSV output", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [{name: "Simple Text", value: 123}];
			const result = csv(req, res, data);

			// Values should not be quoted for simple content
			assert.ok(result.includes("Simple Text"));
			assert.ok(!result.includes('"Simple Text"'));
		});
	});
});
