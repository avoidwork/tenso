import {INT_0} from "../core/constants.js";

/**
 * Checks if an object with a length or size property is empty
 * @param {Object} obj - The object to check (must have a length or size property)
 * @returns {boolean} True if the object's length or size is 0, false otherwise
 */
export function empty (obj) {
	if (obj.size !== undefined) {
		return obj.size === INT_0;
	}

	return obj.length === INT_0;
}
