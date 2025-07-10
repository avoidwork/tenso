import {parse} from "tiny-jsonl";
import {EMPTY} from "../core/constants.js";

/**
 * Parses JSON Lines (JSONL) string into JavaScript array
 * Each line should contain a valid JSON object
 * @param {string} [arg=EMPTY] - The JSONL string to parse
 * @returns {Array} Array of parsed JavaScript objects
 * @throws {Error} When any line contains invalid JSON
 */
export function jsonl (arg = EMPTY) {
	// Handle empty or undefined input by returning empty array
	if (!arg || arg === EMPTY) {
		return [];
	}

	const result = parse(arg);

	// Ensure result is always an array
	// tiny-jsonl returns single objects directly for single lines,
	// but arrays for multiple lines. We need consistent array output.
	return Array.isArray(result) ? result : [result];
}
