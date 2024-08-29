import {INT_0, INT_2} from "../core/constants.js";

export function chunk (arg = [], size = INT_2) {
	const result = [];
	const nth = Math.ceil(arg.length / size);
	let i = INT_0;

	while (i < nth) {
		result.push(arg.slice(i * size, ++i * size));
	}

	return result;
}
