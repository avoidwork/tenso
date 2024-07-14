import { keysort } from "keysort";
import { clone } from "./clone";

export function sort (arg, req) {
	let output = clone(arg);

	if (typeof req.parsed.search === "string" && req.parsed.searchParams.has("order_by") && Array.isArray(arg)) {
		const type = typeof arg[0];

		if (type !== "boolean" && type !== "number" && type !== "string" && type !== "undefined" && arg[0] !== null) {
			const args = req.parsed.searchParams.getAll("order_by").filter(i => i !== "desc").join(", ");

			if (args.length > 0) {
				output = keysort(output, args);
			}
		}

		if (req.parsed.search.includes("order_by=desc")) {
			output = output.reverse();
		}
	}

	return output;
}
