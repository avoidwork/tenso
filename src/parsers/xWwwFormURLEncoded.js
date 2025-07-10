import {coerce} from "tiny-coerce";
import {ENCODED_SPACE} from "../core/constants.js";

/**
 * Parses URL-encoded form data into JavaScript object
 * Decodes URL-encoded strings and converts values to appropriate types
 * @param {string} arg - The URL-encoded form data string to parse
 * @returns {Object} Object containing the parsed form data with decoded keys and coerced values
 */
export function xWwwFormURLEncoded (arg) {
	const result = {};

	if (!arg) {
		return result;
	}

	// Split on & to get individual key-value pairs
	const pairs = arg.split("&");

	for (const pair of pairs) {
		// Split each pair on = to separate key and value
		const equalIndex = pair.indexOf("=");

		if (equalIndex !== -1) {
			// Valid key-value pair
			const key = pair.substring(0, equalIndex);
			const value = pair.substring(equalIndex + 1);

			result[decodeURIComponent(key.replace(/\+/g, ENCODED_SPACE))] = coerce(decodeURIComponent(value.replace(/\+/g, ENCODED_SPACE)));
		}
		// Skip malformed pairs (no equals sign) gracefully
	}

	return result;
}
