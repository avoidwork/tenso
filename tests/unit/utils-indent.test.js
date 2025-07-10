import assert from "node:assert";
import { indent } from "../../src/utils/indent.js";

describe("indent", () => {
	it("should extract indent value from string", () => {
		assert.strictEqual(indent("indent=4"), 4);
		assert.strictEqual(indent("indent=2"), 2);
		assert.strictEqual(indent("indent=0"), 0);
	});

	it("should handle larger indent values", () => {
		assert.strictEqual(indent("indent=10"), 10);
		assert.strictEqual(indent("indent=100"), 100);
	});

	it("should return fallback when no indent pattern found", () => {
		assert.strictEqual(indent("no pattern here"), 0);
		assert.strictEqual(indent("some text"), 0);
	});

	it("should use custom fallback value", () => {
		assert.strictEqual(indent("no pattern here", 5), 5);
		assert.strictEqual(indent("some text", 10), 10);
	});

	it("should handle strings with indent pattern among other text", () => {
		assert.strictEqual(indent("format=json&indent=4&sort=true"), 4);
		assert.strictEqual(indent("some text before indent=8 and after"), 8);
	});

	it("should handle empty strings", () => {
		assert.strictEqual(indent(""), 0);
		assert.strictEqual(indent("", 5), 5);
	});

	it("should handle undefined input gracefully", () => {
		assert.strictEqual(indent(undefined), 0);
		assert.strictEqual(indent(undefined, 5), 5);
	});

	it("should handle null input gracefully", () => {
		assert.strictEqual(indent(null), 0);
		assert.strictEqual(indent(null, 5), 5);
	});

	it("should handle multiple indent patterns (takes first match)", () => {
		assert.strictEqual(indent("indent=2&indent=4"), 2);
		assert.strictEqual(indent("indent=10&other=value&indent=5"), 10);
	});

	it("should handle indent pattern with different spacing", () => {
		assert.strictEqual(indent("indent= 4"), 4);
		assert.strictEqual(indent("indent =4"), 4);
		assert.strictEqual(indent("indent = 4"), 4);
	});

	it("should handle single digit indents", () => {
		assert.strictEqual(indent("indent=1"), 1);
		assert.strictEqual(indent("indent=9"), 9);
	});

	it("should handle zero indent", () => {
		assert.strictEqual(indent("indent=0"), 0);
	});

	it("should handle malformed indent patterns", () => {
		assert.strictEqual(indent("indent="), 0);
		assert.strictEqual(indent("indent=abc"), 0);
		assert.strictEqual(indent("indent="), 0);
	});

	it("should handle case variations", () => {
		assert.strictEqual(indent("INDENT=4"), 0); // Case sensitive
		assert.strictEqual(indent("Indent=4"), 0); // Case sensitive
	});

	it("should handle different fallback types", () => {
		assert.strictEqual(indent("no pattern", 0), 0);
		assert.strictEqual(indent("no pattern", -1), -1);
		assert.strictEqual(indent("no pattern", 999), 999);
	});
});
