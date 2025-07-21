import assert from "node:assert";
import { hasBody } from "../../src/utils/hasBody.js";

describe("hasBody", () => {
	it("should return true for PATCH method", () => {
		assert.strictEqual(hasBody("PATCH"), true);
	});

	it("should return true for POST method", () => {
		assert.strictEqual(hasBody("POST"), true);
	});

	it("should return true for PUT method", () => {
		assert.strictEqual(hasBody("PUT"), true);
	});

	it("should return false for GET method", () => {
		assert.strictEqual(hasBody("GET"), false);
	});

	it("should return false for HEAD method", () => {
		assert.strictEqual(hasBody("HEAD"), false);
	});

	it("should return false for DELETE method", () => {
		assert.strictEqual(hasBody("DELETE"), false);
	});

	it("should return false for OPTIONS method", () => {
		assert.strictEqual(hasBody("OPTIONS"), false);
	});

	it("should handle lowercase method names", () => {
		assert.strictEqual(hasBody("patch"), true);
		assert.strictEqual(hasBody("post"), true);
		assert.strictEqual(hasBody("put"), true);
		assert.strictEqual(hasBody("get"), false);
	});

	it("should handle mixed case method names", () => {
		assert.strictEqual(hasBody("Patch"), true);
		assert.strictEqual(hasBody("Post"), true);
		assert.strictEqual(hasBody("Put"), true);
		assert.strictEqual(hasBody("Get"), false);
	});

	it("should handle methods within strings", () => {
		assert.strictEqual(hasBody("PATCH,GET"), true);
		assert.strictEqual(hasBody("GET,POST"), true);
		assert.strictEqual(hasBody("PUT,DELETE"), true);
		assert.strictEqual(hasBody("GET,HEAD"), false);
	});

	it("should handle empty string", () => {
		assert.strictEqual(hasBody(""), false);
	});

	it("should handle undefined input", () => {
		assert.throws(() => hasBody(undefined));
	});

	it("should handle null input", () => {
		assert.throws(() => hasBody(null));
	});

	it("should handle non-standard method names", () => {
		assert.strictEqual(hasBody("CUSTOM"), false);
		assert.strictEqual(hasBody("UNKNOWN"), false);
	});

	it("should handle whitespace around method names", () => {
		assert.strictEqual(hasBody(" PATCH "), true);
		assert.strictEqual(hasBody(" POST "), true);
		assert.strictEqual(hasBody(" GET "), false);
	});
});
