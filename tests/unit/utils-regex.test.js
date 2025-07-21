import assert from "node:assert";
import {
	bodySplit,
	collection,
	hypermedia,
	mimetype,
	trailing,
	trailingS,
	trailingSlash,
	trailingY
} from "../../src/utils/regex.js";

describe("regex", () => {
	describe("bodySplit", () => {
		it("should split on ampersand", () => {
			assert.ok(bodySplit.test("key=value&other=test"));
			assert.ok("key=value&other=test".split(bodySplit).includes("key"));
			assert.ok("key=value&other=test".split(bodySplit).includes("value"));
		});

		it("should split on equals", () => {
			assert.ok(bodySplit.test("key=value"));
			assert.ok("key=value".split(bodySplit).includes("key"));
			assert.ok("key=value".split(bodySplit).includes("value"));
		});

		it("should not match other characters", () => {
			assert.ok(!bodySplit.test("key:value"));
			assert.ok(!bodySplit.test("key-value"));
			assert.ok(!bodySplit.test("key_value"));
		});
	});

	describe("collection", () => {
		it("should match collection patterns", () => {
			const match = "/users/123".match(collection);
			assert.ok(match);
			assert.strictEqual(match[1], "/users");
			assert.strictEqual(match[2], "/123");
		});

		it("should match nested paths", () => {
			const match = "/api/v1/users/123".match(collection);
			assert.ok(match);
			assert.strictEqual(match[1], "/api/v1/users");
			assert.strictEqual(match[2], "/123");
		});

		it("should not match root path", () => {
			const match = "/".match(collection);
			assert.ok(!match);
		});

		it("should not match single segment", () => {
			const match = "/users".match(collection);
			assert.ok(!match);
		});
	});

	describe("hypermedia", () => {
		it("should match 'id' patterns", () => {
			assert.ok(hypermedia.test("id"));
			assert.ok(hypermedia.test("user_id"));
			assert.ok(hypermedia.test("account_id"));
		});

		it("should match 'url' patterns", () => {
			assert.ok(hypermedia.test("url"));
			assert.ok(hypermedia.test("profile_url"));
			assert.ok(hypermedia.test("image_url"));
		});

		it("should match 'uri' patterns", () => {
			assert.ok(hypermedia.test("uri"));
			assert.ok(hypermedia.test("resource_uri"));
			assert.ok(hypermedia.test("api_uri"));
		});

		it("should be case insensitive", () => {
			assert.ok(hypermedia.test("ID"));
			assert.ok(hypermedia.test("URL"));
			assert.ok(hypermedia.test("URI"));
			assert.ok(hypermedia.test("User_ID"));
		});

		it("should not match partial matches", () => {
			assert.ok(!hypermedia.test("identity"));
			assert.ok(!hypermedia.test("builder"));
			assert.ok(!hypermedia.test("uriBuilder"));
		});
	});

	describe("mimetype", () => {
		it("should match semicolon and beyond", () => {
			assert.ok(mimetype.test("text/html; charset=utf-8"));
			assert.ok(mimetype.test("application/json; boundary=something"));
		});

		it("should match parameters", () => {
			const result = "text/html; charset=utf-8".replace(mimetype, "");
			assert.strictEqual(result, "text/html");
		});

		it("should not match without semicolon", () => {
			assert.ok(!mimetype.test("text/html"));
			assert.ok(!mimetype.test("application/json"));
		});
	});

	describe("trailing", () => {
		it("should match underscore and beyond", () => {
			assert.ok(trailing.test("user_id"));
			assert.ok(trailing.test("account_name"));
		});

		it("should remove trailing underscore patterns", () => {
			assert.strictEqual("user_id".replace(trailing, ""), "user");
			assert.strictEqual("account_name".replace(trailing, ""), "account");
		});

		it("should not match without underscore", () => {
			assert.ok(!trailing.test("userid"));
			assert.ok(!trailing.test("accountname"));
		});
	});

	describe("trailingS", () => {
		it("should match trailing 's'", () => {
			assert.ok(trailingS.test("users"));
			assert.ok(trailingS.test("accounts"));
			assert.ok(trailingS.test("items"));
		});

		it("should remove trailing 's'", () => {
			assert.strictEqual("users".replace(trailingS, ""), "user");
			assert.strictEqual("accounts".replace(trailingS, ""), "account");
		});

		it("should not match without trailing 's'", () => {
			assert.ok(!trailingS.test("user"));
			assert.ok(!trailingS.test("account"));
		});
	});

	describe("trailingSlash", () => {
		it("should match trailing slash", () => {
			assert.ok(trailingSlash.test("/users/"));
			assert.ok(trailingSlash.test("/api/v1/"));
			assert.ok(trailingSlash.test("/"));
		});

		it("should remove trailing slash", () => {
			assert.strictEqual("/users/".replace(trailingSlash, ""), "/users");
			assert.strictEqual("/api/v1/".replace(trailingSlash, ""), "/api/v1");
		});

		it("should not match without trailing slash", () => {
			assert.ok(!trailingSlash.test("/users"));
			assert.ok(!trailingSlash.test("/api/v1"));
		});
	});

	describe("trailingY", () => {
		it("should match trailing 'y'", () => {
			assert.ok(trailingY.test("category"));
			assert.ok(trailingY.test("company"));
			assert.ok(trailingY.test("party"));
		});

		it("should remove trailing 'y'", () => {
			assert.strictEqual("category".replace(trailingY, ""), "categor");
			assert.strictEqual("company".replace(trailingY, ""), "compan");
		});

		it("should not match without trailing 'y'", () => {
			assert.ok(!trailingY.test("categories"));
			assert.ok(!trailingY.test("companies"));
		});
	});

	describe("all regex patterns", () => {
		it("should be RegExp instances", () => {
			assert.ok(bodySplit instanceof RegExp);
			assert.ok(collection instanceof RegExp);
			assert.ok(hypermedia instanceof RegExp);
			assert.ok(mimetype instanceof RegExp);
			assert.ok(trailing instanceof RegExp);
			assert.ok(trailingS instanceof RegExp);
			assert.ok(trailingSlash instanceof RegExp);
			assert.ok(trailingY instanceof RegExp);
		});

		it("should have appropriate flags", () => {
			// hypermedia should be case insensitive
			assert.ok(hypermedia.ignoreCase);

			// Others should be case sensitive
			assert.ok(!bodySplit.ignoreCase);
			assert.ok(!collection.ignoreCase);
			assert.ok(!mimetype.ignoreCase);
			assert.ok(!trailing.ignoreCase);
			assert.ok(!trailingS.ignoreCase);
			assert.ok(!trailingSlash.ignoreCase);
			assert.ok(!trailingY.ignoreCase);
		});
	});
});
