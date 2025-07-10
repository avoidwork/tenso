import assert from "node:assert";
import { hypermedia } from "../../src/utils/hypermedia.js";

describe("hypermedia", () => {
	let mockReq, mockRes, mockServer;

	beforeEach(() => {
		mockServer = {
			pageSize: 10,
			allowed: function (method, uri) {
				return method === "GET" && uri.startsWith("/");
			}
		};

		mockReq = {
			server: mockServer,
			url: "/users",
			method: "GET",
			hypermedia: true,
			hypermediaHeader: true,
			parsed: {
				search: "",
				searchParams: new URLSearchParams()
			}
		};

		mockRes = {
			_headers: {},
			getHeaders: function () {
				return this._headers;
			},
			header: function (name, value) {
				this._headers[name.toLowerCase()] = value;
			}
		};
	});

	it("should return null for null representation", () => {
		const result = hypermedia(mockReq, mockRes, null);
		assert.strictEqual(result, null);
	});

	it("should return original representation for non-null", () => {
		const rep = { data: { id: 1, name: "John" } };
		const result = hypermedia(mockReq, mockRes, rep);
		assert.strictEqual(result, rep);
	});

	it("should handle array data with pagination", () => {
		const rep = {
			data: Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` })),
			status: 200
		};
		mockReq.parsed.searchParams.set("page", "1");
		mockReq.parsed.searchParams.set("page_size", "10");

		const result = hypermedia(mockReq, mockRes, rep);

		assert.strictEqual(result.data.length, 10);
		assert.strictEqual(result.data[0].id, 1);
		assert.strictEqual(result.data[9].id, 10);
	});

	it("should generate pagination links", () => {
		const rep = {
			data: Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` })),
			status: 200,
			links: []
		};
		mockReq.parsed.searchParams.set("page", "2");
		mockReq.parsed.searchParams.set("page_size", "10");

		const result = hypermedia(mockReq, mockRes, rep);

		const paginationLinks = result.links.filter(link =>
			["first", "prev", "next", "last"].includes(link.rel)
		);
		assert.strictEqual(paginationLinks.length, 3); // first, prev, next
		const linkRels = paginationLinks.map(link => link.rel);
		assert.ok(linkRels.includes("first"));
		assert.ok(linkRels.includes("prev"));
		assert.ok(linkRels.includes("next"));
	});

	it("should generate last link when appropriate", () => {
		const rep = {
			data: Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` })),
			status: 200,
			links: []
		};
		mockReq.parsed.searchParams.set("page", "1");
		mockReq.parsed.searchParams.set("page_size", "10");

		const result = hypermedia(mockReq, mockRes, rep);

		const linkRels = result.links.map(link => link.rel);
		assert.ok(linkRels.includes("last"));
	});

	it("should handle page parameter defaulting to 1", () => {
		const rep = {
			data: Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` })),
			status: 200
		};

		const result = hypermedia(mockReq, mockRes, rep);

		assert.strictEqual(result.data.length, 10);
		assert.strictEqual(result.data[0].id, 1);
	});

	it("should handle page_size parameter defaulting to server pageSize", () => {
		const rep = {
			data: Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` })),
			status: 200
		};

		const result = hypermedia(mockReq, mockRes, rep);

		assert.strictEqual(result.data.length, 10); // server.pageSize
	});

	it("should handle negative page numbers", () => {
		const rep = {
			data: Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` })),
			status: 200
		};
		mockReq.parsed.searchParams.set("page", "-1");

		const result = hypermedia(mockReq, mockRes, rep);

		assert.strictEqual(result.data.length, 10);
		assert.strictEqual(result.data[0].id, 1); // Should default to page 1
	});

	it("should handle negative page_size", () => {
		const rep = {
			data: Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` })),
			status: 200
		};
		mockReq.parsed.searchParams.set("page_size", "-5");

		const result = hypermedia(mockReq, mockRes, rep);

		assert.strictEqual(result.data.length, 10); // Should default to server.pageSize
	});

	it("should handle collection links", () => {
		mockReq.url = "/users/123";
		const rep = {
			data: { id: 123, name: "John" },
			status: 200,
			links: []
		};

		const result = hypermedia(mockReq, mockRes, rep);

		const collectionLinks = result.links.filter(link => link.rel === "collection");
		assert.strictEqual(collectionLinks.length, 1);
		assert.strictEqual(collectionLinks[0].uri, "/users");
	});

	it("should handle non-array data", () => {
		const rep = {
			data: { id: 123, name: "John" },
			status: 200
		};

		const result = hypermedia(mockReq, mockRes, rep);

		assert.strictEqual(result.data, rep.data);
	});

	it("should handle existing link header", () => {
		mockRes._headers.link = '<http://example.com/users>; rel="collection"';
		const rep = {
			data: [{ id: 1, name: "John" }],
			status: 200,
			links: []
		};

		const result = hypermedia(mockReq, mockRes, rep);

		assert.ok(result.links.length > 0);
		const linkUris = result.links.map(link => link.uri);
		assert.ok(linkUris.includes("http://example.com/users"));
	});

	it("should set link header when hypermediaHeader is true", () => {
		const rep = {
			data: [{ id: 1, name: "John" }],
			status: 200,
			links: []
		};

		hypermedia(mockReq, mockRes, rep);

		assert.ok(mockRes._headers.link);
	});

	it("should not set link header when hypermediaHeader is false", () => {
		mockReq.hypermediaHeader = false;
		const rep = {
			data: [{ id: 1, name: "John" }],
			status: 200,
			links: []
		};

		hypermedia(mockReq, mockRes, rep);

		assert.ok(!mockRes._headers.link);
	});

	it("should handle item links for array data", () => {
		const rep = {
			data: [
				{ id: 1, name: "John" },
				{ id: 2, name: "Jane" }
			],
			status: 200,
			links: []
		};

		const result = hypermedia(mockReq, mockRes, rep);

		const itemLinks = result.links.filter(link => link.rel === "item");
		assert.ok(itemLinks.length > 0);
	});

	it("should handle primitive array data", () => {
		mockReq.url = "/tags";
		const rep = {
			data: ["tag1", "tag2", "tag3"],
			status: 200,
			links: []
		};

		const result = hypermedia(mockReq, mockRes, rep);

		const itemLinks = result.links.filter(link => link.rel === "item");
		assert.ok(itemLinks.length > 0);
		assert.ok(itemLinks.some(link => link.uri.includes("tag1")));
	});

	it("should handle non-GET methods", () => {
		mockReq.method = "POST";
		const rep = {
			data: Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` })),
			status: 201
		};

		const result = hypermedia(mockReq, mockRes, rep);

		assert.strictEqual(result.data.length, 25); // No pagination for non-GET
	});

	it("should handle status codes outside 200-206 range", () => {
		const rep = {
			data: Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` })),
			status: 400
		};

		const result = hypermedia(mockReq, mockRes, rep);

		assert.strictEqual(result.data.length, 25); // No pagination for error responses
	});

	it("should handle empty data arrays", () => {
		const rep = {
			data: [],
			status: 200,
			links: []
		};

		const result = hypermedia(mockReq, mockRes, rep);

		assert.strictEqual(result.data.length, 0);
		// Should not have pagination links for empty arrays
		const paginationLinks = result.links.filter(link =>
			["first", "prev", "next", "last"].includes(link.rel)
		);
		assert.strictEqual(paginationLinks.length, 0);
	});

	it("should handle single page of data", () => {
		const rep = {
			data: [{ id: 1, name: "John" }],
			status: 200,
			links: []
		};

		const result = hypermedia(mockReq, mockRes, rep);

		assert.strictEqual(result.data.length, 1);
		// Should not have pagination links for single page
		const paginationLinks = result.links.filter(link =>
			["first", "prev", "next", "last"].includes(link.rel)
		);
		assert.strictEqual(paginationLinks.length, 0);
	});

	it("should handle root path", () => {
		mockReq.url = "/";
		const rep = {
			data: { message: "API Root" },
			status: 200,
			links: []
		};

		const result = hypermedia(mockReq, mockRes, rep);

		assert.strictEqual(result.data, rep.data);
		// Should not have collection link for root
		const collectionLinks = result.links.filter(link => link.rel === "collection");
		assert.strictEqual(collectionLinks.length, 0);
	});

	it("should handle query parameters in URL", () => {
		mockReq.url = "/users?active=true";
		mockReq.parsed.search = "?active=true";
		const rep = {
			data: Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` })),
			status: 200,
			links: []
		};
		// Set page to 2 to ensure we get pagination links
		mockReq.parsed.searchParams.set("page", "2");
		mockReq.parsed.searchParams.set("page_size", "10");

		const result = hypermedia(mockReq, mockRes, rep);

		assert.strictEqual(result.data.length, 10);
		// Links should preserve query parameters
		const firstLink = result.links.find(link => link.rel === "first");
		assert.ok(firstLink);
		assert.ok(firstLink.uri.includes("active=true"));
	});

	it("should handle hypermedia disabled", () => {
		mockReq.hypermedia = false;
		const rep = {
			data: [
				{ id: 1, name: "John" },
				{ id: 2, name: "Jane" }
			],
			status: 200,
			links: []
		};

		const result = hypermedia(mockReq, mockRes, rep);

		// Should not generate item links when hypermedia is disabled
		const itemLinks = result.links.filter(link => link.rel === "item");
		assert.strictEqual(itemLinks.length, 0);
	});
});
