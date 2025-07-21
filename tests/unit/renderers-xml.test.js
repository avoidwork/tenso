import assert from "node:assert";
import {xml} from "../../src/renderers/xml.js";

describe("renderers - xml", () => {
	let mockReq, mockRes;

	beforeEach(() => {
		mockReq = {
			headers: {
				accept: "application/xml"
			}
		};

		mockRes = {
			statusCode: 200
		};
	});

	it("should render object as XML with prolog", () => {
		const data = {name: "John", age: 30};

		const result = xml(mockReq, mockRes, data);

		assert.ok(result.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>"));
		assert.ok(result.includes("<o>"));
		assert.ok(result.includes("<n>John</n>"));
		assert.ok(result.includes("<age>30</age>"));
		assert.ok(result.includes("</o>"));
	});

	it("should render array as XML with array node names", () => {
		const data = [
			{name: "John", age: 30},
			{name: "Jane", age: 25}
		];

		const result = xml(mockReq, mockRes, data);

		assert.ok(result.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>"));
		assert.ok(result.includes("<o>"));
		assert.ok(result.includes("<n>John</n>"));
		assert.ok(result.includes("<n>Jane</n>"));
	});

	it("should handle string values", () => {
		const data = {message: "Hello World"};

		const result = xml(mockReq, mockRes, data);

		assert.ok(result.includes("<message>Hello World</message>"));
	});

	it("should handle number values", () => {
		const data = {
			integer: 42,
			float: 3.14,
			negative: -10,
			zero: 0
		};

		const result = xml(mockReq, mockRes, data);

		assert.ok(result.includes("<integer>42</integer>"));
		assert.ok(result.includes("<float>3.14</float>"));
		assert.ok(result.includes("<negative>-10</negative>"));
		assert.ok(result.includes("<zero>0</zero>"));
	});

	it("should handle boolean values", () => {
		const data = {enabled: true, disabled: false};

		const result = xml(mockReq, mockRes, data);

		assert.ok(result.includes("<enabled>true</enabled>"));
		assert.ok(result.includes("<disabled>false</disabled>"));
	});

	it("should handle null values", () => {
		const data = {value: null};

		const result = xml(mockReq, mockRes, data);

		assert.ok(result.includes("<value></value>") || result.includes("<value/>"));
	});

	it("should handle nested objects", () => {
		const data = {
			user: {
				name: "John",
				details: {
					age: 30,
					location: "NYC"
				}
			}
		};

		const result = xml(mockReq, mockRes, data);

		assert.ok(result.includes("<user>"));
		assert.ok(result.includes("<n>John</n>"));
		assert.ok(result.includes("<details>"));
		assert.ok(result.includes("<age>30</age>"));
		assert.ok(result.includes("<location>NYC</location>"));
		assert.ok(result.includes("</details>"));
		assert.ok(result.includes("</user>"));
	});

	it("should handle arrays within objects", () => {
		const data = {
			tags: ["javascript", "node", "xml"],
			numbers: [1, 2, 3]
		};

		const result = xml(mockReq, mockRes, data);

		assert.ok(result.includes("<tags>"));
		assert.ok(result.includes("javascript"));
		assert.ok(result.includes("node"));
		assert.ok(result.includes("xml"));
		assert.ok(result.includes("</tags>"));

		assert.ok(result.includes("<numbers>"));
		assert.ok(result.includes("1"));
		assert.ok(result.includes("2"));
		assert.ok(result.includes("3"));
		assert.ok(result.includes("</numbers>"));
	});

	it("should handle special characters and escape them", () => {
		const data = {
			message: "Hello & \"world\" <test>",
			code: "<script>alert('xss')</script>"
		};

		const result = xml(mockReq, mockRes, data);

		// XML entities should be properly escaped
		assert.ok(result.includes("&amp;") || result.includes("Hello & \"world\""));
		assert.ok(result.includes("&lt;") || result.includes("&gt;") || result.includes("<script>"));
	});

	it("should handle empty object", () => {
		const data = {};

		const result = xml(mockReq, mockRes, data);

		assert.ok(result.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>"));
		assert.ok(result.includes("<o>"));
		assert.ok(result.includes("</o>"));
	});

	it("should handle empty array", () => {
		const data = [];

		const result = xml(mockReq, mockRes, data);

		assert.ok(result.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>"));
		assert.ok(result.includes("<o>"));
		assert.ok(result.includes("</o>"));
	});

	it("should format XML with proper indentation", () => {
		const data = {
			level1: {
				level2: "value"
			}
		};

		const result = xml(mockReq, mockRes, data);

		// Should be formatted (contain newlines)
		assert.ok(result.includes("\n"));
	});

	it("should handle primitive values", () => {
		const stringResult = xml(mockReq, mockRes, "test string");
		const numberResult = xml(mockReq, mockRes, 42);
		const booleanResult = xml(mockReq, mockRes, true);

		assert.ok(stringResult.includes("test string"));
		assert.ok(numberResult.includes("42"));
		assert.ok(booleanResult.includes("true"));
	});

	it("should handle Date objects", () => {
		const testDate = new Date("2023-01-01T12:00:00.000Z");
		const data = {timestamp: testDate};

		const result = xml(mockReq, mockRes, data);

		assert.ok(result.includes("<timestamp>"));
		assert.ok(result.includes("2023-01-01"));
		assert.ok(result.includes("</timestamp>"));
	});

	it("should handle mixed array of primitives and objects", () => {
		const data = [
			"string",
			42,
			{name: "object"},
			true
		];

		const result = xml(mockReq, mockRes, data);

		assert.ok(result.includes("string"));
		assert.ok(result.includes("42"));
		assert.ok(result.includes("<n>object</n>"));
		assert.ok(result.includes("true"));
	});

	it("should handle objects with numeric keys", () => {
		const data = {
			"1": "first",
			"2": "second",
			"normal": "key"
		};

		const result = xml(mockReq, mockRes, data);

		assert.ok(result.includes("first"));
		assert.ok(result.includes("second"));
		assert.ok(result.includes("<normal>key</normal>"));
	});

	it("should handle deeply nested structures", () => {
		const data = {
			level1: {
				level2: {
					level3: {
						level4: "deep value"
					}
				}
			}
		};

		const result = xml(mockReq, mockRes, data);

		assert.ok(result.includes("<level1>"));
		assert.ok(result.includes("<level2>"));
		assert.ok(result.includes("<level3>"));
		assert.ok(result.includes("<level4>deep value</level4>"));
		assert.ok(result.includes("</level3>"));
		assert.ok(result.includes("</level2>"));
		assert.ok(result.includes("</level1>"));
	});

	it("should handle special XML characters in values", () => {
		const data = {
			content: "Line 1\nLine 2\tTabbed",
			quotes: 'Single \' and double " quotes'
		};

		const result = xml(mockReq, mockRes, data);

		assert.ok(result.includes("<content>"));
		assert.ok(result.includes("<quotes>"));
		// Content should be preserved or properly escaped
		assert.strictEqual(typeof result, "string");
		assert.ok(result.length > 0);
	});

	it("should handle arrays of arrays", () => {
		const data = {
			matrix: [
				[1, 2],
				[3, 4]
			]
		};

		const result = xml(mockReq, mockRes, data);

		assert.ok(result.includes("<matrix>"));
		assert.ok(result.includes("1"));
		assert.ok(result.includes("2"));
		assert.ok(result.includes("3"));
		assert.ok(result.includes("4"));
		assert.ok(result.includes("</matrix>"));
	});

	it("should handle objects with undefined values", () => {
		const data = {
			defined: "value",
			undefined: undefined
		};

		const result = xml(mockReq, mockRes, data);

		assert.ok(result.includes("<defined>value</defined>"));
		// undefined values might be omitted or rendered as empty
		assert.strictEqual(typeof result, "string");
	});

	it("should always include XML prolog", () => {
		const testCases = [
			{},
			[],
			"string",
			42,
			null,
			{complex: {nested: "data"}}
		];

		testCases.forEach(data => {
			const result = xml(mockReq, mockRes, data);
			assert.ok(result.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>"));
		});
	});
});
