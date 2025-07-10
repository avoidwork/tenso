import assert from "node:assert";
import { explode } from "../../src/utils/explode.js";

describe("explode", () => {
	it("should split string by comma by default", () => {
		const result = explode("a,b,c");
		assert.deepStrictEqual(result, ["a", "b", "c"]);
	});

	it("should trim whitespace around each piece", () => {
		const result = explode("a, b , c");
		assert.deepStrictEqual(result, ["a", "b", "c"]);
	});

	it("should handle custom delimiters", () => {
		const result = explode("a|b|c", "|");
		assert.deepStrictEqual(result, ["a", "b", "c"]);
	});

	it("should handle custom delimiters with whitespace", () => {
		const result = explode("a | b | c", "|");
		assert.deepStrictEqual(result, ["a", "b", "c"]);
	});

	it("should handle empty string input", () => {
		const result = explode("");
		assert.deepStrictEqual(result, [""]);
	});

	it("should handle single element", () => {
		const result = explode("hello");
		assert.deepStrictEqual(result, ["hello"]);
	});

	it("should handle single element with whitespace", () => {
		const result = explode("  hello  ");
		assert.deepStrictEqual(result, ["hello"]);
	});

	it("should handle multiple spaces as delimiter", () => {
		const result = explode("a   b   c", " ");
		assert.deepStrictEqual(result, ["a", "b", "c"]);
	});

	it("should handle dot as delimiter", () => {
		const result = explode("a.b.c", ".");
		assert.deepStrictEqual(result, ["a", "b", "c"]);
	});

	it("should handle hyphen as delimiter", () => {
		const result = explode("a-b-c", "-");
		assert.deepStrictEqual(result, ["a", "b", "c"]);
	});

	it("should handle semicolon as delimiter", () => {
		const result = explode("a;b;c", ";");
		assert.deepStrictEqual(result, ["a", "b", "c"]);
	});

	it("should handle empty pieces", () => {
		const result = explode("a,,c");
		assert.deepStrictEqual(result, ["a", "", "c"]);
	});

	it("should handle delimiter at start", () => {
		const result = explode(",a,b");
		assert.deepStrictEqual(result, ["", "a", "b"]);
	});

	it("should handle delimiter at end", () => {
		const result = explode("a,b,");
		assert.deepStrictEqual(result, ["a", "b", ""]);
	});

	it("should handle multiple consecutive delimiters", () => {
		const result = explode("a,,,b");
		assert.deepStrictEqual(result, ["a", "", "", "b"]);
	});

	it("should handle no delimiter provided with default", () => {
		const result = explode("a,b,c");
		assert.deepStrictEqual(result, ["a", "b", "c"]);
	});

	it("should handle undefined input gracefully", () => {
		const result = explode(undefined);
		assert.deepStrictEqual(result, [""]);
	});

	it("should handle null input gracefully", () => {
		const result = explode(null);
		assert.deepStrictEqual(result, [""]);
	});
});
