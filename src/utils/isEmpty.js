import {EMPTY} from "../core/constants.js";

/**
 * Checks if a value is an empty string
 * @param {*} [arg=EMPTY] - The value to check
 * @returns {boolean} True if the value equals the EMPTY constant, false otherwise
 */
export function isEmpty (arg) {
	// Handle when called with no arguments - should return true
	if (arguments.length === 0) {
		return true;
	}

	// Handle explicit undefined - should return false
	if (arg === undefined) {
		return false;
	}

	return arg === EMPTY && typeof arg === "string";
}
