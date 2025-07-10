import assert from "node:assert";
import { jsonl } from "../../src/parsers/jsonl.js";

describe("parsers/jsonl", () => {
	it("should be a function", () => {
		assert.strictEqual(typeof jsonl, "function");
	});

	it("should parse single line JSON", () => {
		const input = '{"name": "Alice", "age": 30}';
		const result = jsonl(input);

		assert.ok(Array.isArray(result));
		assert.strictEqual(result.length, 1);
		assert.deepStrictEqual(result[0], { name: "Alice", age: 30 });
	});

	it("should parse multiple lines of JSON", () => {
		const input = `{"id": 1, "name": "Alice"}
{"id": 2, "name": "Bob"}
{"id": 3, "name": "Charlie"}`;
		const result = jsonl(input);

		assert.ok(Array.isArray(result));
		assert.strictEqual(result.length, 3);
		assert.deepStrictEqual(result[0], { id: 1, name: "Alice" });
		assert.deepStrictEqual(result[1], { id: 2, name: "Bob" });
		assert.deepStrictEqual(result[2], { id: 3, name: "Charlie" });
	});

	it("should handle empty lines", () => {
		const input = `{"id": 1}

{"id": 2}`;
		const result = jsonl(input);

		assert.ok(Array.isArray(result));
		assert.strictEqual(result.length, 2);
		assert.deepStrictEqual(result[0], { id: 1 });
		assert.deepStrictEqual(result[1], { id: 2 });
	});

	it("should parse different JSON object types on each line", () => {
		const input = `{"type": "object", "value": {"nested": true}}
{"type": "user", "data": {"name": "Alice", "age": 30}}
{"type": "config", "settings": {"theme": "dark", "language": "en"}}
{"type": "empty", "data": {}}
{"type": "metadata", "flags": {"active": true, "verified": false}}
{"type": "result", "output": null}`;
		const result = jsonl(input);

		assert.strictEqual(result.length, 6);
		assert.deepStrictEqual(result[0], { type: "object", value: { nested: true } });
		assert.deepStrictEqual(result[1], { type: "user", data: { name: "Alice", age: 30 } });
		assert.deepStrictEqual(result[2], { type: "config", settings: { theme: "dark", language: "en" } });
		assert.deepStrictEqual(result[3], { type: "empty", data: {} });
		assert.deepStrictEqual(result[4], { type: "metadata", flags: { active: true, verified: false } });
		assert.deepStrictEqual(result[5], { type: "result", output: null });
	});

	it("should handle empty string input", () => {
		const result = jsonl("");
		assert.ok(Array.isArray(result));
		assert.strictEqual(result.length, 0);
	});

	it("should handle undefined parameter (uses EMPTY default)", () => {
		const result = jsonl();
		assert.ok(Array.isArray(result));
		assert.strictEqual(result.length, 0);
	});

	it("should handle trailing newlines", () => {
		const input = `{"id": 1}
{"id": 2}
`;
		const result = jsonl(input);

		assert.strictEqual(result.length, 2);
		assert.deepStrictEqual(result[0], { id: 1 });
		assert.deepStrictEqual(result[1], { id: 2 });
	});

	it("should throw error for invalid JSON line", () => {
		const input = `{"valid": "json"}
{invalid json}`;

		assert.throws(() => jsonl(input), Error);
	});

	it("should parse complex objects on each line", () => {
		const input = `{"user": {"id": 1, "profile": {"name": "Alice", "preferences": {"theme": "dark"}}}, "timestamp": "2023-01-01"}
{"user": {"id": 2, "profile": {"name": "Bob", "preferences": {"theme": "light"}}}, "timestamp": "2023-01-02"}`;

		const result = jsonl(input);

		assert.strictEqual(result.length, 2);
		assert.strictEqual(result[0].user.id, 1);
		assert.strictEqual(result[0].user.profile.name, "Alice");
		assert.strictEqual(result[0].user.profile.preferences.theme, "dark");
		assert.strictEqual(result[1].user.id, 2);
		assert.strictEqual(result[1].user.profile.name, "Bob");
		assert.strictEqual(result[1].user.profile.preferences.theme, "light");
	});

	it("should handle objects with different structures", () => {
		const input = `{"items": [1, 2, 3], "count": 3}
{"nested": {"object": true}, "text": "string", "number": 42}
{"empty": {}, "list": []}`;

		const result = jsonl(input);

		assert.strictEqual(result.length, 3);
		assert.deepStrictEqual(result[0], { items: [1, 2, 3], count: 3 });
		assert.deepStrictEqual(result[1], { nested: { object: true }, text: "string", number: 42 });
		assert.deepStrictEqual(result[2], { empty: {}, list: [] });
	});

	it("should preserve special characters and unicode", () => {
		const input = `{"message": "Hello\\nWorld", "emoji": "🌟"}
{"path": "/home/user", "quote": "\\"escaped\\""}`;

		const result = jsonl(input);

		assert.strictEqual(result.length, 2);
		assert.strictEqual(result[0].message, "Hello\nWorld");
		assert.strictEqual(result[0].emoji, "🌟");
		assert.strictEqual(result[1].path, "/home/user");
		assert.strictEqual(result[1].quote, '"escaped"');
	});

	it("should handle numeric precision correctly", () => {
		const input = `{"int": 42, "float": 3.14159, "scientific": 1.23e-10}
{"bigNum": 999999999999999, "smallNum": 0.000000001}`;

		const result = jsonl(input);

		assert.strictEqual(result[0].int, 42);
		assert.strictEqual(result[0].float, 3.14159);
		assert.strictEqual(result[0].scientific, 1.23e-10);
		assert.strictEqual(result[1].bigNum, 999999999999999);
		assert.strictEqual(result[1].smallNum, 0.000000001);
	});
});
