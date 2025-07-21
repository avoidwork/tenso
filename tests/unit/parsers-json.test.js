import assert from "node:assert";
import {describe, it} from "mocha";
import {json} from "../../src/parsers/json.js";
import {EMPTY} from "../../src/core/constants.js";

/**
 * Unit tests for JSON parser module
 */
describe("parsers/json", () => {
	describe("json()", () => {
		it("should parse valid JSON string", () => {
			const input = '{"name": "test", "value": 123}';
			const expected = {name: "test", value: 123};
			const result = json(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should parse JSON array", () => {
			const input = '["a", "b", "c"]';
			const expected = ["a", "b", "c"];
			const result = json(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should parse JSON primitives", () => {
			assert.strictEqual(json('"hello"'), "hello");
			assert.strictEqual(json("123"), 123);
			assert.strictEqual(json("true"), true);
			assert.strictEqual(json("false"), false);
			assert.strictEqual(json("null"), null);
		});

		it("should parse nested JSON objects", () => {
			const input = '{"user": {"name": "John", "age": 30}, "active": true}';
			const expected = {
				user: {
					name: "John",
					age: 30
				},
				active: true
			};
			const result = json(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should handle empty string as default parameter", () => {
			assert.throws(() => {
				json();
			}, SyntaxError);
		});

		it("should handle EMPTY constant as parameter", () => {
			assert.throws(() => {
				json(EMPTY);
			}, SyntaxError);
		});

		it("should throw SyntaxError for invalid JSON", () => {
			assert.throws(() => {
				json("{invalid json}");
			}, SyntaxError);
		});

		it("should throw SyntaxError for malformed JSON", () => {
			assert.throws(() => {
				json('{"name": "test",}'); // Trailing comma
			}, SyntaxError);
		});

		it("should throw SyntaxError for unclosed objects", () => {
			assert.throws(() => {
				json('{"name": "test"'); // Missing closing brace
			}, SyntaxError);
		});

		it("should throw SyntaxError for unclosed arrays", () => {
			assert.throws(() => {
				json('["a", "b"'); // Missing closing bracket
			}, SyntaxError);
		});

		it("should parse JSON with unicode characters", () => {
			const input = '{"message": "Hello 世界", "emoji": "🌍"}';
			const expected = {message: "Hello 世界", emoji: "🌍"};
			const result = json(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should parse JSON with escaped characters", () => {
			const input = '{"path": "C:\\\\Users\\\\test", "quote": "\\"quoted\\""}';
			const expected = {path: "C:\\Users\\test", quote: '"quoted"'};
			const result = json(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should parse complex nested structure", () => {
			const input = '{"data": [{"id": 1, "items": [{"name": "test"}]}], "count": 1}';
			const expected = {
				data: [
					{
						id: 1,
						items: [
							{name: "test"}
						]
					}
				],
				count: 1
			};
			const result = json(input);

			assert.deepStrictEqual(result, expected);
		});
	});
});
