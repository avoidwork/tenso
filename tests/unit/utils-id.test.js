import assert from "node:assert";
import { id } from "../../src/utils/id.js";

describe("id", () => {
	it("should return true for 'id' string", () => {
		assert.strictEqual(id("id"), true);
	});

	it("should return true for '_id' string", () => {
		assert.strictEqual(id("_id"), true);
	});

	it("should return true for 'ID' string (case insensitive)", () => {
		assert.strictEqual(id("ID"), true);
	});

	it("should return true for '_ID' string (case insensitive)", () => {
		assert.strictEqual(id("_ID"), true);
	});

	it("should return true for mixed case variations", () => {
		assert.strictEqual(id("Id"), true);
		assert.strictEqual(id("iD"), true);
		assert.strictEqual(id("_Id"), true);
		assert.strictEqual(id("_iD"), true);
	});

	it("should return true for strings ending with 'id'", () => {
		assert.strictEqual(id("userid"), true);
		assert.strictEqual(id("accountid"), true);
		assert.strictEqual(id("testid"), true);
	});

	it("should return true for strings ending with '_id'", () => {
		assert.strictEqual(id("user_id"), true);
		assert.strictEqual(id("account_id"), true);
		assert.strictEqual(id("test_id"), true);
	});

	it("should return false for strings not matching ID patterns", () => {
		assert.strictEqual(id("name"), false);
		assert.strictEqual(id("email"), false);
		assert.strictEqual(id("description"), false);
	});

	it("should return false for strings containing 'id' but not ending with it", () => {
		assert.strictEqual(id("identity"), false);
		assert.strictEqual(id("identifier"), false);
		assert.strictEqual(id("video"), false);
	});

	it("should return false for empty strings", () => {
		assert.strictEqual(id(""), false);
	});

	it("should handle undefined input gracefully", () => {
		assert.strictEqual(id(undefined), false);
	});

	it("should handle null input gracefully", () => {
		assert.strictEqual(id(null), false);
	});

	it("should handle numeric strings", () => {
		assert.strictEqual(id("123"), false);
		assert.strictEqual(id("123id"), true);
	});

	it("should handle special characters", () => {
		assert.strictEqual(id("user-id"), false);
		assert.strictEqual(id("user.id"), false);
		assert.strictEqual(id("user@id"), false);
	});

	it("should handle whitespace", () => {
		assert.strictEqual(id(" id "), false);
		assert.strictEqual(id("id "), false);
		assert.strictEqual(id(" id"), false);
	});

	it("should handle very long strings ending with id", () => {
		assert.strictEqual(id("verylongstringendingwithid"), true);
		assert.strictEqual(id("verylongstringendingwith_id"), true);
	});
});
