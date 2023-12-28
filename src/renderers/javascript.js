import {CALLBACK, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, INT_0} from "../utils/constants.js";

export function javascript (req, res, arg) {
	req.headers.accept = HEADER_APPLICATION_JSON;
	res.header(HEADER_CONTENT_TYPE, HEADER_APPLICATION_JSON);

	return `${req.parsed.searchParams.get(CALLBACK) ?? CALLBACK}(${JSON.stringify(arg, null, INT_0)});`;
}
