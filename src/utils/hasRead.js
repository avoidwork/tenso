import {GET, HEAD, OPTIONS} from "../core/constants.js";

/**
 * Checks if an HTTP method is a read-only operation
 * @param {string} arg - The HTTP method string to check
 * @returns {boolean} True if the method is read-only (GET, HEAD, OPTIONS), false otherwise
 */
export function hasRead (arg) {
	return arg.includes(GET) || arg.includes(HEAD) || arg.includes(OPTIONS);
}
