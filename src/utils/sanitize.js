import {GT, LT, STRING} from "../core/constants.js";

/**
 * Sanitizes HTML by escaping < and > characters
 * @param {*} arg - The value to sanitize
 * @returns {*} The sanitized value with HTML entities escaped, or original value if not a string
 */
export function sanitize (arg) {
	return typeof arg === STRING ? arg.replace(/</g, LT).replace(/>/g, GT) : arg;
}
