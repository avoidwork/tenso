import {GET, HEAD, OPTIONS} from "../core/constants.js";

/**
 * Checks if an HTTP method is a read-only operation
 * @param {string} arg - The HTTP method string to check
 * @returns {boolean} True if the method is read-only (GET, HEAD, OPTIONS), false otherwise
 */
export function hasRead (arg) {
	const trimmed = arg.trim().toUpperCase();

	// Check for exact matches first
	if (trimmed === GET || trimmed === HEAD || trimmed === OPTIONS) {
		return true;
	}

	// For comma-delimited strings, split and check each method
	const methods = trimmed.split(",").map(method => method.trim());

	return methods.some(method => method === GET || method === HEAD || method === OPTIONS);
}
