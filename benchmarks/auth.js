#!/usr/bin/env node

/**
 * Authentication performance benchmarks for Tenso framework
 */

import Benchmark from "benchmark";
import { partial } from "filesize";
import { tenso } from "../dist/tenso.js";

// Create partially applied filesize function with IEC standard
const formatFilesize = partial({"standard": "iec"});

/**
 * Creates a test server with authentication enabled
 */
function createAuthServer (authConfig) {
	return tenso({
		port: 0,
		silent: true,
		logging: { enabled: false },
		auth: {
			protect: ["/protected.*"],
			unprotect: [],
			...authConfig
		},
		rate: { enabled: false },
		security: { csrf: false }
	});
}

/**
 * Creates mock request objects for testing
 */
function createMockRequest (options = {}) {
	return {
		method: options.method || "GET",
		url: options.url || "/protected/resource",
		headers: options.headers || {},
		sessionID: options.sessionID || "test-session-123",
		ip: options.ip || "127.0.0.1",
		parsed: {
			pathname: options.url || "/protected/resource",
			searchParams: new URLSearchParams()
		},
		body: options.body || "",
		isAuthenticated: options.isAuthenticated || (() => false),
		...options
	};
}

/**
 * Creates mock response objects for testing
 */
function createMockResponse () { // eslint-disable-line no-unused-vars
	return {
		statusCode: 200,
		headers: {},
		getHeader: function (name) { return this.headers[name]; },
		removeHeader: function (name) { delete this.headers[name]; },
		header: function (name, value) { this.headers[name] = value; },
		getHeaders: function () { return this.headers; },
		error: function (status) { this.statusCode = status; },
		redirect: function (url) { this.statusCode = 302; this.headers.location = url; }
	};
}

/**
 * Benchmarks basic authentication performance
 */
function benchmarkBasicAuth () {
	console.log("\n📊 Basic Authentication Benchmarks");
	console.log("-".repeat(40));

	const server = createAuthServer({ // eslint-disable-line no-unused-vars
		basic: {
			enabled: true,
			list: ["user1:password1", "user2:password2", "admin:secret123"]
		}
	});

	const suite = new Benchmark.Suite();

	// Create test requests with different auth scenarios
	const validAuthReq = createMockRequest({
		headers: {
			authorization: "Basic " + Buffer.from("user1:password1").toString("base64")
		}
	});

	const invalidAuthReq = createMockRequest({
		headers: {
			authorization: "Basic " + Buffer.from("user1:wrongpassword").toString("base64")
		}
	});

	const noAuthReq = createMockRequest();

	// Mock the passport authentication function behavior
	const basicAuthCheck = req => {
		const auth = req.headers.authorization;
		if (!auth || !auth.startsWith("Basic ")) return false;

		const encoded = auth.slice(6);
		const decoded = Buffer.from(encoded, "base64").toString();
		const [username, password] = decoded.split(":");

		const validUsers = { "user1": "password1", "user2": "password2", "admin": "secret123" };

		return validUsers[username] === password;
	};

	suite
		.add("Basic Auth - Valid credentials", () => {
			basicAuthCheck(validAuthReq);
		})
		.add("Basic Auth - Invalid credentials", () => {
			basicAuthCheck(invalidAuthReq);
		})
		.add("Basic Auth - No credentials", () => {
			basicAuthCheck(noAuthReq);
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log(`  Fastest: ${this.filter("fastest").map("name")}`);
		})
		.run();
}

/**
 * Benchmarks bearer token authentication performance
 */
function benchmarkBearerAuth () {
	console.log("\n📊 Bearer Token Authentication Benchmarks");
	console.log("-".repeat(40));

	const server = createAuthServer({ // eslint-disable-line no-unused-vars
		bearer: {
			enabled: true,
			tokens: ["token123", "token456", "secret789", "admin-token"]
		}
	});

	const suite = new Benchmark.Suite();

	// Create test requests with different token scenarios
	const validTokenReq = createMockRequest({
		headers: { authorization: "Bearer token123" }
	});

	const invalidTokenReq = createMockRequest({
		headers: { authorization: "Bearer invalid-token" }
	});

	const noTokenReq = createMockRequest();

	// Mock bearer token validation
	const bearerAuthCheck = req => {
		const auth = req.headers.authorization;
		if (!auth || !auth.startsWith("Bearer ")) return false;

		const token = auth.slice(7);
		const validTokens = ["token123", "token456", "secret789", "admin-token"];

		return validTokens.includes(token);
	};

	suite
		.add("Bearer Auth - Valid token", () => {
			bearerAuthCheck(validTokenReq);
		})
		.add("Bearer Auth - Invalid token", () => {
			bearerAuthCheck(invalidTokenReq);
		})
		.add("Bearer Auth - No token", () => {
			bearerAuthCheck(noTokenReq);
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log(`  Fastest: ${this.filter("fastest").map("name")}`);
		})
		.run();
}

