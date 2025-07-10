import assert from "node:assert";
import { json } from "../../src/parsers/json.js";

describe("parsers/json", () => {
	it("should be a function", () => {
		assert.strictEqual(typeof json, "function");
	});

	it("should parse valid JSON string", () => {
		const input = '{"key": "value", "number": 123}';
		const expected = { key: "value", number: 123 };
		const result = json(input);

		assert.deepStrictEqual(result, expected);
	});

	it("should parse JSON array", () => {
		const input = '[{"id": 1}, {"id": 2}]';
		const expected = [{ id: 1 }, { id: 2 }];
		const result = json(input);

		assert.deepStrictEqual(result, expected);
	});

	it("should parse JSON primitive values", () => {
		assert.strictEqual(json('"hello"'), "hello");
		assert.strictEqual(json("123"), 123);
		assert.strictEqual(json("true"), true);
		assert.strictEqual(json("false"), false);
		assert.strictEqual(json("null"), null);
	});

	it("should parse nested JSON objects", () => {
		const input = '{"user": {"name": "John", "age": 30}, "active": true}';
		const expected = { user: { name: "John", age: 30 }, active: true };
		const result = json(input);

		assert.deepStrictEqual(result, expected);
	});

	it("should handle empty object", () => {
		const result = json("{}");
		assert.deepStrictEqual(result, {});
	});

	it("should handle empty array", () => {
		const result = json("[]");
		assert.deepStrictEqual(result, []);
	});

	it("should throw SyntaxError for invalid JSON", () => {
		assert.throws(() => json('{"invalid": json}'), SyntaxError);
		assert.throws(() => json("{invalid}"), SyntaxError);
		assert.throws(() => json('{"unclosed": "string}'), SyntaxError);
		assert.throws(() => json("undefined"), SyntaxError);
	});

	it("should throw SyntaxError for empty string when no default", () => {
		assert.throws(() => json(""), SyntaxError);
	});

	it("should handle undefined parameter (uses EMPTY default)", () => {
		assert.throws(() => json(), SyntaxError);
	});

	it("should parse complex nested structures", () => {
		const input = JSON.stringify({
			users: [
				{ id: 1, profile: { name: "Alice", tags: ["admin", "user"] } },
				{ id: 2, profile: { name: "Bob", tags: ["user"] } }
			],
			metadata: { total: 2, timestamp: "2023-01-01T00:00:00Z" }
		});

		const result = json(input);

		assert.strictEqual(result.users.length, 2);
		assert.strictEqual(result.users[0].profile.name, "Alice");
		assert.deepStrictEqual(result.users[0].profile.tags, ["admin", "user"]);
		assert.strictEqual(result.metadata.total, 2);
	});

	it("should handle JSON with special characters and unicode", () => {
		const input = '{"message": "Hello\\nWorld\\t!", "emoji": "🚀", "escaped": "\\"quoted\\""}';
		const result = json(input);

		assert.strictEqual(result.message, "Hello\nWorld\t!");
		assert.strictEqual(result.emoji, "🚀");
		assert.strictEqual(result.escaped, '"quoted"');
	});

	it("should preserve number precision", () => {
		const input = '{"integer": 42, "float": 3.14159, "scientific": 1.23e-4}';
		const result = json(input);

		assert.strictEqual(result.integer, 42);
		assert.strictEqual(result.float, 3.14159);
		assert.strictEqual(result.scientific, 1.23e-4);
	});
});
