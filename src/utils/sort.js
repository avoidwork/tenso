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
 * Clones data efficiently based on whether it contains undefined values
 * @param {*} arg - The data to clone
 * @returns {*} The cloned data
 */
function smartClone (arg) {
	return hasUndefined(arg) ? structuredClone(arg) : clone(arg);
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

	// Handle missing properties - early return
	if (!req?.parsed?.searchParams || typeof req.parsed.search !== STRING) {
		return smartClone(arg);
	}

	if (!req.parsed.searchParams.has(ORDER_BY) || !Array.isArray(arg)) {
		return smartClone(arg);
	}

	const type = typeof arg[INT_0];

	// Early return for non-sortable arrays
	if (type === BOOLEAN || type === NUMBER || type === STRING || type === UNDEFINED || arg[INT_0] === null) {
		return smartClone(arg);
	}

	const allOrderByValues = req.parsed.searchParams.getAll(ORDER_BY);

	// Process order_by values more efficiently
	const orderByValues = [];
	let hasDesc = false;
	let lastNonDescIndex = -1;

	for (let i = 0; i < allOrderByValues.length; i++) {
		const value = allOrderByValues[i];
		if (value === DESC) {
			hasDesc = true;
		} else if (value.trim() !== "") {
			orderByValues.push(value);
			lastNonDescIndex = i;
		}
	}

	// Clone only once when we know we need to sort
	let output = smartClone(arg);

	// Apply sorting if we have valid order_by values
	if (orderByValues.length > INT_0) {
		const args = orderByValues.join(COMMA_SPACE);
		output = keysort(output, args);
	}

	// Handle reverse logic efficiently
	if (hasDesc) {
		const descIndex = allOrderByValues.indexOf(DESC);
		const hasOtherKeys = orderByValues.length > INT_0;

		if (descIndex > lastNonDescIndex || !hasOtherKeys) {
			output = output.reverse();
		}
	}

	return output;
}
