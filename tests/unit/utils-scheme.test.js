import assert from "node:assert";
import { scheme } from "../../src/utils/scheme.js";

describe("scheme", () => {
	it("should return true for strings containing slash", () => {
		assert.strictEqual(scheme("http://example.com"), true);
		assert.strictEqual(scheme("https://example.com"), true);
		assert.strictEqual(scheme("/path/to/file"), true);
		assert.strictEqual(scheme("folder/file.txt"), true);
	});

	it("should return true for strings starting with URI_SCHEME character", () => {
		// Assuming URI_SCHEME is ':' based on common URI patterns
		assert.strictEqual(scheme(":test"), true);
		assert.strictEqual(scheme(":"), true);
		assert.strictEqual(scheme(":path"), true);
	});

	it("should return false for strings without slash or URI_SCHEME", () => {
		assert.strictEqual(scheme("filename"), false);
		assert.strictEqual(scheme("test"), false);
		assert.strictEqual(scheme("example.com"), false);
	});

	it("should return false for empty strings", () => {
		assert.strictEqual(scheme(""), false);
	});

	it("should handle undefined input gracefully", () => {
		assert.strictEqual(scheme(undefined), false);
	});

	it("should handle null input gracefully", () => {
		assert.strictEqual(scheme(null), false);
	});

	it("should handle strings with slash in the middle", () => {
		assert.strictEqual(scheme("hello/world"), true);
		assert.strictEqual(scheme("test/file.txt"), true);
	});

	it("should handle strings with slash at the end", () => {
		assert.strictEqual(scheme("directory/"), true);
		assert.strictEqual(scheme("folder/"), true);
	});

	it("should handle strings with slash at the beginning", () => {
		assert.strictEqual(scheme("/root"), true);
		assert.strictEqual(scheme("/"), true);
	});

	it("should handle HTTP and HTTPS URLs", () => {
		assert.strictEqual(scheme("http://www.example.com"), true);
		assert.strictEqual(scheme("https://www.example.com"), true);
		assert.strictEqual(scheme("ftp://files.example.com"), true);
	});

	it("should handle file paths", () => {
		assert.strictEqual(scheme("./file.txt"), true);
		assert.strictEqual(scheme("../parent/file.txt"), true);
		assert.strictEqual(scheme("folder/subfolder/file.txt"), true);
	});

	it("should handle absolute paths", () => {
		assert.strictEqual(scheme("/usr/bin/node"), true);
		assert.strictEqual(scheme("/home/user/documents"), true);
	});

	it("should handle Windows-style paths", () => {
		assert.strictEqual(scheme("C:/Users/test"), true);
		assert.strictEqual(scheme("folder\\subfolder"), false); // backslash, not forward slash
	});

	it("should handle query parameters and fragments", () => {
		assert.strictEqual(scheme("http://example.com?param=value"), true);
		assert.strictEqual(scheme("http://example.com#fragment"), true);
	});

	it("should handle protocol-relative URLs", () => {
		assert.strictEqual(scheme("//example.com"), true);
	});

	it("should handle special characters", () => {
		assert.strictEqual(scheme("file@name"), false);
		assert.strictEqual(scheme("file+name"), false);
		assert.strictEqual(scheme("file-name"), false);
		assert.strictEqual(scheme("file_name"), false);
	});

	it("should handle numeric strings", () => {
		assert.strictEqual(scheme("123"), false);
		assert.strictEqual(scheme("123/456"), true);
	});

	it("should handle single characters", () => {
		assert.strictEqual(scheme("a"), false);
		assert.strictEqual(scheme("/"), true);
		assert.strictEqual(scheme(":"), true);
	});

	it("should handle mixed content", () => {
		assert.strictEqual(scheme("hello/world:test"), true);
		assert.strictEqual(scheme("test:hello/world"), true);
	});
});
