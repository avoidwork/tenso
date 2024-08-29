import {coerce} from "tiny-coerce";
import {bodySplit} from "../utils/regex.js";
import {ENCODED_SPACE, INT_0, INT_1, INT_2} from "../core/constants.js";
import {chunk} from "../utils/chunk.js";

export function xWwwFormURLEncoded (arg) {
	const args = arg ? chunk(arg.split(bodySplit), INT_2) : [],
		result = {};

	for (const i of args) {
		result[decodeURIComponent(i[INT_0].replace(/\+/g, ENCODED_SPACE))] = coerce(decodeURIComponent(i[INT_1].replace(/\+/g, ENCODED_SPACE)));
	}

	return result;
}
