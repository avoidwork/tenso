import {COMMA, EMPTY} from "../core/constants.js";

/**
 * Splits a string by delimiter and trims whitespace around each piece
 * @param {string} [arg=EMPTY] - The string to split
 * @param {string} [delimiter=COMMA] - The delimiter to split by
 * @returns {Array<string>} Array of trimmed string pieces
 */
export function explode (arg = EMPTY, delimiter = COMMA) {
	if (arg === null || arg === undefined) {
		arg = EMPTY;
	}

	if (delimiter === null || delimiter === undefined || typeof delimiter !== "string") {
		delimiter = COMMA;
	}

	// Escape special regex characters in the delimiter
	const escapedDelimiter = delimiter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

	return arg.trim().split(new RegExp(`\\s*${escapedDelimiter}\\s*`));
}
