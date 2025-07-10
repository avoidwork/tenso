import {stringify} from "tiny-jsonl";

/**
 * Renders data as JSON Lines format
 * Each object is serialized as a separate line of JSON
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to render as JSON Lines
 * @returns {string} The JSON Lines formatted string
 */
export function jsonl (req, res, arg) {
	return stringify(arg);
}
