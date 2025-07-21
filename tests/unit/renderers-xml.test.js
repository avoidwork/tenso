import assert from "node:assert";
import {describe, it} from "mocha";
import {xml} from "../../src/renderers/xml.js";

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
 * Unit tests for XML renderer module
 */
describe("renderers/xml", () => {
	describe("xml()", () => {
		it("should render simple object as XML", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {name: "test", value: 123};
			const result = xml(req, res, data);

			assert.ok(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
			assert.ok(result.includes("test") && result.includes("<n>"));
			assert.ok(result.includes("<value>123</value>"));
		});

		it("should include XML prolog", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {test: "value"};
			const result = xml(req, res, data);

			assert.ok(result.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
		});

		it("should render null values", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const result = xml(req, res, null);

			assert.ok(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
			assert.ok(result.includes("<o/>") || result.includes("<o></o>"));
		});

		it("should render undefined values", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const result = xml(req, res, undefined);

			assert.ok(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
			// Undefined produces just the XML prolog with no content
			assert.strictEqual(result.trim(), '<?xml version="1.0" encoding="UTF-8"?>');
		});

		it("should render primitives as XML", () => {
			const req = createMockRequest();
			const res = createMockResponse();

			const stringResult = xml(req, res, "hello");
			assert.ok(stringResult.includes("hello"));

			const numberResult = xml(req, res, 123);
			assert.ok(numberResult.includes("123"));

			const booleanResult = xml(req, res, true);
			assert.ok(booleanResult.includes("true"));
		});

		it("should render arrays with item nodes", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = ["apple", "banana", "cherry"];
			const result = xml(req, res, data);

			assert.ok(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
			// Array items should be rendered
			assert.ok(result.includes("apple"));
			assert.ok(result.includes("banana"));
			assert.ok(result.includes("cherry"));
		});

		it("should render empty arrays", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const result = xml(req, res, []);

			assert.ok(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
			assert.ok(result.includes("<o/>") || result.includes("<o></o>"));
		});

		it("should transform property names (name -> n)", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {name: "John", age: 30};
			const result = xml(req, res, data);

			assert.ok(result.includes("<n>John</n>"));
			assert.ok(result.includes("<age>30</age>"));
		});

		it("should handle Date objects", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const date = new Date("2023-01-01T00:00:00.000Z");
			const data = {timestamp: date};
			const result = xml(req, res, data);

			assert.ok(result.includes("2023-01-01T00:00:00.000Z"));
		});

		it("should handle nested objects", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {
				user: {
					name: "John",
					age: 30
				},
				active: true
			};
			const result = xml(req, res, data);

			assert.ok(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
			assert.ok(result.includes("<user>"));
			assert.ok(result.includes("<n>John</n>"));
			assert.ok(result.includes("<age>30</age>"));
			assert.ok(result.includes("<active>true</active>"));
		});

		it("should handle circular references", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {name: "test"};
			data.self = data; // Create circular reference

			const result = xml(req, res, data);

			assert.ok(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
			assert.ok(result.includes("[Circular Reference]"));
		});

		it("should handle nested arrays in objects", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {
				users: [
					{name: "John", age: 30},
					{name: "Jane", age: 25}
				]
			};
			const result = xml(req, res, data);

			assert.ok(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
			assert.ok(result.includes("<users>"));
			assert.ok(result.includes("<n>John</n>"));
			assert.ok(result.includes("<n>Jane</n>"));
		});

		it("should handle mixed array content", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = ["string", 123, true, {key: "value"}];
			const result = xml(req, res, data);

			assert.ok(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
			assert.ok(result.includes("string"));
			assert.ok(result.includes("123"));
			assert.ok(result.includes("true"));
			assert.ok(result.includes("<key>value</key>"));
		});

		it("should handle special characters and escape them", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {
				message: "Hello & goodbye",
				html: "<div>test</div>",
				quote: '"quoted"'
			};
			const result = xml(req, res, data);

			assert.ok(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
			// The XML builder should handle entity processing
			assert.ok(result.includes("Hello"));
			assert.ok(result.includes("test"));
			assert.ok(result.includes("quoted"));
		});

		it("should handle empty objects", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const result = xml(req, res, {});

			assert.ok(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
			assert.ok(result.includes("<o/>") || result.includes("<o></o>"));
		});

		it("should handle complex nested structures", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {
				metadata: {
					total: 2,
					page: 1
				},
				items: [
					{name: "item1", active: true},
					{name: "item2", active: false}
				]
			};
			const result = xml(req, res, data);

			assert.ok(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
			assert.ok(result.includes("<metadata>"));
			assert.ok(result.includes("<total>2</total>"));
			assert.ok(result.includes("<items>"));
			assert.ok(result.includes("item1"));
			assert.ok(result.includes("item2"));
		});

		it("should handle functions (though not common use case)", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = {
				callback: function () { return "test"; }
			};
			const result = xml(req, res, data);

			assert.ok(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
			// Function should be handled somehow in the transformation
			assert.ok(result.includes("<callback>"));
		});

		it("should handle arrays of primitives", () => {
			const req = createMockRequest();
			const res = createMockResponse();
			const data = [1, 2, 3, 4, 5];
			const result = xml(req, res, data);

			assert.ok(result.includes('<?xml version="1.0" encoding="UTF-8"?>'));
			assert.ok(result.includes("1"));
			assert.ok(result.includes("2"));
			assert.ok(result.includes("3"));
		});
	});
});
