import { serializers } from "./serializers.js";
import { explode } from "./explode.js";
import { mimetype as regex } from "./regex.js";
import { sort } from "./sort.js";

export function serialize (req, res, arg) {
	const status = res.statusCode;
	let format = req.server.config.mimeType,
		accepts = explode(req.parsed.searchParams.get("format") || req.headers.accept || res.getHeader("content-type") || format, ","),
		errz = arg instanceof Error,
		result, serializer;

	for (const i of accepts) {
		let mimetype = i.replace(regex, "");

		if (serializers.has(mimetype)) {
			format = mimetype;
			break;
		}
	}

	serializer = serializers.get(format);
	res.removeHeader("content-type");
	res.header("content-type", `${format}; charset=utf-8`);

	if (errz) {
		result = serializer(null, arg, status < 400 ? 500 : status, req.server.config.logging.stackWire);
	} else {
		result = serializer(sort(arg, req), null, status);
	}

	return result;
}
