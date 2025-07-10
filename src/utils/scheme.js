import {EMPTY, SLASH, URI_SCHEME} from "../core/constants.js";

/**
 * Checks if a string contains a URI scheme indicator
 * @param {string} [arg=EMPTY] - The string to check for URI scheme
 * @returns {boolean} True if the string contains a slash or starts with URI scheme character
 */
export function scheme (arg = EMPTY) {
	if (arg === null || arg === undefined) {
		arg = EMPTY;
	}

	return arg.includes(SLASH) || arg.startsWith(URI_SCHEME) || arg.startsWith(":");
}
