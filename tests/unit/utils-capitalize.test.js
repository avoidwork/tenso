import assert from "node:assert";
import { capitalize } from "../../src/utils/capitalize.js";

describe("capitalize", () => {
	it("should capitalize the first letter of a string", () => {
		assert.strictEqual(capitalize("hello"), "Hello");
		assert.strictEqual(capitalize("world"), "World");
		assert.strictEqual(capitalize("a"), "A");
	});

	it("should handle empty strings", () => {
		assert.strictEqual(capitalize(""), "");
	});

	it("should handle strings that are already capitalized", () => {
		assert.strictEqual(capitalize("Hello"), "Hello");
		assert.strictEqual(capitalize("World"), "World");
	});

	it("should handle strings with multiple words when e=false", () => {
		assert.strictEqual(capitalize("hello world"), "Hello world");
		assert.strictEqual(capitalize("test string here"), "Test string here");
	});

	it("should capitalize each word when e=true", () => {
		assert.strictEqual(capitalize("hello world", true), "Hello World");
		assert.strictEqual(capitalize("test string here", true), "Test String Here");
	});

	it("should handle custom delimiter when e=true", () => {
		assert.strictEqual(capitalize("hello-world", true, "-"), "Hello-World");
		assert.strictEqual(capitalize("test_string_here", true, "_"), "Test_String_Here");
		assert.strictEqual(capitalize("a:b:c", true, ":"), "A:B:C");
	});

	it("should handle strings with numbers", () => {
		assert.strictEqual(capitalize("123abc"), "123abc");
		assert.strictEqual(capitalize("test123"), "Test123");
	});

	it("should handle strings with special characters", () => {
		assert.strictEqual(capitalize("@hello"), "@hello");
		assert.strictEqual(capitalize("$world"), "$world");
		assert.strictEqual(capitalize("!test", true), "!test");
	});

	it("should handle single character strings", () => {
		assert.strictEqual(capitalize("a"), "A");
		assert.strictEqual(capitalize("z"), "Z");
		assert.strictEqual(capitalize("1"), "1");
	});
});
