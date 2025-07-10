import {INT_0, INT_2} from "../core/constants.js";

/**
 * Splits an array into chunks of specified size
 * @param {Array} [arg=[]] - The array to chunk
 * @param {number} [size=INT_2] - The size of each chunk
 * @returns {Array<Array>} Array of chunks, each containing up to 'size' elements
 */
export function chunk (arg = [], size = INT_2) {
	if (arg === null || arg === undefined) {
		arg = [];
	}
	const result = [];
	const nth = Math.ceil(arg.length / size);
	let i = INT_0;

	while (i < nth) {
		result.push(arg.slice(i * size, ++i * size));
	}

	return result;
}
