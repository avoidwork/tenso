import {
	CALLBACK,
	HEADER_APPLICATION_JAVASCRIPT,
	HEADER_CONTENT_TYPE,
	INT_0
} from "../core/constants.js";

/**
 * Renders data as JSONP callback for JavaScript consumption
 * Wraps JSON data in a callback function for cross-domain requests
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to render as JSONP
 * @returns {string} The JSONP callback string
 */
export function javascript (req, res, arg) {
	req.headers.accept = HEADER_APPLICATION_JAVASCRIPT;
	res.header(HEADER_CONTENT_TYPE, HEADER_APPLICATION_JAVASCRIPT);

	return `${req.parsed.searchParams.get(CALLBACK) ?? CALLBACK}(${JSON.stringify(arg, null, INT_0)});`;
}
