import promClient from "prom-client";

/**
 * Prometheus metrics setup
 * Creates histogram and counter metrics for HTTP requests
 * @param {Object} config - The Prometheus configuration object
 * @returns {Object} Object containing middleware function and metrics registry
 */
export function prometheus (config) {
	// Create a Registry to register metrics
	const register = new promClient.Registry();

	// Add default metrics (process stats, etc.)
	if (config.includeUp) {
		promClient.collectDefaultMetrics({ register });
	}

	// Create histogram for request duration
	const httpRequestDuration = new promClient.Histogram({
		name: "http_request_duration_seconds",
		help: "Duration of HTTP requests in seconds",
		labelNames: ["method", "route", "status_code", ...Object.keys(config.customLabels || {})],
		buckets: config.buckets || [0.001, 0.01, 0.1, 1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 35, 40, 50, 70, 100, 200]
	});

	// Create counter for request count
	const httpRequestsTotal = new promClient.Counter({
		name: "http_requests_total",
		help: "Total number of HTTP requests",
		labelNames: ["method", "route", "status_code", ...Object.keys(config.customLabels || {})]
	});

	// Register metrics
	register.registerMetric(httpRequestDuration);
	register.registerMetric(httpRequestsTotal);

	// Middleware function
	const middleware = (req, res, next) => {
		const startTime = Date.now();

		// Store original end method
		const originalEnd = res.end;

		// Override end method to capture metrics
		res.end = function (...args) {
			const duration = (Date.now() - startTime) / 1000; // Convert to seconds
			const route = req.route || req.url || "unknown";
			const method = req.method || "unknown";
			const statusCode = res.statusCode || 0;

			// Build labels object
			const labels = {
				method: config.includeMethod ? method : "HTTP",
				route: config.includePath ? route : "",
				status_code: config.includeStatusCode ? statusCode.toString() : "",
				...config.customLabels
			};

			// Record metrics
			httpRequestDuration.observe(labels, duration);
			httpRequestsTotal.inc(labels);

			// Call original end method
			originalEnd.apply(this, args);
		};

		if (typeof next === "function") {
			next();
		}
	};

	return {middleware, register};
}
