import assert from "node:assert";
import { auth } from "../../src/utils/auth.js";

describe("auth", () => {
	let mockObj;

	beforeEach(() => {
		mockObj = {
			host: "localhost",
			port: 8000,
			ssl: {
				cert: false,
				key: false
			},
			auth: {
				delay: 0,
				protect: [],
				unprotect: [],
				basic: {
					enabled: false,
					list: []
				},
				bearer: {
					enabled: false
				},
				jwt: {
					enabled: false
				},
				oauth2: {
					enabled: false
				},
				saml: {
					enabled: false
				},
				uri: {
					login: "/auth/login"
				}
			},
			rate: {
				enabled: false
			},
			security: {
				csrf: false,
				csp: false,
				xframe: false,
				p3p: false,
				hsts: false,
				xssProtection: false,
				nosniff: false
			},
			session: {
				store: null,
				redis: {}
			},
			ignore: function () {
				// Mock ignore function
				return this;
			},
			always: function () {
				// Mock always function
				return this;
			},
			get: function () {
				// Mock get function
				return this;
			}
		};
	});

	it("should be a function", () => {
		assert.strictEqual(typeof auth, "function");
	});

	it("should return the configuration object", () => {
		const result = auth(mockObj);
		assert.strictEqual(result, mockObj);
	});

	it("should process protect and unprotect arrays", () => {
		mockObj.auth.protect = ["admin.*", "users.*"];
		mockObj.auth.unprotect = ["public.*"];

		const result = auth(mockObj);

		assert.ok(Array.isArray(result.auth.protect));
		assert.ok(Array.isArray(result.auth.unprotect));
		assert.ok(result.auth.protect.every(item => item instanceof RegExp));
		assert.ok(result.auth.unprotect.every(item => item instanceof RegExp));
	});

	it("should handle SSL configuration", () => {
		mockObj.ssl = {
			cert: "cert-content",
			key: "key-content"
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
		// SSL configuration should be preserved
		assert.strictEqual(result.ssl.cert, "cert-content");
		assert.strictEqual(result.ssl.key, "key-content");
	});

	it("should handle basic authentication configuration", () => {
		mockObj.auth.basic = {
			enabled: true,
			list: ["admin:password", "user:test"]
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
		assert.strictEqual(result.auth.basic.enabled, true);
	});

	it("should handle bearer token authentication", () => {
		mockObj.auth.bearer = {
			enabled: true
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
		assert.strictEqual(result.auth.bearer.enabled, true);
	});

	it("should handle JWT authentication", () => {
		mockObj.auth.jwt = {
			enabled: true,
			secret: "secret-key"
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
		assert.strictEqual(result.auth.jwt.enabled, true);
	});

	it("should handle OAuth2 authentication", () => {
		mockObj.auth.oauth2 = {
			enabled: true,
			clientId: "client-id",
			clientSecret: "client-secret"
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
		assert.strictEqual(result.auth.oauth2.enabled, true);
	});

	it("should handle SAML authentication", () => {
		mockObj.auth.saml = {
			enabled: true,
			entryPoint: "https://example.com/saml"
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
		assert.strictEqual(result.auth.saml.enabled, true);
	});

	it("should handle security configurations", () => {
		mockObj.security = {
			csrf: true,
			csp: {
				defaultSrc: "'self'"
			},
			xframe: "DENY",
			p3p: "CP='NOI ADM DEV PSAi COM NAV OUR OTRo STP IND DEM'",
			hsts: {
				maxAge: 31536000
			},
			xssProtection: true,
			nosniff: true
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
		assert.strictEqual(result.security.csrf, true);
		assert.ok(result.security.csp);
		assert.strictEqual(result.security.xframe, "DENY");
	});

	it("should handle session configuration", () => {
		mockObj.session = {
			secret: "session-secret",
			store: "redis",
			redis: {
				host: "localhost",
				port: 6379
			}
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
		assert.strictEqual(result.session.store, "redis");
	});

	it("should handle rate limiting configuration", () => {
		mockObj.rate = {
			enabled: true,
			limit: 100,
			window: 900000
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
		assert.strictEqual(result.rate.enabled, true);
	});

	it("should handle different port configurations", () => {
		mockObj.port = 443;
		mockObj.ssl = {
			cert: "cert",
			key: "key"
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
		assert.strictEqual(result.port, 443);
	});

	it("should handle authentication delay", () => {
		mockObj.auth.delay = 1000;

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
		assert.strictEqual(result.auth.delay, 1000);
	});

	it("should handle empty protection arrays", () => {
		mockObj.auth.protect = [];
		mockObj.auth.unprotect = [];

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
		assert.strictEqual(result.auth.protect.length, 0);
		assert.strictEqual(result.auth.unprotect.length, 0);
	});

	it("should handle undefined protection arrays", () => {
		delete mockObj.auth.protect;
		delete mockObj.auth.unprotect;

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
		assert.ok(Array.isArray(result.auth.protect));
		assert.ok(Array.isArray(result.auth.unprotect));
	});

	it("should handle complex protection patterns", () => {
		mockObj.auth.protect = ["admin/.*", "users/[0-9]+"];
		mockObj.auth.unprotect = ["public/.*", "health"];

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
		assert.ok(result.auth.protect.every(item => item instanceof RegExp));
		assert.ok(result.auth.unprotect.every(item => item instanceof RegExp));
	});

	it("should handle middleware registration", () => {
		const middlewareCallsIgnore = [];
		const middlewareCallsAlways = [];

		mockObj.ignore = function (middleware) {
			middlewareCallsIgnore.push(middleware);

			return this;
		};

		mockObj.always = function (middleware) {
			middlewareCallsAlways.push(middleware);

			return this;
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
		assert.ok(middlewareCallsIgnore.length > 0);
		assert.ok(middlewareCallsAlways.length > 0);
	});
});
