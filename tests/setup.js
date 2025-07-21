import { beforeEach, before } from "mocha";

// Increase maxListeners for test environment to handle multiple Tenso instances
// Each instance adds event listeners, and tests create many instances
process.setMaxListeners(100); // Increased from default 25 to 100 for tests

// Suppress Redis connection error logs during tests
const originalConsoleError = console.error;
console.error = function (...args) {
	const message = args.join(" ");
	if (message.includes("redis") || message.includes("ENOTFOUND") || message.includes("[ioredis]")) {
		return; // Suppress Redis-related error logs
	}
	originalConsoleError.apply(console, args);
};

// Clear Prometheus registry before each test to prevent duplicate metric registration
before(async () => {
	try {
		const promClient = await import("prom-client");
		if (promClient && promClient.default && promClient.default.register) {
			promClient.default.register.clear();
		}
	} catch (err) {
		// Prometheus client might not be available in all tests
	}
});

beforeEach(async () => {
	try {
		const promClient = await import("prom-client");
		if (promClient && promClient.default && promClient.default.register) {
			promClient.default.register.clear();
		}
	} catch (err) {
		// Prometheus client might not be available in all tests
	}
});

// Set default session store to memory to avoid Redis
process.env.TEST_MODE = "true";
process.env.SESSION_STORE = "memory"; 