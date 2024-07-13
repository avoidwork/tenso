import {coerce} from "tiny-coerce";
import {bodySplit} from "../utils/regex.js";
import {ENCODED_SPACE} from "../utils/constants.js";
import {chunk} from "../utils/chunk.js";

export function xWwwFormURLEncoded (arg) {
	const args = arg ? chunk(arg.split(bodySplit), 2) : [],
		result = {};

	for (const i of args) {
		result[decodeURIComponent(i[0].replace(/\+/g, ENCODED_SPACE))] = coerce(decodeURIComponent(i[1].replace(/\+/g, ENCODED_SPACE)));
	}

	return result;
}
