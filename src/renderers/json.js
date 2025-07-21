import {indent} from "../utils/indent.js";

/**
 * Renders data as JSON with configurable indentation
 * Uses server configuration and request headers to determine indentation level
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to render as JSON
 * @returns {string} The JSON formatted string
 */
export function json (req, res, arg) {
	// Convert undefined to null for consistent JSON output
	const value = arg === undefined ? null : arg;

	return JSON.stringify(value, null, indent(req.headers.accept, req.server.jsonIndent));
}
