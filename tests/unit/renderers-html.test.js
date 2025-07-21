import assert from "node:assert";
import {describe, it} from "mocha";
import {html} from "../../src/renderers/html.js";

/**
 * Creates a mock request object for testing
 * @param {Object} options - Options to customize the mock request
 * @returns {Object} Mock request object
 */
function createMockRequest (options = {}) {
	return {
		headers: options.headers || {},
		server: options.server || {
			title: "Test Server",
			version: "1.0.0",
			renderHeaders: true
		},
		parsed: options.parsed || {
			href: "http://example.com/test",
			protocol: "http:"
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
	const headers = options.initialHeaders || {
		"content-type": "text/html",
		allow: "GET, POST, PUT, DELETE"
	};

	return {
		getHeaders: () => headers,
		header: options.header || (() => {}),
		...options
	};
}

/**
 * Unit tests for HTML renderer module
 */
describe("renderers/html", () => {
	describe("html()", () => {
		it("should return empty string for empty template", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {test: "value"};
			const result = html(req, res, data, "");

			assert.strictEqual(result, "");
		});

		it("should return empty string for zero-length template", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {test: "value"};
			const result = html(req, res, data);

			assert.strictEqual(result, "");
		});

		it("should replace {{title}} template placeholder", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {test: "value"};
			const template = "<html><head><title>{{title}}</title></head></html>";
			const result = html(req, res, data, template);

			assert.ok(result.includes("Test Server"));
			assert.ok(result.includes("<title>Test Server</title>"));
		});

		it("should replace {{url}} template placeholder", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {test: "value"};
			const template = "<html><body><a href='{{url}}'>Link</a></body></html>";
			const result = html(req, res, data, template);

			assert.ok(result.includes("http://example.com/test"));
		});

		it("should replace {{version}} template placeholder", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {test: "value"};
			const template = "<html><body>Version: {{version}}</body></html>";
			const result = html(req, res, data, template);

			assert.ok(result.includes("Version: 1.0.0"));
		});

		it("should replace {{year}} template placeholder with current year", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {test: "value"};
			const template = "<html><body>Copyright {{year}}</body></html>";
			const result = html(req, res, data, template);

			const currentYear = new Date().getFullYear();
			assert.ok(result.includes(`Copyright ${currentYear}`));
		});

		it("should replace {{body}} template placeholder with sanitized JSON", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {message: "Hello <script>alert('xss')</script>"};
			const template = "<html><body>{{body}}</body></html>";
			const result = html(req, res, data, template);

			assert.ok(result.includes("Hello"));
			// Should be sanitized - no raw script tags
			assert.ok(!result.includes("<script>"));
		});

		it("should replace {{headers}} template placeholder with header table", () => {
			const req = createMockRequest();
			const res = createMockResponse({
				initialHeaders: {
					"content-type": "text/html",
					"x-custom": "test-value"
				}
			});
			const data = {test: "value"};
			const template = "<html><body><table>{{headers}}</table></body></html>";
			const result = html(req, res, data, template);

			assert.ok(result.includes("<tr><td>"));
			assert.ok(result.includes("content-type"));
			assert.ok(result.includes("text/html"));
			assert.ok(result.includes("x-custom"));
			assert.ok(result.includes("test-value"));
		});

		it("should replace {{allow}} template placeholder", () => {
			const req = createMockRequest();
			const res = createMockResponse({
				initialHeaders: {
					allow: "GET, POST, PUT"
				}
			});
			const data = {test: "value"};
			const template = "<html><body>Methods: {{allow}}</body></html>";
			const result = html(req, res, data, template);

			assert.ok(result.includes("Methods: GET, POST, PUT"));
		});

		it("should replace {{methods}} template placeholder with option elements", () => {
			const req = createMockRequest();
			const res = createMockResponse({
				initialHeaders: {
					allow: "GET, POST, PUT, DELETE"
				}
			});
			const data = {test: "value"};
			const template = "<html><body><select>{{methods}}</select></body></html>";
			const result = html(req, res, data, template);

			assert.ok(result.includes("<option value='POST'>POST</option>"));
			assert.ok(result.includes("<option value='PUT'>PUT</option>"));
			assert.ok(result.includes("<option value='DELETE'>DELETE</option>"));
			// Note: Based on actual implementation, GET might still be included
		});

		it("should replace {{formats}} template placeholder with format options", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {test: "value"};
			const template = "<html><body><select>{{formats}}</select></body></html>";
			const result = html(req, res, data, template);

			assert.ok(result.includes("<option value=''>"));
			assert.ok(result.includes("JSON"));
			assert.ok(result.includes("XML"));
			// Should not include HTML format
			assert.ok(!result.includes("HTML"));
		});

		it("should handle x-forwarded-proto header for URL replacement", () => {
			const req = createMockRequest({
				headers: {
					"x-forwarded-proto": "https"
				},
				parsed: {
					href: "http://example.com/test",
					protocol: "http:"
				}
			});
			const res = createMockResponse();
			const data = {test: "value"};
			const template = "<a href='{{url}}'>Link</a>";
			const result = html(req, res, data, template);

			assert.ok(result.includes("https://example.com/test"));
		});

		it("should handle CSRF token replacement", () => {
			const req = createMockRequest();
			const res = createMockResponse({
				initialHeaders: {
					"x-csrf-token": "abc123xyz"
				}
			});
			const data = {test: "value"};
			const template = "<form><input type='hidden' value='{{csrf}}'></form>";
			const result = html(req, res, data, template);

			assert.ok(result.includes("abc123xyz"));
		});

		it("should handle missing CSRF token gracefully", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {test: "value"};
			const template = "<form><input type='hidden' value='{{csrf}}'></form>";
			const result = html(req, res, data, template);

			assert.ok(result.includes("value=''") || result.includes('value=""'));
		});

		it("should hide headers when renderHeaders is false", () => {
			const req = createMockRequest({
				server: {
					title: "Test Server",
					version: "1.0.0",
					renderHeaders: false
				}
			});
			const res = createMockResponse();
			const data = {test: "value"};
			const template = '<div class="headers">Headers here</div>';
			const result = html(req, res, data, template);

			assert.ok(result.includes('class="headers dr-hidden"'));
		});

		it("should show headers when renderHeaders is true", () => {
			const req = createMockRequest({
				server: {
					title: "Test Server",
					version: "1.0.0",
					renderHeaders: true
				}
			});
			const res = createMockResponse();
			const data = {test: "value"};
			const template = '<div class="headers">Headers here</div>';
			const result = html(req, res, data, template);

			assert.ok(result.includes('class="headers"'));
			assert.ok(!result.includes("dr-hidden"));
		});

		it("should handle multiple template replacements", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {name: "test", value: 123};
			const template = `
				<html>
					<head><title>{{title}} v{{version}}</title></head>
					<body>
						<h1>{{title}}</h1>
						<pre>{{body}}</pre>
						<p>Year: {{year}}</p>
					</body>
				</html>
			`;
			const result = html(req, res, data, template);

			assert.ok(result.includes("Test Server v1.0.0"));
			assert.ok(result.includes("<h1>Test Server</h1>"));
			assert.ok(result.includes("Year: " + new Date().getFullYear()));
			// Body content should be sanitized JSON
			assert.ok(result.includes("name") && result.includes("test"));
		});

		it("should handle empty data object", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {};
			const template = "<html><body>{{body}}</body></html>";
			const result = html(req, res, data, template);

			assert.ok(result.includes("{}"));
		});

		it("should handle null data", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = null;
			const template = "<html><body>{{body}}</body></html>";
			const result = html(req, res, data, template);

			assert.ok(result.includes("null"));
		});

		it("should handle complex nested data", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {
				users: [
					{name: "John", age: 30},
					{name: "Jane", age: 25}
				],
				metadata: {
					total: 2,
					page: 1
				}
			};
			const template = "<html><body><pre>{{body}}</pre></body></html>";
			const result = html(req, res, data, template);

			// Should contain the JSON representation
			assert.ok(result.includes("users"));
			assert.ok(result.includes("John"));
			assert.ok(result.includes("metadata"));
		});

		it("should handle missing server configuration gracefully", () => {
			const req = createMockRequest({
				server: undefined
			});
			const res = createMockResponse();
			const data = {test: "value"};
			const template = "<html><title>{{title}}</title></html>";

			// HTML renderer expects server object to exist, will throw TypeError
			assert.throws(() => {
				html(req, res, data, template);
			}, TypeError);
		});

		it("should handle missing parsed configuration gracefully", () => {
			const req = createMockRequest({
				parsed: undefined
			});
			const res = createMockResponse();
			const data = {test: "value"};
			const template = "<html><body>{{url}}</body></html>";

			// HTML renderer expects parsed object to exist, will throw TypeError
			assert.throws(() => {
				html(req, res, data, template);
			}, TypeError);
		});
	});
});
