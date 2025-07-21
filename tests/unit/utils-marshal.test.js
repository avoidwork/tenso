import assert from "node:assert";
import { marshal } from "../../src/utils/marshal.js";

describe("marshal", () => {
	let mockServer, seen, links;

	beforeEach(() => {
		mockServer = {
			allowed: function (method, uri) {
				// Mock allowing GET requests for most URIs
				return method === "GET" && uri.startsWith("/");
			}
		};
		seen = new Set();
		links = [];
	});

	it("should return null for empty objects", () => {
		const obj = {};
		const result = marshal(obj, "item", "users", "http://example.com", seen, links, mockServer);
		assert.strictEqual(result, null);
	});

	it("should return original object for non-empty objects", () => {
		const obj = { name: "John", age: 30 };
		const result = marshal(obj, "item", "users", "http://example.com", seen, links, mockServer);
		assert.strictEqual(result, obj);
	});

	it("should detect id-like keys and generate links", () => {
		const obj = { id: 123, name: "John" };
		const result = marshal(obj, "item", "users", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 1);
		assert.strictEqual(links[0].uri, "/users/123");
		assert.strictEqual(links[0].rel, "item");
	});

	it("should detect _id keys and generate links", () => {
		const obj = { _id: "abc123", name: "John" };
		const result = marshal(obj, "item", "users", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 1);
		assert.strictEqual(links[0].uri, "/users/abc123");
		assert.strictEqual(links[0].rel, "item");
	});

	it("should detect user_id keys and generate links", () => {
		const obj = { user_id: 456, name: "John" };
		const result = marshal(obj, "item", "users", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 1);
		assert.strictEqual(links[0].uri, "/users/456");
		assert.strictEqual(links[0].rel, "item");
	});

	it("should detect url keys and generate related links", () => {
		const obj = { profile_url: "profiles/123", name: "John" };
		const result = marshal(obj, "item", "users", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 1);
		assert.strictEqual(links[0].uri, "/profiles/123");
		assert.strictEqual(links[0].rel, "related");
	});

	it("should detect uri keys and generate related links", () => {
		const obj = { resource_uri: "resources/456", name: "John" };
		const result = marshal(obj, "item", "users", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 1);
		assert.strictEqual(links[0].uri, "/resources/456");
		assert.strictEqual(links[0].rel, "related");
	});

	it("should handle hypermedia keys ending with 's' - convert to singular", () => {
		const obj = { category_urls: "categories/123", name: "John" };
		const result = marshal(obj, "item", "users", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 1);
		assert.strictEqual(links[0].uri, "/categories/123");
		assert.strictEqual(links[0].rel, "related");
	});

	it("should handle hypermedia keys ending with 'y' - convert to 'ies'", () => {
		const obj = { category_url: "categories/123", name: "John" };
		const result = marshal(obj, "item", "users", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 1);
		assert.strictEqual(links[0].uri, "/categories/123");
		assert.strictEqual(links[0].rel, "related");
	});

	it("should handle spaces in URIs by encoding them", () => {
		const obj = { id: "test item", name: "John" };
		const result = marshal(obj, "item", "users", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 1);
		assert.strictEqual(links[0].uri, "/users/test%20item");
		assert.strictEqual(links[0].rel, "item");
	});

	it("should handle collection names with spaces", () => {
		const obj = { id: 123, name: "John" };
		const result = marshal(obj, "item", "user profiles", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 1);
		assert.strictEqual(links[0].uri, "/user%20profiles/123");
		assert.strictEqual(links[0].rel, "item");
	});

	it("should not add duplicate links", () => {
		const obj = { id: 123, name: "John" };
		seen.add("/users/123");

		const result = marshal(obj, "item", "users", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 0);
	});

	it("should not add links when server doesn't allow GET", () => {
		const obj = { id: 123, name: "John" };
		mockServer.allowed = () => false;

		const result = marshal(obj, "item", "users", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 0);
	});

	it("should handle already absolute URIs", () => {
		const obj = { profile_url: "http://example.com/profiles/123", name: "John" };
		const result = marshal(obj, "item", "users", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 0); // Should not add link for absolute URI
	});

	it("should handle URI that equals root", () => {
		const obj = { id: 123, name: "John" };
		const result = marshal(obj, "item", "users", "/users/123", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 0); // Should not add link when URI equals root
	});

	it("should handle null values", () => {
		const obj = { id: null, name: "John" };
		const result = marshal(obj, "item", "users", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 0);
	});

	it("should handle undefined values", () => {
		const obj = { id: undefined, name: "John" };
		const result = marshal(obj, "item", "users", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 0);
	});

	it("should handle multiple hypermedia keys", () => {
		const obj = {
			id: 123,
			user_id: 456,
			profile_url: "profiles/789",
			name: "John"
		};
		const result = marshal(obj, "item", "users", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 3);

		// Check that different link types are created
		const linkUris = links.map(link => link.uri);
		assert.ok(linkUris.includes("/users/123"));
		assert.ok(linkUris.includes("/users/456"));
		assert.ok(linkUris.includes("/profiles/789"));
	});

	it("should handle collection starting with slash", () => {
		const obj = { id: 123, name: "John" };
		const result = marshal(obj, "item", "/users", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 1);
		assert.strictEqual(links[0].uri, "/users/123");
		assert.strictEqual(links[0].rel, "item");
	});

	it("should handle numeric IDs as strings", () => {
		const obj = { id: "123", name: "John" };
		const result = marshal(obj, "item", "users", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 1);
		assert.strictEqual(links[0].uri, "/users/123");
		assert.strictEqual(links[0].rel, "item");
	});

	it("should handle default rel parameter", () => {
		const obj = { profile_url: "profiles/123", name: "John" };
		const result = marshal(obj, undefined, "users", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 1);
		assert.strictEqual(links[0].rel, "related");
	});

	it("should handle boolean values", () => {
		const obj = { active: true, name: "John" };
		const result = marshal(obj, "item", "users", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 0);
	});

	it("should handle objects with only non-hypermedia keys", () => {
		const obj = { name: "John", age: 30, active: true };
		const result = marshal(obj, "item", "users", "http://example.com", seen, links, mockServer);

		assert.strictEqual(result, obj);
		assert.strictEqual(links.length, 0);
	});
});