/**
 * Benchmarks JWT token validation performance
 */
function benchmarkJwtAuth () {
	console.log("\n📊 JWT Authentication Benchmarks");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();

	// Mock JWT tokens (in real scenario these would be actual JWTs)
	const validJwtToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
	const invalidJwtToken = "invalid.jwt.token";

	const validJwtReq = createMockRequest({
		headers: { authorization: `Bearer ${validJwtToken}` }
	});

	const invalidJwtReq = createMockRequest({
		headers: { authorization: `Bearer ${invalidJwtToken}` }
	});

	// Mock JWT validation (simplified - in real scenario would use jsonwebtoken library)
	const jwtAuthCheck = req => {
		const auth = req.headers.authorization;
		if (!auth || !auth.startsWith("Bearer ")) return false;

		const token = auth.slice(7);
		// Simplified JWT structure check
		const parts = token.split(".");
		if (parts.length !== 3) return false;

		// Mock validation - in real scenario would verify signature
		try {
			const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

			return payload.sub && payload.iat;
		} catch {
			return false;
		}
	};

	suite
		.add("JWT Auth - Valid token", () => {
			jwtAuthCheck(validJwtReq);
		})
		.add("JWT Auth - Invalid token", () => {
			jwtAuthCheck(invalidJwtReq);
		})
		.add("JWT Auth - Token parsing", () => {
			const token = validJwtToken;
			const parts = token.split(".");
			if (parts.length === 3) {
				JSON.parse(Buffer.from(parts[1], "base64").toString());
			}
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log(`  Fastest: ${this.filter("fastest").map("name")}`);
		})
		.run();
}

/**
 * Benchmarks route protection pattern matching
 */
function benchmarkRouteProtection () {
	console.log("\n📊 Route Protection Pattern Matching");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();

	// Create protection patterns
	const protectPatterns = [
		/^\/admin/,
		/^\/api\/private/,
		/^\/user\/profile/,
		/^\/secure/,
		/^\/protected/
	];

	const unprotectPatterns = [
		/^\/public/,
		/^\/assets/,
		/^\/login/,
		/^\/health/
	];

	// Test URLs
	const testUrls = [
		"/admin/dashboard",
		"/api/private/data",
		"/user/profile/123",
		"/public/assets/style.css",
		"/login",
		"/secure/vault",
		"/health/check",
		"/unmatched/route"
	];

	// Mock protection check function
	const checkRouteProtection = url => {
		// Check unprotect patterns first
		for (const pattern of unprotectPatterns) {
			if (pattern.test(url)) return { protected: false, reason: "unprotected" };
		}

		// Check protect patterns
		for (const pattern of protectPatterns) {
			if (pattern.test(url)) return { protected: true, reason: "protected" };
		}

		return { protected: false, reason: "default" };
	};

	suite
		.add("Route protection - Single URL check", () => {
			checkRouteProtection("/admin/dashboard");
		})
		.add("Route protection - Multiple URL checks", () => {
			testUrls.forEach(url => checkRouteProtection(url));
		})
		.add("Route protection - Pattern compilation", () => {
			const patterns = ["^/admin", "^/api/private", "^/secure"];
			patterns.map(p => new RegExp(p));
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log(`  Fastest: ${this.filter("fastest").map("name")}`);
		})
		.run();
}

/**
 * Benchmarks authentication delay functionality
 */
function benchmarkAuthDelay () {
	console.log("\n📊 Authentication Delay Performance");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();

	// Mock delay function (without actual setTimeout for benchmarking)
	const mockDelay = (fn, delay) => {
		if (delay === 0) {
			fn();
		} else {
			// In benchmark, we just simulate the delay logic without waiting
			const randomDelay = Math.floor(Math.random() * delay) + 1; // eslint-disable-line no-unused-vars
			fn(); // Execute immediately for benchmarking
		}
	};

	const authFunction = () => {
		// Mock authentication logic
		return Math.random() > 0.5; // Random success/failure
	};

	suite
		.add("Auth Delay - No delay (0ms)", () => {
			mockDelay(authFunction, 0);
		})
		.add("Auth Delay - Small delay (100ms)", () => {
			mockDelay(authFunction, 100);
		})
		.add("Auth Delay - Medium delay (500ms)", () => {
			mockDelay(authFunction, 500);
		})
		.add("Auth Delay - Large delay (1000ms)", () => {
			mockDelay(authFunction, 1000);
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log("  Note: Delay simulation only - actual delays not applied in benchmark");
		})
		.run();
}

