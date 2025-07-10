import {COMMA, EMPTY} from "../core/constants.js";

/**
 * Splits a string by delimiter and trims whitespace around each piece
 * @param {string} [arg=EMPTY] - The string to split
 * @param {string} [delimiter=COMMA] - The delimiter to split by
 * @returns {Array<string>} Array of trimmed string pieces
 */
export function explode (arg = EMPTY, delimiter = COMMA) {
	return arg.trim().split(new RegExp(`\\s*${delimiter}\\s*`));
}
