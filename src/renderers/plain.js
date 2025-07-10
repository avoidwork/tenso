import {indent} from "../utils/indent.js";
import {COMMA} from "../core/constants.js";

/**
 * Renders data as plain text with recursive handling of arrays and objects
 * Arrays are joined with commas, objects are JSON stringified, primitives are converted to strings
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to render as plain text
 * @returns {string} The plain text representation
 */
export function plain (req, res, arg) {
	return Array.isArray(arg) ? arg.map(i => plain(req, res, i)).join(COMMA) : arg instanceof Date ? arg.toISOString() : typeof arg === "function" ? arg.toString() : arg instanceof Object ? JSON.stringify(arg, null, indent(req.headers.accept, req.server.json)) : arg.toString();
}
