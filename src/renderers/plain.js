import {indent} from "../utils/indent.js";
import {COMMA} from "../core/constants.js";

// Memoization cache for plain text rendering
const plainCache = new WeakMap();

/**
 * Renders data as plain text with recursive handling of arrays and objects
 * Arrays are joined with commas, objects are JSON stringified, primitives are converted to strings
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to render as plain text
 * @returns {string} The plain text representation
 */
export function plain (req, res, arg) {
	// Handle primitive types directly
	if (arg === null || arg === undefined) {
		return "";
	}

	// Check cache for objects we've already processed
	if (typeof arg === "object" && plainCache.has(arg)) {
		return plainCache.get(arg);
	}

	let result;

	if (Array.isArray(arg)) {
		result = arg.map(i => plain(req, res, i)).join(COMMA);
	} else if (arg instanceof Date) {
		result = arg.toISOString();
	} else if (typeof arg === "function") {
		result = arg.toString();
	} else if (arg instanceof Object) {
		const jsonIndent = req.server && req.server.jsonIndent ? req.server.jsonIndent : 0;
		result = JSON.stringify(arg, null, indent(req.headers.accept, jsonIndent));
	} else {
		result = arg.toString();
	}

	// Cache the result for objects
	if (typeof arg === "object" && arg !== null) {
		plainCache.set(arg, result);
	}

	return result;
}
