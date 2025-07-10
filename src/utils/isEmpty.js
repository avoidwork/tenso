import {EMPTY} from "../core/constants.js";

/**
 * Checks if a value is an empty string
 * @param {*} [arg=EMPTY] - The value to check
 * @returns {boolean} True if the value equals the EMPTY constant, false otherwise
 */
export function isEmpty (arg = EMPTY) {
	return arg === EMPTY;
}
