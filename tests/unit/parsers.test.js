import assert from "node:assert";
import { describe, it, beforeEach } from "mocha";
import { tenso } from "../../dist/tenso.js";

describe("Parsers", () => {
	let app;

	beforeEach(() => {
		app = tenso({ maxListeners: 60, logging: { enabled: false } });
	});

	describe("JSON Parser", () => {
		let jsonParser;

		beforeEach(() => {
			jsonParser = app.parsers.get("application/json");
		});

		it("should parse valid JSON string", () => {
			const input = '{"name": "test", "value": 123}';
			const result = jsonParser(input);

			assert.deepStrictEqual(result, { name: "test", value: 123 });
		});

		it("should parse JSON array", () => {
			const input = '[1, 2, 3, "test"]';
			const result = jsonParser(input);

			assert.deepStrictEqual(result, [1, 2, 3, "test"]);
		});

		it("should parse JSON primitive values", () => {
			assert.strictEqual(jsonParser("null"), null);
			assert.strictEqual(jsonParser("true"), true);
			assert.strictEqual(jsonParser("false"), false);
			assert.strictEqual(jsonParser("123"), 123);
			assert.strictEqual(jsonParser('"hello"'), "hello");
		});

		it("should parse empty JSON object", () => {
			const result = jsonParser("{}");
			assert.deepStrictEqual(result, {});
		});

		it("should parse empty JSON array", () => {
			const result = jsonParser("[]");
			assert.deepStrictEqual(result, []);
		});

		it("should handle empty string input", () => {
			// Empty string is not valid JSON and should throw
			assert.throws(() => {
				jsonParser("");
			}, SyntaxError);
		});

		it("should handle default parameter", () => {
			// Undefined input should throw
			assert.throws(() => {
				jsonParser();
			}, SyntaxError);
		});

		it("should handle malformed JSON", () => {
			assert.throws(() => {
				jsonParser('{"incomplete": }');
			}, SyntaxError);

			assert.throws(() => {
				jsonParser('{"missing_value":}');
			}, SyntaxError);

			assert.throws(() => {
				jsonParser('{"trailing_comma": "value",}');
			}, SyntaxError);
		});

		it("should handle JSON with special characters", () => {
			const input = '{"unicode": "🚀", "newline": "line1\\nline2", "quote": "\\"quoted\\""}';
			const result = jsonParser(input);

			assert.strictEqual(result.unicode, "🚀");
			assert.strictEqual(result.newline, "line1\nline2");
			assert.strictEqual(result.quote, '"quoted"');
		});

		it("should handle deeply nested JSON", () => {
			const input = '{"level1": {"level2": {"level3": {"value": "deep"}}}}';
			const result = jsonParser(input);

			assert.strictEqual(result.level1.level2.level3.value, "deep");
		});

		it("should handle large JSON strings", () => {
			const largeObj = {};
			for (let i = 0; i < 100; i++) {
				largeObj[`key${i}`] = `value${i}`;
			}
			const input = JSON.stringify(largeObj);
			const result = jsonParser(input);

			assert.strictEqual(Object.keys(result).length, 100);
			assert.strictEqual(result.key0, "value0");
			assert.strictEqual(result.key99, "value99");
		});
	});

	describe("JSONL (JSON Lines) Parser", () => {
		let jsonlParser;

		beforeEach(() => {
			jsonlParser = app.parsers.get("application/jsonl");
		});

		it("should parse single JSON line", () => {
			const input = '{"name": "test"}';
			const result = jsonlParser(input);

			assert(Array.isArray(result));
			assert.strictEqual(result.length, 1);
			assert.strictEqual(result[0].name, "test");
		});

		it("should parse multiple JSON lines", () => {
			const input = '{"name": "alice"}\n{"name": "bob"}';
			const result = jsonlParser(input);

			assert(Array.isArray(result));
			assert.strictEqual(result.length, 2);
			assert.strictEqual(result[0].name, "alice");
			assert.strictEqual(result[1].name, "bob");
		});

		it("should parse mixed JSON types in lines", () => {
			const input = '{"name": "alice"}\n[1, 2, 3]';

			// This is actually valid JSONL - each line is valid JSON
			const result = jsonlParser(input);

			assert(Array.isArray(result));
			assert.strictEqual(result.length, 2);
			assert.deepStrictEqual(result[0], { name: "alice" });
			assert.deepStrictEqual(result[1], [1, 2, 3]);
		});

		it("should handle empty lines gracefully", () => {
			const input = '{"name": "alice"}\n\n{"name": "bob"}';
			const result = jsonlParser(input);

			assert(Array.isArray(result));
			assert.strictEqual(result.length, 2);
			assert.strictEqual(result[0].name, "alice");
			assert.strictEqual(result[1].name, "bob");
		});

		it("should handle lines with whitespace", () => {
			const input = '{"name": "alice"}\n  \n{"name": "bob"}';

			// The parser should handle whitespace-only lines gracefully
			const result = jsonlParser(input);

			assert(Array.isArray(result));
			assert.strictEqual(result.length, 2);
			assert.strictEqual(result[0].name, "alice");
			assert.strictEqual(result[1].name, "bob");
		});

		it("should handle single line without newline", () => {
			const input = '{"single": "line"}';
			const result = jsonlParser(input);

			assert(Array.isArray(result));
			assert.strictEqual(result.length, 1);
			assert.strictEqual(result[0].single, "line");
		});

		it("should handle CRLF line endings", () => {
			const input = '{"name": "alice"}\r\n{"name": "bob"}';
			const result = jsonlParser(input);

			assert(Array.isArray(result));
			assert.strictEqual(result.length, 2);
			assert.strictEqual(result[0].name, "alice");
			assert.strictEqual(result[1].name, "bob");
		});

		it("should handle complex JSON objects in lines", () => {
			const input = '{"user": {"id": 1, "name": "alice"}, "active": true}\n{"user": {"id": 2, "name": "bob"}, "active": false}';
			const result = jsonlParser(input);

			assert(Array.isArray(result));
			assert.strictEqual(result.length, 2);
			assert.strictEqual(result[0].user.name, "alice");
			assert.strictEqual(result[0].active, true);
			assert.strictEqual(result[1].user.name, "bob");
			assert.strictEqual(result[1].active, false);
		});
	});

	describe("x-www-form-urlencoded Parser", () => {
		let formParser;

		beforeEach(() => {
			formParser = app.parsers.get("application/x-www-form-urlencoded");
		});

		it("should parse simple form data", () => {
			const input = "name=test&value=123";
			const result = formParser(input);

			assert.strictEqual(result.name, "test");
			assert.strictEqual(result.value, 123);
		});

		it("should parse form data with special characters", () => {
			const input = "name=John%20Doe&email=john%40example.com";
			const result = formParser(input);

			assert.strictEqual(result.name, "John Doe");
			assert.strictEqual(result.email, "john@example.com");
		});

		it("should parse form data with arrays", () => {
			const input = "items[]=first&items[]=second&items[]=third";
			const result = formParser(input);

			// Current parser doesn't support array syntax, last value wins
			assert.strictEqual(result["items[]"], "third");
		});

		it("should parse nested form data", () => {
			const input = "user[name]=test&user[email]=test@example.com";
			const result = formParser(input);

			// Current parser treats brackets as literal key names, not nested objects
			assert.strictEqual(result["user[name]"], "test");
			assert.strictEqual(result["user[email]"], "test@example.com");
		});

		it("should handle empty values", () => {
			const input = "empty=&name=test&blank=";
			const result = formParser(input);

			assert.strictEqual(result.empty, "");
			assert.strictEqual(result.name, "test");
			assert.strictEqual(result.blank, "");
		});

		it("should handle duplicate keys", () => {
			const input = "name=first&name=second";
			const result = formParser(input);

			// Depending on implementation, this might be an array or just the last value
			// Most form parsers will create an array for duplicate keys
			if (Array.isArray(result.name)) {
				assert.strictEqual(result.name.length, 2);
				assert.strictEqual(result.name[0], "first");
				assert.strictEqual(result.name[1], "second");
			} else {
				assert.strictEqual(result.name, "second");
			}
		});

		it("should handle complex encoded data", () => {
			// Test with JSON-like structures that are URL-encoded
			const input = "array=%5B1%2C2%2C3%5D&data=%7B%22name%22%3A%22test%22%7D";
			const result = formParser(input);

			// The parser uses coercion, so JSON-like strings are parsed
			assert.deepStrictEqual(result.array, [1, 2, 3]);
			assert.deepStrictEqual(result.data, { name: "test" });
		});

		it("should handle malformed form data", () => {
			const input = "valid=test&malformed&another=value";
			const result = formParser(input);

			assert.strictEqual(result.valid, "test");
			assert.strictEqual(result.another, "value");
			// The malformed part should be handled gracefully
		});

		it("should handle empty input", () => {
			const result = formParser("");
			assert.strictEqual(typeof result, "object");
		});

		it("should handle input with only separators", () => {
			const input = "&&&";
			const result = formParser(input);
			assert.strictEqual(typeof result, "object");
		});
	});

	describe("Parsers Map", () => {
		it("should have correct number of parsers", () => {
			// The parsers map should contain the expected parsers
			assert.strictEqual(app.parsers.size, 5);
		});

		it("should have JSON parser", () => {
			assert(app.parsers.has("application/json"));
			assert.strictEqual(typeof app.parsers.get("application/json"), "function");
		});

		it("should have JSONL parsers", () => {
			assert(app.parsers.has("application/jsonl"));
			assert(app.parsers.has("application/json-lines"));
			assert(app.parsers.has("text/json-lines"));
		});

		it("should have form parser", () => {
			assert(app.parsers.has("application/x-www-form-urlencoded"));
			assert.strictEqual(typeof app.parsers.get("application/x-www-form-urlencoded"), "function");
		});

		it("should allow custom parser registration", () => {
			const customParser = data => ({ custom: data });
			app.parser("application/custom", customParser);

			assert(app.parsers.has("application/custom"));
			assert.strictEqual(app.parsers.get("application/custom"), customParser);
		});

		it("should override existing parsers", () => {
			const originalParser = app.parsers.get("application/json");
			const newParser = data => ({ overridden: data });

			app.parser("application/json", newParser);

			assert.strictEqual(app.parsers.get("application/json"), newParser);
			assert.notStrictEqual(app.parsers.get("application/json"), originalParser);
		});
	});
});
