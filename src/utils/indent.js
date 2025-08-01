import {EMPTY, INT_0, INT_1, INT_10} from "../core/constants.js";

/**
 * Extracts indentation value from a string or returns fallback
 * Looks for "indent=number" pattern in the input string
 * @param {string} [arg=EMPTY] - The string to parse for indentation value
 * @param {number} [fallback=INT_0] - The fallback value if no indent pattern is found
 * @returns {number} The parsed indentation value or fallback
 */
export function indent (arg = EMPTY, fallback = INT_0) {
	if (arg === null || arg === undefined) {
		arg = EMPTY;
	}

	const match = arg.match(/indent\s*=\s*(\d+)/);

	return match ? parseInt(match[INT_1], INT_10) : fallback;
}
