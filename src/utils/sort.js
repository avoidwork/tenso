import {keysort} from "keysort";
import {clone} from "./clone";
import {BOOLEAN, COMMA, DESC, EQ, INT_0, NUMBER, ORDER_BY, SPACE, STRING, UNDEFINED} from "../core/constants.js";

const ORDER_BY_EQ_DESC = `${ORDER_BY}${EQ}${DESC}`;
const COMMA_SPACE = `${COMMA}${SPACE}`;

export function sort (arg, req) {
	let output = clone(arg);

	if (typeof req.parsed.search === STRING && req.parsed.searchParams.has(ORDER_BY) && Array.isArray(arg)) {
		const type = typeof arg[INT_0];

		if (type !== BOOLEAN && type !== NUMBER && type !== STRING && type !== UNDEFINED && arg[INT_0] !== null) {
			const args = req.parsed.searchParams.getAll(ORDER_BY).filter(i => i !== DESC).join(COMMA_SPACE);

			if (args.length > INT_0) {
				output = keysort(output, args);
			}
		}

		if (req.parsed.search.includes(ORDER_BY_EQ_DESC)) {
			output = output.reverse();
		}
	}

	return output;
}
