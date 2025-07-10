import {keysort} from "keysort";
import {clone} from "./clone.js";
import {BOOLEAN, COMMA, DESC, INT_0, NUMBER, ORDER_BY, SPACE, STRING, UNDEFINED} from "../core/constants.js";

const COMMA_SPACE = `${COMMA}${SPACE}`;

/**
 * Checks if an array contains undefined values
 * @param {*} arg - The data to check
 * @returns {boolean} True if the array contains undefined values
 */
function hasUndefined (arg) {
	return Array.isArray(arg) && arg.some(item => item === undefined);
}

/**
 * Sorts an array based on query parameters in the request
 * Supports ordering by object keys and reverse ordering
 * @param {*} arg - The data to sort (typically an array)
 * @param {Object} req - The HTTP request object containing parsed query parameters
 * @returns {*} The sorted data or original data if not sortable
 */
export function sort (arg, req) {
	// Handle undefined input
	if (arg === undefined) {
		return undefined;
	}

	// Handle missing properties
	if (!req || !req.parsed || typeof req.parsed.search !== STRING || !req.parsed.searchParams) {
		return hasUndefined(arg) ? structuredClone(arg) : clone(arg);
	}

	if (!req.parsed.searchParams.has(ORDER_BY) || !Array.isArray(arg)) {
		return hasUndefined(arg) ? structuredClone(arg) : clone(arg);
	}

	const type = typeof arg[INT_0];

	if (type === BOOLEAN || type === NUMBER || type === STRING || type === UNDEFINED || arg[INT_0] === null) {
		return hasUndefined(arg) ? structuredClone(arg) : clone(arg);
	}

	const allOrderByValues = req.parsed.searchParams.getAll(ORDER_BY);
	const orderByValues = allOrderByValues.filter(i => i !== DESC && i.trim() !== "");
	const args = orderByValues.join(COMMA_SPACE);

	let output = hasUndefined(arg) ? structuredClone(arg) : clone(arg);

	if (args.length > INT_0) {
		output = keysort(output, args);
	}

	// Reverse logic:
	// - If desc appears after other sort keys, reverse the sort
	// - If desc is standalone, also reverse
	const hasDesc = allOrderByValues.includes(DESC);
	const hasOtherKeys = orderByValues.length > INT_0;
	const descIndex = allOrderByValues.indexOf(DESC);
	const lastNonDescIndex = Math.max(...allOrderByValues.map((val, idx) => val !== DESC ? idx : -1));

	if (hasDesc && (descIndex > lastNonDescIndex || !hasOtherKeys)) {
		output = output.reverse();
	}

	return output;
}
