import assert from "node:assert";
import { hasRead } from "../../src/utils/hasRead.js";

describe("hasRead", () => {
	it("should return true for GET method", () => {
		assert.strictEqual(hasRead("GET"), true);
	});

	it("should return true for HEAD method", () => {
		assert.strictEqual(hasRead("HEAD"), true);
	});

	it("should return true for OPTIONS method", () => {
		assert.strictEqual(hasRead("OPTIONS"), true);
	});

	it("should return false for POST method", () => {
		assert.strictEqual(hasRead("POST"), false);
	});

	it("should return false for PUT method", () => {
		assert.strictEqual(hasRead("PUT"), false);
	});

	it("should return false for PATCH method", () => {
		assert.strictEqual(hasRead("PATCH"), false);
	});

	it("should return false for DELETE method", () => {
		assert.strictEqual(hasRead("DELETE"), false);
	});

	it("should handle lowercase method names", () => {
		assert.strictEqual(hasRead("get"), true);
		assert.strictEqual(hasRead("head"), true);
		assert.strictEqual(hasRead("options"), true);
		assert.strictEqual(hasRead("post"), false);
	});

	it("should handle mixed case method names", () => {
		assert.strictEqual(hasRead("Get"), true);
		assert.strictEqual(hasRead("Head"), true);
		assert.strictEqual(hasRead("Options"), true);
		assert.strictEqual(hasRead("Post"), false);
	});

	it("should handle methods within strings", () => {
		assert.strictEqual(hasRead("GET,POST"), true);
		assert.strictEqual(hasRead("HEAD,PUT"), true);
		assert.strictEqual(hasRead("OPTIONS,DELETE"), true);
		assert.strictEqual(hasRead("POST,PUT"), false);
	});

	it("should handle empty string", () => {
		assert.strictEqual(hasRead(""), false);
	});

	it("should handle undefined input", () => {
		assert.throws(() => hasRead(undefined));
	});

	it("should handle null input", () => {
		assert.throws(() => hasRead(null));
	});

	it("should handle non-standard method names", () => {
		assert.strictEqual(hasRead("CUSTOM"), false);
		assert.strictEqual(hasRead("UNKNOWN"), false);
	});

	it("should handle whitespace around method names", () => {
		assert.strictEqual(hasRead(" GET "), true);
		assert.strictEqual(hasRead(" HEAD "), true);
		assert.strictEqual(hasRead(" POST "), false);
	});
});
