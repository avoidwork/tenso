import {coerce} from "tiny-coerce";
import {bodySplit} from "./regex.js";
import {chunk} from "./utility.js";

export const parsers = new Map([
	[
		"application/x-www-form-urlencoded",
		arg => {
			const args = arg ? chunk(arg.split(bodySplit), 2) : [],
				result = {};

			for (const i of args) {
				result[decodeURIComponent(i[0].replace(/\+/g, "%20"))] = coerce(decodeURIComponent(i[1].replace(/\+/g, "%20")));
			}

			return result;
		}
	],
	[
		"application/json",
		arg => JSON.parse(arg)
	]
]);
