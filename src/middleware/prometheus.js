import promBundle from "express-prom-bundle";

/**
 * Prometheus metrics configuration function
 * Creates a Prometheus metrics bundle middleware with the provided configuration
 * @param {Object} config - The Prometheus configuration object
 * @returns {Function} The configured Prometheus middleware
 */
// Prometheus metrics
export const prometheus = config => promBundle(config);
