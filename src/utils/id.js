import {EMPTY, I, ID, ID_2} from "../core/constants.js";

const pattern = new RegExp(`(?:${ID}|${ID_2})$`, I);

/**
 * Checks if a string matches common ID patterns
 * @param {string} [arg=EMPTY] - The string to test for ID patterns
 * @returns {boolean} True if the string matches ID patterns, false otherwise
 */
export function id (arg = EMPTY) {
	// Only match strings that don't contain whitespace or special characters before the id suffix
	return pattern.test(arg) && !(/[\s\-.@]/).test(arg);
}
