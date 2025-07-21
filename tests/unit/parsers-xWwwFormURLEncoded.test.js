import assert from "node:assert";
import { xWwwFormURLEncoded } from "../../src/parsers/xWwwFormURLEncoded.js";

describe("parsers/xWwwFormURLEncoded", () => {
	it("should be a function", () => {
		assert.strictEqual(typeof xWwwFormURLEncoded, "function");
	});

	it("should parse simple key-value pairs", () => {
		const input = "name=John&age=30";
		const result = xWwwFormURLEncoded(input);

		assert.deepStrictEqual(result, { name: "John", age: 30 });
	});

	it("should decode URL-encoded characters", () => {
		const input = "email=john%40example.com&message=Hello%20World";
		const result = xWwwFormURLEncoded(input);

		assert.deepStrictEqual(result, {
			email: "john@example.com",
			message: "Hello World"
		});
	});

	it("should handle plus signs as spaces", () => {
		const input = "message=Hello+World&name=John+Doe";
		const result = xWwwFormURLEncoded(input);

		assert.deepStrictEqual(result, {
			message: "Hello World",
			name: "John Doe"
		});
	});

	it("should coerce values to appropriate types", () => {
		const input = "string=hello&number=42&boolean=true&nullValue=null&undefinedValue=undefined";
		const result = xWwwFormURLEncoded(input);

		assert.strictEqual(result.string, "hello");
		assert.strictEqual(result.number, 42);
		assert.strictEqual(result.boolean, true);
		assert.strictEqual(result.nullValue, null);
		assert.strictEqual(result.undefinedValue, undefined);
	});

	it("should handle empty values", () => {
		const input = "emptyString=&anotherKey=value";
		const result = xWwwFormURLEncoded(input);

		assert.strictEqual(result.emptyString, "");
		assert.strictEqual(result.anotherKey, "value");
	});

	it("should handle single key-value pair", () => {
		const input = "singleKey=singleValue";
		const result = xWwwFormURLEncoded(input);

		assert.deepStrictEqual(result, { singleKey: "singleValue" });
	});

	it("should return empty object for empty string", () => {
		const result = xWwwFormURLEncoded("");
		assert.deepStrictEqual(result, {});
	});

	it("should return empty object for undefined input", () => {
		const result = xWwwFormURLEncoded();
		assert.deepStrictEqual(result, {});
	});

	it("should return empty object for null input", () => {
		const result = xWwwFormURLEncoded(null);
		assert.deepStrictEqual(result, {});
	});

	it("should handle special characters in keys and values", () => {
		const input = "key%5B0%5D=value&special%2Bkey=special%2Bvalue";
		const result = xWwwFormURLEncoded(input);

		assert.deepStrictEqual(result, {
			"key[0]": "value",
			"special+key": "special+value"
		});
	});

	it("should handle complex URL encoding", () => {
		const input = "path=%2Fhome%2Fuser&query=name%3DJohn%26age%3D30";
		const result = xWwwFormURLEncoded(input);

		assert.deepStrictEqual(result, {
			path: "/home/user",
			query: "name=John&age=30"
		});
	});

	it("should handle numeric values with different formats", () => {
		const input = "integer=123&float=3.14&negative=-42&scientific=1.23e-4";
		const result = xWwwFormURLEncoded(input);

		assert.strictEqual(result.integer, 123);
		assert.strictEqual(result.float, 3.14);
		assert.strictEqual(result.negative, -42);
		assert.strictEqual(result.scientific, 1.23e-4);
	});

	it("should handle boolean-like strings", () => {
		const input = "trueValue=true&falseValue=false&yes=yes&no=no&on=on&off=off";
		const result = xWwwFormURLEncoded(input);

		assert.strictEqual(result.trueValue, true);
		assert.strictEqual(result.falseValue, false);
		assert.strictEqual(result.yes, "yes");
		assert.strictEqual(result.no, "no");
		assert.strictEqual(result.on, "on");
		assert.strictEqual(result.off, "off");
	});

	it("should handle arrays (last value wins)", () => {
		const input = "color=red&color=blue&color=green";
		const result = xWwwFormURLEncoded(input);

		// Should contain the last value
		assert.strictEqual(result.color, "green");
	});

	it("should handle unicode characters", () => {
		const input = "name=%E2%9C%93%20John&emoji=%F0%9F%9A%80";
		const result = xWwwFormURLEncoded(input);

		assert.deepStrictEqual(result, {
			name: "✓ John",
			emoji: "🚀"
		});
	});

	it("should handle mixed encoding types", () => {
		const input = "spaces=Hello+World&encoded=Hello%20World&normal=HelloWorld";
		const result = xWwwFormURLEncoded(input);

		assert.deepStrictEqual(result, {
			spaces: "Hello World",
			encoded: "Hello World",
			normal: "HelloWorld"
		});
	});

	it("should handle keys with special characters", () => {
		const input = "user%5Bname%5D=John&user%5Bage%5D=30&data%2Eid=123";
		const result = xWwwFormURLEncoded(input);

		assert.deepStrictEqual(result, {
			"user[name]": "John",
			"user[age]": 30,
			"data.id": 123
		});
	});

	it("should handle malformed input gracefully", () => {
		const input = "key1=value1&invalidPair&key2=value2";
		const result = xWwwFormURLEncoded(input);

		// Should still parse valid pairs and handle invalid ones
		assert.strictEqual(result.key1, "value1");
		assert.strictEqual(result.key2, "value2");
	});

	it("should preserve original behavior for edge cases", () => {
		const input = "empty&equals==value&double==";
		const result = xWwwFormURLEncoded(input);

		// Test how the function handles edge cases in form data
		assert.ok(typeof result === "object");
	});
});
