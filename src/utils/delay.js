import {random} from "./random.js";
import {INT_0} from "../core/constants.js";

/**
 * Executes a function after a random delay or immediately if no delay is specified
 * @param {Function} [fn=() => void 0] - The function to execute
 * @param {number} [n=INT_0] - Maximum delay in milliseconds (0 means execute immediately)
 * @returns {void}
 */
export function delay (fn = () => void 0, n = INT_0) {
	// Handle null or non-function inputs
	if (typeof fn !== "function") {
		fn = () => void 0;
	}

	if (n === INT_0) {
		try {
			fn();
		} catch {
			// Swallow errors in function execution
		}
	} else {
		setTimeout(() => {
			try {
				fn();
			} catch {
				// Swallow errors in function execution
			}
		}, random(n));
	}
}