/**
 * Benchmarks session-based authentication
 */
function benchmarkSessionAuth () {
	console.log("\n📊 Session-based Authentication");
	console.log("-".repeat(40));

	const suite = new Benchmark.Suite();

	// Mock session store
	const sessionStore = new Map();
	sessionStore.set("valid-session", { userId: 123, role: "user", authenticated: true });
	sessionStore.set("admin-session", { userId: 1, role: "admin", authenticated: true });

	const sessionAuthCheck = sessionId => {
		const session = sessionStore.get(sessionId);

		return session && session.authenticated === true;
	};

	const sessionRoleCheck = (sessionId, requiredRole) => {
		const session = sessionStore.get(sessionId);

		return session && session.authenticated && session.role === requiredRole;
	};

	suite
		.add("Session Auth - Valid session check", () => {
			sessionAuthCheck("valid-session");
		})
		.add("Session Auth - Invalid session check", () => {
			sessionAuthCheck("invalid-session");
		})
		.add("Session Auth - Role validation", () => {
			sessionRoleCheck("admin-session", "admin");
		})
		.add("Session Auth - Failed role validation", () => {
			sessionRoleCheck("valid-session", "admin");
		})
		.add("Session Auth - Multiple session checks", () => {
			const sessions = ["valid-session", "admin-session", "invalid-session"];
			sessions.forEach(id => sessionAuthCheck(id));
		})
		.on("cycle", event => {
			console.log(`  ${String(event.target)}`);
		})
		.on("complete", function () {
			console.log(`  Fastest: ${this.filter("fastest").map("name")}`);
		})
		.run();
}

/**
 * Memory usage test for authentication
 */
function testAuthMemoryUsage () {
	console.log("\n📊 Authentication Memory Usage");
	console.log("-".repeat(40));

	const iterations = 10000;

	// Test basic auth memory usage
	const basicAuthStart = process.memoryUsage();
	for (let i = 0; i < iterations; i++) {
		const req = createMockRequest({
			headers: {
				authorization: "Basic " + Buffer.from(`user${i}:password${i}`).toString("base64")
			}
		});
		// Simulate auth check
		const auth = req.headers.authorization.slice(6);
		Buffer.from(auth, "base64").toString();
	}
	const basicAuthEnd = process.memoryUsage();

	// Test bearer token memory usage
	const bearerAuthStart = process.memoryUsage();
	for (let i = 0; i < iterations; i++) {
		const req = createMockRequest({
			headers: { authorization: `Bearer token-${i}` }
		});
		// Simulate token check
		req.headers.authorization.slice(7);
	}
	const bearerAuthEnd = process.memoryUsage();

	console.log(`Basic Auth (${iterations} iterations):`);
	const basicDiff = basicAuthEnd.heapUsed - basicAuthStart.heapUsed;
	console.log(`  Heap Used: ${basicDiff >= 0 ? "+" : ""}${formatFilesize(basicDiff)}`);

	console.log(`Bearer Auth (${iterations} iterations):`);
	const bearerDiff = bearerAuthEnd.heapUsed - bearerAuthStart.heapUsed;
	console.log(`  Heap Used: ${bearerDiff >= 0 ? "+" : ""}${formatFilesize(bearerDiff)}`);
	console.log("  Note: Negative values indicate garbage collection occurred during test");
}

/**
 * Main execution function
 */
async function main () {
	console.log("🔥 Authentication Performance Benchmarks");

	try {
		benchmarkBasicAuth();
		benchmarkBearerAuth();
		benchmarkJwtAuth();
		benchmarkRouteProtection();
		benchmarkAuthDelay();
		benchmarkSessionAuth();
		testAuthMemoryUsage();

		console.log("\n✅ Authentication benchmarks completed\n");
	} catch (error) {
		console.error("❌ Benchmark failed:", error);
		process.exit(1);
	}
}

main();
