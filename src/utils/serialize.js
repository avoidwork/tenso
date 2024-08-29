import {serializers} from "./serializers.js";
import {explode} from "./explode.js";
import {mimetype as regex} from "./regex.js";
import {sort} from "./sort.js";
import {CHARSET_UTF8, COMMA, EMPTY, FORMAT, HEADER_CONTENT_TYPE} from "../core/constants.js";

export function serialize (req, res, arg) {
	const status = res.statusCode;
	let format = req.server.mimeType,
		accepts = explode(req.parsed.searchParams.get(FORMAT) || req.headers.accept || res.getHeader(HEADER_CONTENT_TYPE) || format, COMMA),
		errz = arg instanceof Error || status >= 400,
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
		result = serializer(null, arg, status < 400 ? 500 : status, req.server.logging.stackWire);
	} else {
		result = serializer(sort(arg, req), null, status);
	}

	return result;
}
