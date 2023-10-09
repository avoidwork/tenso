import {coerce} from "tiny-coerce";
import {bodySplit} from "../utils/regex.js";

export function xWwwFormURLEncoded (arg) {
	const args = arg ? chunk(arg.split(bodySplit), 2) : [],
		result = {};

	for (const i of args) {
		result[decodeURIComponent(i[0].replace(/\+/g, "%20"))] = coerce(decodeURIComponent(i[1].replace(/\+/g, "%20")));
	}

	return result;
}
