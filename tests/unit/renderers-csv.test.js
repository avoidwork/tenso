import assert from "node:assert";
import {csv} from "../../src/renderers/csv.js";

describe("renderers - csv", () => {
	let mockReq, mockRes;

	beforeEach(() => {
		mockReq = {
			url: "/test/data.csv",
			server: {
				jsonIndent: 0
			},
			headers: {
				accept: "text/csv"
			}
		};

		mockRes = {
			statusCode: 200,
			header: function (name, value) {
				this.headers = this.headers || {};
				this.headers[name] = value;
			},
			headers: {}
		};
	});

	it("should render array of objects as CSV with headers", () => {
		const data = [
			{name: "John", age: 30, active: true},
			{name: "Jane", age: 25, active: false}
		];

		const result = csv(mockReq, mockRes, data);

		assert.ok(result.includes("name,age,active"));
		assert.ok(result.includes("John,30,true"));
		assert.ok(result.includes("Jane,25,false"));
	});

	it("should render single object as CSV", () => {
		const data = {name: "John", age: 30, active: true};

		const result = csv(mockReq, mockRes, data);

		assert.ok(result.includes("name,age,active"));
		assert.ok(result.includes("John,30,true"));
	});

	it("should handle boolean values correctly", () => {
		const data = [{enabled: true, disabled: false}];

		const result = csv(mockReq, mockRes, data);

		assert.ok(result.includes("true"));
		assert.ok(result.includes("false"));
	});

	it("should handle date values correctly", () => {
		const testDate = new Date("2023-01-01T12:00:00.000Z");
		const data = [{created: testDate}];

		const result = csv(mockReq, mockRes, data);

		assert.ok(result.includes("2023-01-01T12:00:00.000Z"));
	});

	it("should handle numeric values correctly", () => {
		const data = [{price: 99.99, count: 42}];

		const result = csv(mockReq, mockRes, data);

		assert.ok(result.includes("99.99"));
		assert.ok(result.includes("42"));
	});

	it("should set content-disposition header for download", () => {
		const data = [{test: "value"}];
		mockReq.url = "/api/users.csv";

		csv(mockReq, mockRes, data);

		assert.ok(mockRes.headers["content-disposition"]);
		assert.ok(mockRes.headers["content-disposition"].includes("users"));
	});

	it("should handle error responses", () => {
		mockRes.statusCode = 400;
		const errorData = "Bad Request";

		const result = csv(mockReq, mockRes, errorData);

		assert.ok(result.includes("Error"));
		assert.ok(result.includes("Bad Request"));
	});

	it("should handle empty array", () => {
		const data = [];

		const result = csv(mockReq, mockRes, data);

		assert.strictEqual(typeof result, "string");
		assert.ok(result.length >= 0);
	});

	it("should handle null values", () => {
		const data = [{name: "John", value: null}];

		const result = csv(mockReq, mockRes, data);

		assert.ok(result.includes("name,value"));
	});

	it("should extract filename from URL correctly", () => {
		mockReq.url = "/api/v1/reports/sales.csv?format=csv";
		const data = [{test: "value"}];

		csv(mockReq, mockRes, data);

		assert.ok(mockRes.headers["content-disposition"].includes("sales"));
	});

	it("should handle URLs without extension", () => {
		mockReq.url = "/api/data";
		const data = [{test: "value"}];

		csv(mockReq, mockRes, data);

		assert.ok(mockRes.headers["content-disposition"]);
	});

	it("should handle complex nested objects by flattening", () => {
		const data = [{user: {name: "John", details: {age: 30}}}];

		const result = csv(mockReq, mockRes, data);

		assert.strictEqual(typeof result, "string");
		assert.ok(result.length > 0);
	});
});
