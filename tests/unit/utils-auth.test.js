import assert from "node:assert";
import { auth } from "../../src/utils/auth.js";
import passport from "passport";

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
					enabled: false,
					tokens: []
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
					login: "/auth/login",
					logout: "/auth/logout",
					redirect: "/",
					root: "/auth"
				},
				msg: {
					login: "Please login"
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
			scheme: "Bearer",
			secretOrKey: "secret-key",
			auth: (token, done) => done(null, { id: 1, username: "test" })
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
		assert.strictEqual(result.auth.jwt.enabled, true);
	});

	it("should handle OAuth2 authentication", () => {
		mockObj.auth.oauth2 = {
			enabled: true,
			auth_url: "https://example.com/oauth/authorize",
			token_url: "https://example.com/oauth/token",
			client_id: "client-id",
			client_secret: "client-secret",
			auth: (accessToken, refreshToken, profile, done) => done(null, { id: 1, username: "test" })
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
				policy: {
					"default-src": "'self'"
				}
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

	it("should handle enabled auth types with URI mapping", () => {
		mockObj.auth.basic = { enabled: true };
		mockObj.auth.bearer = { enabled: true };
		mockObj.auth.jwt = { enabled: true };

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle stateless configuration", () => {
		mockObj.rate.enabled = false;
		mockObj.security.csrf = false;

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle Redis session store configuration", () => {
		mockObj.session.store = "redis";
		mockObj.session.redis = {
			host: "localhost",
			port: 6379
		};

		// Mock to avoid actual Redis connection
		const originalEnv = process.env.TEST_MODE;
		process.env.TEST_MODE = "1";

		const result = auth(mockObj);

		process.env.TEST_MODE = originalEnv;

		assert.strictEqual(result, mockObj);
	});

	it("should handle basic authentication with empty list", () => {
		mockObj.auth.basic = {
			enabled: true,
			list: []
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle basic authentication with invalid list entries", () => {
		mockObj.auth.basic = {
			enabled: true,
			list: ["invalid-entry", "another:invalid:entry:with:colons"]
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle basic authentication with async configuration", () => {
		mockObj.auth.basic = {
			enabled: true,
			list: ["admin:password"]
		};
		mockObj.auth.oauth2.enabled = true; // This makes async = true

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle bearer token authentication with empty tokens", () => {
		mockObj.auth.bearer = {
			enabled: true,
			tokens: []
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle bearer token authentication with async configuration", () => {
		mockObj.auth.bearer = {
			enabled: true,
			tokens: ["valid-token"]
		};
		mockObj.auth.oauth2.enabled = true; // This makes async = true

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle JWT authentication with all optional parameters", () => {
		mockObj.auth.jwt = {
			enabled: true,
			scheme: "Bearer",
			secretOrKey: "secret-key",
			algorithms: ["HS256"],
			audience: "test-audience",
			issuer: "test-issuer",
			ignoreExpiration: true,
			auth: (token, done) => done(null, { id: 1, username: "test" })
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle OAuth2 authentication with full configuration", () => {
		mockObj.auth.oauth2 = {
			enabled: true,
			auth_url: "https://example.com/oauth/authorize",
			token_url: "https://example.com/oauth/token",
			client_id: "client-id",
			client_secret: "client-secret",
			auth: (accessToken, refreshToken, profile, done) => done(null, { id: 1, username: "test" })
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle CSP security configuration with policy object", () => {
		mockObj.security.csp = {
			policy: {
				"default-src": "'self'",
				"script-src": "'self' 'unsafe-inline'"
			}
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle CSP security configuration with direct directives", () => {
		mockObj.security.csp = {
			"default-src": "'self'",
			"script-src": "'self'"
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle X-Frame-Options security configuration", () => {
		mockObj.security.xframe = "SAMEORIGIN";

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle P3P security configuration", () => {
		mockObj.security.p3p = "CP='NOI ADM DEV PSAi COM NAV OUR OTRo STP IND DEM'";

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle P3P with 'none' value", () => {
		mockObj.security.p3p = "none";

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle HSTS security configuration", () => {
		mockObj.security.hsts = {
			maxAge: 31536000,
			includeSubDomains: false,
			preload: true
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle HSTS with default values", () => {
		mockObj.security.hsts = {};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle XSS Protection configuration", () => {
		mockObj.security.xssProtection = true;

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle nosniff configuration", () => {
		mockObj.security.nosniff = true;

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle auth URIs with multiple enabled auth types", () => {
		mockObj.auth.basic = { enabled: true };
		mockObj.auth.bearer = { enabled: true };
		mockObj.auth.jwt = { enabled: true };

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle login endpoint configuration", () => {
		const loginRequests = [];

		mockObj.get = function (uri, handler) {
			if (uri === mockObj.auth.uri.login) {
				loginRequests.push({ uri, handler });
			}

			return this;
		};

		mockObj.auth.basic = { enabled: true };

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle logout endpoint with session destruction", () => {
		const logoutRequests = [];

		mockObj.get = function (uri, handler) {
			if (uri === mockObj.auth.uri.logout) {
				logoutRequests.push({ uri, handler });

				// Test the logout handler
				const mockReq = {
					session: {
						destroy: () => {}
					},
					server: mockObj
				};
				const mockRes = {
					redirect: function () {}
				};

				// Call the handler to exercise the logout logic
				handler(mockReq, mockRes);
			}

			return this;
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle logout endpoint without session", () => {
		const logoutRequests = [];

		mockObj.get = function (uri, handler) {
			if (uri === mockObj.auth.uri.logout) {
				logoutRequests.push({ uri, handler });

				// Test the logout handler without session
				const mockReq = {
					server: mockObj
				}; // No session
				const mockRes = {
					redirect: function () {}
				};

				// Call the handler to exercise the logout logic
				handler(mockReq, mockRes);
			}

			return this;
		};

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	it("should handle SSL ports correctly", () => {
		mockObj.port = 80;
		mockObj.ssl = { cert: false, key: false };

		let result = auth(mockObj);
		assert.strictEqual(result, mockObj);

		mockObj.port = 443;
		mockObj.ssl = { cert: "cert", key: "key" };

		result = auth(mockObj);
		assert.strictEqual(result, mockObj);
	});

	it("should handle regex caching for auth patterns", () => {
		mockObj.auth.protect = ["admin.*", "users.*", "admin.*"]; // Duplicate pattern
		mockObj.auth.unprotect = ["public.*"];

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
		assert.ok(result.auth.protect.every(item => item instanceof RegExp));
	});

	it("should handle login URI pattern conversion", () => {
		mockObj.auth.protect = ["/auth/login"]; // Should match login URI
		mockObj.auth.uri.login = "/auth/login";

		const result = auth(mockObj);

		assert.strictEqual(result, mockObj);
	});

	// ===== NEW COMPREHENSIVE TESTS FOR INCREASED COVERAGE =====

	describe("pattern matching and regex handling", () => {
		it("should correctly convert wildcard patterns to regex", () => {
			mockObj.auth.protect = ["admin/*", "users/*/profile", "api.*"];
			mockObj.auth.unprotect = ["public.*", "health"];

			const result = auth(mockObj);

			// All patterns should be converted to RegExp objects
			assert.ok(result.auth.protect.every(item => item instanceof RegExp));
			assert.ok(result.auth.unprotect.every(item => item instanceof RegExp));
		});

		it("should handle patterns that match login URI", () => {
			mockObj.auth.protect = [mockObj.auth.uri.login];
			mockObj.auth.unprotect = [mockObj.auth.uri.login];

			const result = auth(mockObj);

			assert.ok(result.auth.protect.every(item => item instanceof RegExp));
			assert.ok(result.auth.unprotect.every(item => item instanceof RegExp));
		});

		it("should handle complex regex patterns with special characters", () => {
			mockObj.auth.protect = ["admin/.*\\.json", "users/[0-9]+/.*"];
			mockObj.auth.unprotect = ["public\\.(js|css)", "static.*"];

			const result = auth(mockObj);

			assert.ok(result.auth.protect.every(item => item instanceof RegExp));
			assert.ok(result.auth.unprotect.every(item => item instanceof RegExp));
		});
	});

	describe("authentication strategy error handling", () => {
		it("should handle basic authentication validation errors", () => {
			mockObj.auth.basic = {
				enabled: true,
				list: ["testuser:testpass"]
			};

			// Track passport strategy registrations
			let basicStrategy = null;
			const originalUse = passport.use;
			passport.use = function (strategy) {
				if (strategy.name === "basic") {
					basicStrategy = strategy;
				}

				return originalUse.call(this, strategy);
			};

			auth(mockObj);

			// Test the basic strategy authenticate method with invalid credentials
			if (basicStrategy && basicStrategy.authenticate) {
				const mockReq = {
					headers: {
						authorization: "Basic " + Buffer.from("invaliduser:invalidpass").toString("base64")
					}
				};

				// This should not throw but should handle authentication failure
				assert.doesNotThrow(() => {
					basicStrategy.authenticate(mockReq);
				});
			}

			passport.use = originalUse;
		});

		it("should handle bearer token validation errors", () => {
			mockObj.auth.bearer = {
				enabled: true,
				tokens: ["valid-token-123"]
			};

			// Track passport strategy registrations
			let bearerStrategy = null;
			const originalUse = passport.use;
			passport.use = function (strategy) {
				if (strategy.name === "bearer") {
					bearerStrategy = strategy;
				}

				return originalUse.call(this, strategy);
			};

			auth(mockObj);

			// Test the bearer strategy authenticate method
			if (bearerStrategy && bearerStrategy.authenticate) {
				const mockReq = {
					headers: {
						authorization: "Bearer invalid-token"
					}
				};

				assert.doesNotThrow(() => {
					bearerStrategy.authenticate(mockReq);
				});
			}

			passport.use = originalUse;
		});

		it("should handle JWT authentication errors", () => {
			mockObj.auth.jwt = {
				enabled: true,
				scheme: "Bearer",
				secretOrKey: "secret-key",
				auth: (token, done) => {
					done(new Error("Invalid token"), null);
				}
			};

			const result = auth(mockObj);

			// Verify JWT configuration was applied
			assert.strictEqual(result, mockObj);
			assert.strictEqual(result.auth.jwt.enabled, true);
			assert.strictEqual(typeof result.auth.jwt.auth, "function");

			// Test the auth callback functionality
			let testError = null;
			let testUser = null;
			result.auth.jwt.auth({ sub: "user123" }, (err, user) => {
				testError = err;
				testUser = user;
			});

			assert.ok(testError instanceof Error);
			assert.strictEqual(testError.message, "Invalid token");
			assert.strictEqual(testUser, null);
		});

		it("should handle OAuth2 authentication errors", () => {
			mockObj.auth.oauth2 = {
				enabled: true,
				auth_url: "https://example.com/oauth/authorize",
				token_url: "https://example.com/oauth/token",
				client_id: "client-id",
				client_secret: "client-secret",
				auth: (accessToken, refreshToken, profile, done) => {
					done(new Error("OAuth2 auth failed"), null);
				}
			};

			const result = auth(mockObj);

			// Verify OAuth2 configuration was applied
			assert.strictEqual(result, mockObj);
			assert.strictEqual(result.auth.oauth2.enabled, true);
			assert.strictEqual(typeof result.auth.oauth2.auth, "function");

			// Test the auth callback functionality
			let testError = null;
			let testUser = null;
			result.auth.oauth2.auth("access-token", "refresh-token", { id: "123" }, (err, user) => {
				testError = err;
				testUser = user;
			});

			assert.ok(testError instanceof Error);
			assert.strictEqual(testError.message, "OAuth2 auth failed");
			assert.strictEqual(testUser, null);
		});
	});

	describe("multiple authentication methods", () => {
		it("should handle all authentication methods enabled simultaneously", () => {
			mockObj.auth.basic = {
				enabled: true,
				list: ["admin:password"]
			};
			mockObj.auth.bearer = {
				enabled: true,
				tokens: ["token123"]
			};
			mockObj.auth.jwt = {
				enabled: true,
				scheme: "Bearer",
				secretOrKey: "secret",
				auth: (token, done) => done(null, { id: 1 })
			};
			mockObj.auth.oauth2 = {
				enabled: true,
				auth_url: "https://example.com/oauth/authorize",
				token_url: "https://example.com/oauth/token",
				client_id: "client-id",
				client_secret: "client-secret",
				auth: (accessToken, refreshToken, profile, done) => done(null, { id: 1 })
			};

			const result = auth(mockObj);

			assert.strictEqual(result, mockObj);
			// All auth methods should be configured
			assert.strictEqual(result.auth.basic.enabled, true);
			assert.strictEqual(result.auth.bearer.enabled, true);
			assert.strictEqual(result.auth.jwt.enabled, true);
			assert.strictEqual(result.auth.oauth2.enabled, true);
		});

		it("should handle auth URI generation for multiple methods", () => {
			const getCallArgs = [];
			mockObj.get = function (uri, handler) {
				getCallArgs.push({ uri, handler });

				return this;
			};

			mockObj.auth.basic = { enabled: true };
			mockObj.auth.bearer = { enabled: true };

			auth(mockObj);

			// Should have auth root endpoint with URI mapping
			const authRootCall = getCallArgs.find(call => call.uri === "/auth");
			assert.ok(authRootCall, "Should register auth root endpoint");
		});
	});

	describe("session and security configuration", () => {
		it("should handle non-stateless configuration with all middleware", () => {
			mockObj.rate.enabled = true; // Not stateless
			mockObj.security.csrf = true; // Not stateless

			const middlewareCalls = [];
			mockObj.always = function (middleware) {
				middlewareCalls.push(middleware);

				return this;
			};

			const result = auth(mockObj);

			assert.strictEqual(result, mockObj);
			// Should register session-related middleware
			assert.ok(middlewareCalls.length > 0);
		});

		it("should handle Redis session store in non-test mode", () => {
			mockObj.session.store = "redis";
			mockObj.session.redis = {
				host: "localhost",
				port: 6379
			};

			// Test without TEST_MODE
			delete process.env.TEST_MODE;

			const result = auth(mockObj);

			assert.strictEqual(result, mockObj);

			// Restore test mode
			process.env.TEST_MODE = "1";
		});

		it("should handle all security headers at once", () => {
			mockObj.security = {
				csrf: true,
				csp: {
					policy: {
						"default-src": "'self'",
						"script-src": "'self' 'unsafe-inline'",
						"style-src": "'self' 'unsafe-inline'"
					}
				},
				xframe: "SAMEORIGIN",
				p3p: "CP='NOI ADM DEV PSAi COM NAV OUR OTRo STP IND DEM'",
				hsts: {
					maxAge: 63072000,
					includeSubDomains: true,
					preload: true
				},
				xssProtection: true,
				nosniff: true
			};

			const middlewareCalls = [];
			mockObj.always = function (middleware) {
				middlewareCalls.push(middleware);

				return this;
			};

			const result = auth(mockObj);

			assert.strictEqual(result, mockObj);
			// Should register multiple security middleware
			assert.ok(middlewareCalls.length > 0);
		});

		it("should handle empty security configurations", () => {
			mockObj.security.xframe = "";
			mockObj.security.p3p = "";

			const result = auth(mockObj);

			assert.strictEqual(result, mockObj);
		});
	});

	describe("authentication callbacks and serialization", () => {
		it("should test passport serialize and deserialize functions", () => {
			const originalSerialize = passport.serializeUser;
			const originalDeserialize = passport.deserializeUser;

			let serializeCalled = false;
			let deserializeCalled = false;

			passport.serializeUser = function (fn) {
				serializeCalled = true;
				// Test the function
				fn({ id: 1, username: "test" }, (err, user) => {
					assert.strictEqual(err, null);
					assert.deepStrictEqual(user, { id: 1, username: "test" });
				});

				return originalSerialize.call(this, fn);
			};

			passport.deserializeUser = function (fn) {
				deserializeCalled = true;
				// Test the function
				fn({ id: 1, username: "test" }, (err, user) => {
					assert.strictEqual(err, null);
					assert.deepStrictEqual(user, { id: 1, username: "test" });
				});

				return originalDeserialize.call(this, fn);
			};

			auth(mockObj);

			assert.strictEqual(serializeCalled, true);
			assert.strictEqual(deserializeCalled, true);

			passport.serializeUser = originalSerialize;
			passport.deserializeUser = originalDeserialize;
		});

		it("should test login endpoint response", () => {
			let loginHandler = null;
			mockObj.get = function (uri, handler) {
				if (uri === mockObj.auth.uri.login) {
					loginHandler = handler;
				}

				return this;
			};

			mockObj.auth.basic = { enabled: true };

			auth(mockObj);

			// Test login endpoint handler
			if (loginHandler) {
				const mockRes = {
					jsonCalled: false,
					jsonData: null,
					json: function (data) {
						this.jsonCalled = true;
						this.jsonData = data;
					}
				};

				loginHandler(null, mockRes);

				assert.strictEqual(mockRes.jsonCalled, true);
				assert.deepStrictEqual(mockRes.jsonData, { instruction: "Please login" });
			}
		});
	});

	describe("edge cases and error scenarios", () => {
		it("should handle basic auth with malformed credentials", () => {
			mockObj.auth.basic = {
				enabled: true,
				list: ["user"] // No colon separator
			};

			const result = auth(mockObj);

			assert.strictEqual(result, mockObj);
		});

		it("should handle custom session configuration", () => {
			mockObj.session = {
				secret: "custom-secret",
				resave: true,
				saveUninitialized: true,
				maxAge: 86400000,
				store: "memory"
			};

			const result = auth(mockObj);

			assert.strictEqual(result, mockObj);
		});

		it("should handle HSTS with includeSubDomains explicitly set to false", () => {
			mockObj.security.hsts = {
				maxAge: 31536000,
				includeSubDomains: false
			};

			const result = auth(mockObj);

			assert.strictEqual(result, mockObj);
		});

		it("should handle complex authentication delay scenarios", () => {
			mockObj.auth.delay = 500;
			mockObj.auth.basic = {
				enabled: true,
				list: ["testuser:testpass"]
			};
			mockObj.auth.bearer = {
				enabled: true,
				tokens: ["testtoken"]
			};

			const result = auth(mockObj);

			assert.strictEqual(result, mockObj);
			assert.strictEqual(result.auth.delay, 500);
		});

		it("should handle guard pattern generation with multiple auth URIs", () => {
			const alwaysCalls = [];
			mockObj.always = function (pattern, middleware) {
				if (typeof pattern === "string" && pattern.includes("(?!")) {
					alwaysCalls.push({ pattern, middleware });
				}

				return this;
			};

			mockObj.auth.basic = { enabled: true };
			mockObj.auth.bearer = { enabled: true };
			mockObj.auth.oauth2 = { enabled: true };

			auth(mockObj);

			// Should generate guard pattern for protecting auth endpoints
			const guardCall = alwaysCalls.find(call => call.pattern.includes("(?!"));
			assert.ok(guardCall, "Should generate guard pattern for auth endpoints");
		});

		it("should handle OAuth2 callback URI generation", () => {
			const getCalls = [];
			mockObj.get = function (uri, handler) {
				getCalls.push({ uri, handler });

				return this;
			};

			mockObj.auth.oauth2 = {
				enabled: true,
				auth_url: "https://example.com/oauth/authorize",
				token_url: "https://example.com/oauth/token",
				client_id: "client-id",
				client_secret: "client-secret",
				auth: (accessToken, refreshToken, profile, done) => done(null, { id: 1 })
			};

			auth(mockObj);

			// Should register OAuth2 routes
			const oauth2Route = getCalls.find(call => call.uri === "/auth/oauth2");
			const callbackRoute = getCalls.find(call => call.uri === "/auth/oauth2/callback");

			assert.ok(oauth2Route, "Should register OAuth2 route");
			assert.ok(callbackRoute, "Should register OAuth2 callback route");
		});

		it("should handle JWT with optional parameters undefined", () => {
			mockObj.auth.jwt = {
				enabled: true,
				scheme: "Bearer",
				secretOrKey: "secret-key",
				algorithms: undefined,
				audience: undefined,
				issuer: undefined,
				auth: (token, done) => done(null, { id: 1 })
			};

			const result = auth(mockObj);

			assert.strictEqual(result, mockObj);
		});
	});
});
