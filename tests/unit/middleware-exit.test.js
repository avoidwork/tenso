import assert from "node:assert";
import { exit } from "../../src/middleware/exit.js";

describe("middleware/exit", () => {
	let mockReq, mockRes, nextCalled, exitCalled;

	beforeEach(() => {
		exitCalled = false;
		mockReq = {
			url: "/test",
			server: {
				exit: []
			},
			exit: () => {
				exitCalled = true;
			}
		};
		mockRes = {};
		nextCalled = false;
	});

	const mockNext = () => {
		nextCalled = true;
	};

	it("should be a function", () => {
		assert.strictEqual(typeof exit, "function");
	});

	it("should call next when URL is not in exit list", () => {
		mockReq.server.exit = ["/admin", "/restricted"];
		mockReq.url = "/public";

		exit(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(exitCalled, false);
	});

	it("should call req.exit() when URL is in exit list", () => {
		mockReq.server.exit = ["/admin", "/restricted"];
		mockReq.url = "/admin";

		exit(mockReq, mockRes, mockNext);

		assert.strictEqual(exitCalled, true);
		assert.strictEqual(nextCalled, false);
	});

	it("should handle exact URL matches", () => {
		mockReq.server.exit = ["/exact/path"];
		mockReq.url = "/exact/path";

		exit(mockReq, mockRes, mockNext);

		assert.strictEqual(exitCalled, true);
		assert.strictEqual(nextCalled, false);
	});

	it("should handle partial URL matches correctly", () => {
		mockReq.server.exit = ["/admin"];
		mockReq.url = "/admin/users"; // Different from exact match

		exit(mockReq, mockRes, mockNext);

		assert.strictEqual(exitCalled, false);
		assert.strictEqual(nextCalled, true);
	});

	it("should handle empty exit list", () => {
		mockReq.server.exit = [];
		mockReq.url = "/any/path";

		exit(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(exitCalled, false);
	});

	it("should handle multiple URLs in exit list", () => {
		mockReq.server.exit = ["/admin", "/restricted", "/private"];
		mockReq.url = "/restricted";

		exit(mockReq, mockRes, mockNext);

		assert.strictEqual(exitCalled, true);
		assert.strictEqual(nextCalled, false);
	});

	it("should handle case-sensitive URL matching", () => {
		mockReq.server.exit = ["/Admin"];
		mockReq.url = "/admin";

		exit(mockReq, mockRes, mockNext);

		assert.strictEqual(exitCalled, false);
		assert.strictEqual(nextCalled, true);
	});
});
