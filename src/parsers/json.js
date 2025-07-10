import {EMPTY} from "../core/constants.js";

/**
 * Parses JSON string into JavaScript object
 * @param {string} [arg=EMPTY] - The JSON string to parse
 * @returns {*} The parsed JavaScript object or value
 * @throws {SyntaxError} When the JSON string is invalid
 */
export function json (arg = EMPTY) {
	return JSON.parse(arg);
}
