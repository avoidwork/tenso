import {PATCH, POST, PUT} from "../core/constants.js";

/**
 * Checks if an HTTP method typically has a request body
 * @param {string} arg - The HTTP method string to check
 * @returns {boolean} True if the method can have a body (PATCH, POST, PUT), false otherwise
 */
export function hasBody (arg) {
	return arg.includes(PATCH) || arg.includes(POST) || arg.includes(PUT);
}
