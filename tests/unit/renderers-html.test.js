import assert from "node:assert";
import {html} from "../../src/renderers/html.js";

describe("renderers - html", () => {
	let mockReq, mockRes;

	beforeEach(() => {
		mockReq = {
			url: "/test",
			server: {
				title: "Test Server",
				version: "1.0.0",
				renderHeaders: true
			},
			headers: {
				accept: "text/html"
			},
			parsed: {
				href: "http://localhost:8000/test",
				protocol: "http:"
			}
		};

		mockRes = {
			statusCode: 200,
			getHeaders: function () {
				return {
					"content-type": "text/html",
					"allow": "GET, POST, PUT, DELETE",
					"x-csrf-token": "abc123"
				};
			}
		};
	});

	it("should return empty string when no template provided", () => {
		const data = {test: "value"};

		const result = html(mockReq, mockRes, data);

		assert.strictEqual(result, "");
	});

	it("should return empty string when empty template provided", () => {
		const data = {test: "value"};

		const result = html(mockReq, mockRes, data, "");

		assert.strictEqual(result, "");
	});

	it("should replace title template", () => {
		const template = "<title>{{title}}</title>";
		const data = {test: "value"};

		const result = html(mockReq, mockRes, data, template);

		assert.ok(result.includes("<title>Test Server</title>"));
	});

	it("should replace URL template", () => {
		const template = "<base href=\"{{url}}\"/>";
		const data = {test: "value"};

		const result = html(mockReq, mockRes, data, template);

		assert.ok(result.includes("http://localhost:8000/test"));
	});

	it("should replace headers template", () => {
		const template = "<table>{{headers}}</table>";
		const data = {test: "value"};

		const result = html(mockReq, mockRes, data, template);

		assert.ok(result.includes("<tr><td>"));
		assert.ok(result.includes("content-type"));
		assert.ok(result.includes("text/html"));
	});

	it("should replace body template with sanitized JSON", () => {
		const template = "<pre>{{body}}</pre>";
		const data = {message: "<script>alert('xss')</script>"};

		const result = html(mockReq, mockRes, data, template);

		assert.ok(result.includes("&lt;script&gt;"));
		assert.ok(result.includes("&lt;/script&gt;"));
	});

	it("should replace version template", () => {
		const template = "<span>Version: {{version}}</span>";
		const data = {test: "value"};

		const result = html(mockReq, mockRes, data, template);

		assert.ok(result.includes("Version: 1.0.0"));
	});

	it("should replace year template", () => {
		const template = "<span>Copyright {{year}}</span>";
		const data = {test: "value"};

		const result = html(mockReq, mockRes, data, template);

		const currentYear = new Date().getFullYear();
		assert.ok(result.includes(`Copyright ${currentYear}`));
	});

	it("should replace allow template", () => {
		const template = "<span>{{allow}}</span>";
		const data = {test: "value"};

		const result = html(mockReq, mockRes, data, template);

		assert.ok(result.includes("GET, POST, PUT, DELETE"));
	});

	it("should replace CSRF token template", () => {
		const template = "<input type=\"hidden\" name=\"csrf\" value=\"{{csrf}}\"/>";
		const data = {test: "value"};

		const result = html(mockReq, mockRes, data, template);

		assert.ok(result.includes("abc123"));
	});

	it("should handle x-forwarded-proto header", () => {
		mockReq.headers["x-forwarded-proto"] = "https";
		const template = "<base href=\"{{url}}\"/>";
		const data = {test: "value"};

		const result = html(mockReq, mockRes, data, template);

		assert.ok(result.includes("https://localhost:8000/test"));
	});

	it("should replace formats template", () => {
		const template = "<select>{{formats}}</select>";
		const data = {test: "value"};

		const result = html(mockReq, mockRes, data, template);

		assert.ok(result.includes("<option"));
		assert.ok(result.includes("JSON"));
	});

	it("should replace methods template", () => {
		const template = "<select>{{methods}}</select>";
		const data = {test: "value"};

		const result = html(mockReq, mockRes, data, template);

		assert.ok(result.includes("<option"));
	});

	it("should handle missing headers gracefully", () => {
		mockRes.getHeaders = function () {
			return {};
		};
		const template = "{{allow}} {{csrf}}";
		const data = {test: "value"};

		const result = html(mockReq, mockRes, data, template);

		assert.strictEqual(typeof result, "string");
	});

	it("should hide headers when renderHeaders is false", () => {
		mockReq.server.renderHeaders = false;
		const template = "<div class=\"headers\">Headers</div>";
		const data = {test: "value"};

		const result = html(mockReq, mockRes, data, template);

		assert.ok(result.includes("class=\"headers dr-hidden"));
	});

	it("should handle complex data structures in body", () => {
		const template = "<pre>{{body}}</pre>";
		const data = {
			users: [
				{name: "John", age: 30},
				{name: "Jane", age: 25}
			],
			metadata: {total: 2}
		};

		const result = html(mockReq, mockRes, data, template);

		assert.ok(result.includes("users"));
		assert.ok(result.includes("John"));
		assert.ok(result.includes("metadata"));
	});

	it("should handle null and undefined values", () => {
		const template = "<pre>{{body}}</pre>";
		const data = {
			nullValue: null,
			undefinedValue: undefined,
			emptyString: "",
			zero: 0
		};

		const result = html(mockReq, mockRes, data, template);

		assert.ok(result.includes("null"));
		assert.ok(result.includes("\"\""));
	});
});
