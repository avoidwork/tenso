import assert from "node:assert";
import { redirect } from "../../src/middleware/redirect.js";

describe("middleware/redirect", () => {
	let mockReq, mockRes, redirectCalled, redirectUrl, redirectForced;

	beforeEach(() => {
		mockReq = {
			server: {
				auth: {
					uri: {
						redirect: "/auth/login"
					}
				}
			}
		};
		mockRes = {
			redirect: (url, force) => {
				redirectCalled = true;
				redirectUrl = url;
				redirectForced = force;
			}
		};
		redirectCalled = false;
		redirectUrl = null;
		redirectForced = null;
	});

	it("should be a function", () => {
		assert.strictEqual(typeof redirect, "function");
	});

	it("should call res.redirect with auth redirect URI", () => {
		redirect(mockReq, mockRes);

		assert.strictEqual(redirectCalled, true);
		assert.strictEqual(redirectUrl, "/auth/login");
		assert.strictEqual(redirectForced, false);
	});

	it("should handle custom redirect URI", () => {
		mockReq.server.auth.uri.redirect = "/custom/auth";

		redirect(mockReq, mockRes);

		assert.strictEqual(redirectCalled, true);
		assert.strictEqual(redirectUrl, "/custom/auth");
		assert.strictEqual(redirectForced, false);
	});

	it("should handle complex redirect URLs", () => {
		mockReq.server.auth.uri.redirect = "/auth/oauth/callback?provider=google";

		redirect(mockReq, mockRes);

		assert.strictEqual(redirectCalled, true);
		assert.strictEqual(redirectUrl, "/auth/oauth/callback?provider=google");
		assert.strictEqual(redirectForced, false);
	});

	it("should handle absolute URLs", () => {
		mockReq.server.auth.uri.redirect = "https://example.com/auth";

		redirect(mockReq, mockRes);

		assert.strictEqual(redirectCalled, true);
		assert.strictEqual(redirectUrl, "https://example.com/auth");
		assert.strictEqual(redirectForced, false);
	});

	it("should always pass false as the force parameter", () => {
		redirect(mockReq, mockRes);

		assert.strictEqual(redirectForced, false);
	});

	it("should handle empty redirect URI", () => {
		mockReq.server.auth.uri.redirect = "";

		redirect(mockReq, mockRes);

		assert.strictEqual(redirectCalled, true);
		assert.strictEqual(redirectUrl, "");
		assert.strictEqual(redirectForced, false);
	});

	it("should handle undefined redirect URI", () => {
		mockReq.server.auth.uri.redirect = undefined;

		redirect(mockReq, mockRes);

		assert.strictEqual(redirectCalled, true);
		assert.strictEqual(redirectUrl, undefined);
		assert.strictEqual(redirectForced, false);
	});

	it("should not call next middleware (terminates request)", () => {
		// The redirect function doesn't accept a next parameter
		redirect(mockReq, mockRes);

		assert.strictEqual(redirectCalled, true);
	});
});
