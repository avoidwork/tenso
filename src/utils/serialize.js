import {serializers} from "./serializers.js";
import {explode} from "./explode.js";
import {mimetype as regex} from "./regex.js";
import {sort} from "./sort.js";
import {CHARSET_UTF8, COMMA, EMPTY, FORMAT, HEADER_CONTENT_TYPE, INT_400, INT_500} from "../core/constants.js";

/**
 * Serializes response data based on content type negotiation
 * Handles format selection, sorting, and error serialization
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to serialize
 * @returns {*} The serialized data
 */
export function serialize (req, res, arg) {
	const status = res.statusCode;
	let format = req.server.mimeType,
		accepts = explode(req.parsed.searchParams.get(FORMAT) || req.headers.accept || res.getHeader(HEADER_CONTENT_TYPE) || format, COMMA),
		errz = arg instanceof Error || status >= INT_400,
		result, serializer;

	for (const i of accepts) {
		let mimetype = i.replace(regex, EMPTY);

		if (serializers.has(mimetype)) {
			format = mimetype;
			break;
		}
	}

	serializer = serializers.get(format);
	res.removeHeader(HEADER_CONTENT_TYPE);
	res.header(HEADER_CONTENT_TYPE, `${format}${CHARSET_UTF8}`);

	if (errz) {
		result = serializer(null, arg, status < INT_400 ? INT_500 : status, req.server.logging.stackWire);
	} else {
		result = serializer(sort(arg, req), null, status);
	}

	return result;
}
