import {
	CALLBACK,
	HEADER_APPLICATION_JAVASCRIPT,
	HEADER_CONTENT_TYPE,
	INT_0
} from "../core/constants.js";

export function javascript (req, res, arg) {
	req.headers.accept = HEADER_APPLICATION_JAVASCRIPT;
	res.header(HEADER_CONTENT_TYPE, HEADER_APPLICATION_JAVASCRIPT);

	return `${req.parsed.searchParams.get(CALLBACK) ?? CALLBACK}(${JSON.stringify(arg, null, INT_0)});`;
}
