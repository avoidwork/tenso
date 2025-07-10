import {STATUS_CODES} from "node:http";
import {INT_200} from "../core/constants.js";

/**
 * Plain serializer that returns data directly or error information
 * Returns the original data if no error, otherwise returns error message or stack trace
 * @param {*} arg - The data to serialize
 * @param {Error|string|null} err - The error object or message, null if no error
 * @param {number} [status=INT_200] - HTTP status code (used for fallback error message)
 * @param {boolean} [stack=false] - Whether to return error stack trace instead of message
 * @returns {*} The original data or error information
 */
export function plain (arg, err, status = INT_200, stack = false) {
	return err !== null ? (stack ? err.stack : err.message) || err || STATUS_CODES[status] : arg;
}
