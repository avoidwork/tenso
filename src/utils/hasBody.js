import {PATCH, POST, PUT} from "../core/constants.js";

/**
 * Checks if an HTTP method typically has a request body
 * @param {string} arg - The HTTP method string to check
 * @returns {boolean} True if the method can have a body (PATCH, POST, PUT), false otherwise
 */
export function hasBody (arg) {
	const trimmed = arg.trim().toUpperCase();

	// Check for exact matches first
	if (trimmed === PATCH || trimmed === POST || trimmed === PUT) {
		return true;
	}

	// For comma-delimited strings, split and check each method
	const methods = trimmed.split(",").map(method => method.trim());

	return methods.some(method => method === PATCH || method === POST || method === PUT);
}
