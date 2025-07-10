import {randomInt} from "node:crypto";
import {INT_1, INT_100} from "../core/constants.js";

/**
 * Generates a random integer between 1 and n (inclusive)
 * @param {number} [n=INT_100] - The upper bound for the random number
 * @returns {number} A random integer between 1 and n
 */
export function random (n = INT_100) {
	if (n < INT_1) {
		return INT_1;
	}

	return randomInt(INT_1, n + INT_1);
}
