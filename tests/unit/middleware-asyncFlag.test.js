import assert from "node:assert";
import { asyncFlag } from "../../src/middleware/asyncFlag.js";

describe("middleware/asyncFlag", () => {
	let mockReq, mockRes, nextCalled;

	beforeEach(() => {
		mockReq = {};
		mockRes = {};
		nextCalled = false;
	});

	const mockNext = () => {
		nextCalled = true;
	};

	it("should be a function", () => {
		assert.strictEqual(typeof asyncFlag, "function");
	});

	it("should set protectAsync to true on the request object", () => {
		asyncFlag(mockReq, mockRes, mockNext);

		assert.strictEqual(mockReq.protectAsync, true);
	});

	it("should call next middleware function", () => {
		asyncFlag(mockReq, mockRes, mockNext);

		assert.strictEqual(nextCalled, true);
	});

	it("should work with empty request object", () => {
		const emptyReq = {};
		asyncFlag(emptyReq, mockRes, mockNext);

		assert.strictEqual(emptyReq.protectAsync, true);
		assert.strictEqual(nextCalled, true);
	});

	it("should overwrite existing protectAsync value", () => {
		mockReq.protectAsync = false;
		asyncFlag(mockReq, mockRes, mockNext);

		assert.strictEqual(mockReq.protectAsync, true);
	});
});
