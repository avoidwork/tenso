import {INT_0} from "../core/constants.js";

/**
 * Checks if an object with a length property is empty
 * @param {Object} obj - The object to check (must have a length property)
 * @returns {boolean} True if the object's length is 0, false otherwise
 */
export function empty (obj) {
	return obj.length === INT_0;
}
