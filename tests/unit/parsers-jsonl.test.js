import assert from "node:assert";
import {describe, it} from "mocha";
import {jsonl} from "../../src/parsers/jsonl.js";
import {EMPTY} from "../../src/core/constants.js";

/**
 * Unit tests for JSONL (JSON Lines) parser module
 */
describe("parsers/jsonl", () => {
	describe("jsonl()", () => {
		it("should parse single line JSON object", () => {
			const input = '{"name": "test", "value": 123}';
			const expected = [{name: "test", value: 123}];
			const result = jsonl(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should parse multiple line JSON objects", () => {
			const input = '{"name": "first", "id": 1}\n{"name": "second", "id": 2}';
			const expected = [
				{name: "first", id: 1},
				{name: "second", id: 2}
			];
			const result = jsonl(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should handle CRLF line endings", () => {
			const input = '{"name": "first", "id": 1}\r\n{"name": "second", "id": 2}';
			const expected = [
				{name: "first", id: 1},
				{name: "second", id: 2}
			];
			const result = jsonl(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should handle mixed line endings", () => {
			const input = '{"name": "first", "id": 1}\r\n{"name": "second", "id": 2}\n{"name": "third", "id": 3}';
			const expected = [
				{name: "first", id: 1},
				{name: "second", id: 2},
				{name: "third", id: 3}
			];
			const result = jsonl(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should return empty array for empty string", () => {
			const result = jsonl("");
			assert.deepStrictEqual(result, []);
		});

		it("should return empty array for EMPTY constant", () => {
			const result = jsonl(EMPTY);
			assert.deepStrictEqual(result, []);
		});

		it("should return empty array for null input", () => {
			const result = jsonl(null);
			assert.deepStrictEqual(result, []);
		});

		it("should return empty array for undefined input", () => {
			const result = jsonl(undefined);
			assert.deepStrictEqual(result, []);
		});

		it("should return empty array for no parameters", () => {
			const result = jsonl();
			assert.deepStrictEqual(result, []);
		});

		it("should parse JSON primitives", () => {
			const input = '{"value": "hello"}\n{"value": 123}\n{"value": true}\n{"value": false}\n{"value": null}';
			const expected = [
				{value: "hello"},
				{value: 123},
				{value: true},
				{value: false},
				{value: null}
			];
			const result = jsonl(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should parse objects with array values", () => {
			const input = '{"items": ["a", "b", "c"]}\n{"items": ["x", "y", "z"]}';
			const expected = [
				{items: ["a", "b", "c"]},
				{items: ["x", "y", "z"]}
			];
			const result = jsonl(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should handle trailing newline", () => {
			const input = '{"name": "test1"}\n{"name": "test2"}\n';
			const expected = [
				{name: "test1"},
				{name: "test2"}
			];
			const result = jsonl(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should handle leading newline", () => {
			const input = '\n{"name": "test1"}\n{"name": "test2"}';
			const expected = [
				{name: "test1"},
				{name: "test2"}
			];
			const result = jsonl(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should parse complex nested objects", () => {
			const input = '{"user": {"name": "John", "age": 30}, "active": true}\n{"user": {"name": "Jane", "age": 25}, "active": false}';
			const expected = [
				{user: {name: "John", age: 30}, active: true},
				{user: {name: "Jane", age: 25}, active: false}
			];
			const result = jsonl(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should handle unicode characters", () => {
			const input = '{"message": "Hello 世界"}\n{"emoji": "🌍"}';
			const expected = [
				{message: "Hello 世界"},
				{emoji: "🌍"}
			];
			const result = jsonl(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should throw error for invalid JSON lines", () => {
			const input = '{"valid": true}\n{invalid json}\n{"also_valid": true}';

			assert.throws(() => {
				jsonl(input);
			}, Error);
		});

		it("should handle empty lines gracefully", () => {
			const input = '{"first": 1}\n\n{"second": 2}';
			const expected = [
				{first: 1},
				{second: 2}
			];
			const result = jsonl(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should parse large number of lines", () => {
			const lines = [];
			const expected = [];

			for (let i = 0; i < 1000; i++) {
				lines.push(`{"id": ${i}, "value": "item${i}"}`);
				expected.push({id: i, value: `item${i}`});
			}

			const input = lines.join("\n");
			const result = jsonl(input);

			assert.deepStrictEqual(result, expected);
		});
	});
});
