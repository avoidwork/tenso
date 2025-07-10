import {explode} from "./explode.js";
import {INT_0, INT_1, SPACE} from "../core/constants.js";

/**
 * Capitalizes the first letter of a string or each word in a delimited string
 * @param {string} obj - The string to capitalize
 * @param {boolean} [e=false] - Whether to capitalize each word separately
 * @param {string} [delimiter=SPACE] - The delimiter to use when capitalizing each word
 * @returns {string} The capitalized string
 */
export function capitalize (obj, e = false, delimiter = SPACE) {
	return e ? explode(obj, delimiter).map(capitalize).join(delimiter) : obj.charAt(INT_0).toUpperCase() + obj.slice(INT_1);
}
