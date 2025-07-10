import {coerce} from "tiny-coerce";
import {bodySplit} from "../utils/regex.js";
import {ENCODED_SPACE, INT_0, INT_1, INT_2} from "../core/constants.js";
import {chunk} from "../utils/chunk.js";

/**
 * Parses URL-encoded form data into JavaScript object
 * Decodes URL-encoded strings and converts values to appropriate types
 * @param {string} arg - The URL-encoded form data string to parse
 * @returns {Object} Object containing the parsed form data with decoded keys and coerced values
 */
export function xWwwFormURLEncoded (arg) {
	const args = arg ? chunk(arg.split(bodySplit), INT_2) : [],
		result = {};

	for (const i of args) {
		result[decodeURIComponent(i[INT_0].replace(/\+/g, ENCODED_SPACE))] = coerce(decodeURIComponent(i[INT_1].replace(/\+/g, ENCODED_SPACE)));
	}

	return result;
}
