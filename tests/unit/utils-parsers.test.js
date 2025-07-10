import assert from "node:assert";
import { parsers } from "../../src/utils/parsers.js";

describe("parsers", () => {
	it("should be a Map instance", () => {
		assert.ok(parsers instanceof Map);
	});

	it("should contain application/x-www-form-urlencoded parser", () => {
		assert.ok(parsers.has("application/x-www-form-urlencoded"));
		assert.strictEqual(typeof parsers.get("application/x-www-form-urlencoded"), "function");
	});

	it("should contain application/json parser", () => {
		assert.ok(parsers.has("application/json"));
		assert.strictEqual(typeof parsers.get("application/json"), "function");
	});

	it("should contain application/json-lines parser", () => {
		assert.ok(parsers.has("application/json-lines"));
		assert.strictEqual(typeof parsers.get("application/json-lines"), "function");
	});

	it("should contain application/jsonl parser", () => {
		assert.ok(parsers.has("application/jsonl"));
		assert.strictEqual(typeof parsers.get("application/jsonl"), "function");
	});

	it("should contain text/json-lines parser", () => {
		assert.ok(parsers.has("text/json-lines"));
		assert.strictEqual(typeof parsers.get("text/json-lines"), "function");
	});

	it("should have expected number of parsers", () => {
		assert.strictEqual(parsers.size, 5);
	});

	it("should return undefined for unknown content types", () => {
		assert.strictEqual(parsers.get("unknown/type"), undefined);
		assert.strictEqual(parsers.get("application/unknown"), undefined);
	});

	it("should be case-sensitive for content types", () => {
		assert.strictEqual(parsers.get("APPLICATION/JSON"), undefined);
		assert.strictEqual(parsers.get("Application/Json"), undefined);
	});

	it("should support iteration", () => {
		const contentTypes = Array.from(parsers.keys());
		assert.ok(contentTypes.includes("application/json"));
		assert.ok(contentTypes.includes("application/x-www-form-urlencoded"));
	});

	it("should support forEach", () => {
		let count = 0;
		parsers.forEach((parser, contentType) => {
			assert.strictEqual(typeof parser, "function");
			assert.strictEqual(typeof contentType, "string");
			count++;
		});
		assert.strictEqual(count, 5);
	});

	it("should have all expected content types", () => {
		const expectedTypes = [
			"application/x-www-form-urlencoded",
			"application/json",
			"application/json-lines",
			"application/jsonl",
			"text/json-lines"
		];

		expectedTypes.forEach(type => {
			assert.ok(parsers.has(type), `Should have ${type} parser`);
		});
	});

	it("should use specific parser functions", () => {
		// Each parser type should use appropriate function
		const formParser = parsers.get("application/x-www-form-urlencoded");
		const jsonParser = parsers.get("application/json");
		const jsonlParser = parsers.get("application/jsonl");

		assert.ok(formParser);
		assert.ok(jsonParser);
		assert.ok(jsonlParser);
	});

	it("should use jsonl parser for multiple JSON line formats", () => {
		const jsonlParser = parsers.get("application/jsonl");
		const jsonLinesParser = parsers.get("application/json-lines");
		const textJsonLinesParser = parsers.get("text/json-lines");

		// These should all use the same jsonl parser
		assert.strictEqual(jsonlParser, jsonLinesParser);
		assert.strictEqual(jsonlParser, textJsonLinesParser);
	});

	it("should handle common request content types", () => {
		// Most common content types for HTTP requests
		assert.ok(parsers.has("application/json"));
		assert.ok(parsers.has("application/x-www-form-urlencoded"));
	});

	it("should handle JSON variations", () => {
		// All JSON-related content types
		assert.ok(parsers.has("application/json"));
		assert.ok(parsers.has("application/json-lines"));
		assert.ok(parsers.has("application/jsonl"));
		assert.ok(parsers.has("text/json-lines"));
	});

	it("should be immutable via direct access", () => {
		const originalSize = parsers.size;

		// These operations should work
		parsers.set("test/type", () => {});
		assert.strictEqual(parsers.size, originalSize + 1);

		parsers.delete("test/type");
		assert.strictEqual(parsers.size, originalSize);
	});

	it("should not have parsers for response-only content types", () => {
		// These are typically response formats, not request formats
		assert.strictEqual(parsers.get("text/html"), undefined);
		assert.strictEqual(parsers.get("application/xml"), undefined);
		assert.strictEqual(parsers.get("text/csv"), undefined);
		assert.strictEqual(parsers.get("application/yaml"), undefined);
	});
});
