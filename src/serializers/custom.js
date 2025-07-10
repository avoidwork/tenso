import {STATUS_CODES} from "node:http";
import {INT_200} from "../core/constants.js";

/**
 * Custom serializer that creates a structured response object with metadata
 * Returns an object containing data, error, links, and status fields
 * @param {*} arg - The data to serialize
 * @param {Error|string|null} err - The error object or message, null if no error
 * @param {number} [status=INT_200] - HTTP status code
 * @param {boolean} [stack=false] - Whether to include error stack trace
 * @returns {Object} Structured response object with data, error, links, and status
 */
export function custom (arg, err, status = INT_200, stack = false) {
	return {
		data: arg,
		error: err !== null ? (stack ? err.stack : err.message) || err || STATUS_CODES[status] : null,
		links: [],
		status: status
	};
}
