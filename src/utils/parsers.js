import {json} from "../parsers/json.js";
import {jsonl} from "../parsers/jsonl.js";
import {xWwwFormURLEncoded} from "../parsers/xWwwFormURLEncoded.js";

import {
	HEADER_APPLICATION_JSON,
	HEADER_APPLICATION_JSON_LINES,
	HEADER_APPLICATION_JSONL,
	HEADER_APPLICATION_X_WWW_FORM_URLENCODED,
	HEADER_TEXT_JSON_LINES
} from "../core/constants.js";

/**
 * Map of content types to their corresponding parser functions
 * Maps MIME types to functions that can parse request bodies of that type
 * @type {Map<string, Function>}
 */
export const parsers = new Map([
	[
		HEADER_APPLICATION_X_WWW_FORM_URLENCODED,
		xWwwFormURLEncoded
	],
	[
		HEADER_APPLICATION_JSON,
		json
	],
	[
		HEADER_APPLICATION_JSON_LINES,
		jsonl
	],
	[
		HEADER_APPLICATION_JSONL,
		jsonl
	],
	[
		HEADER_TEXT_JSON_LINES,
		jsonl
	]
]);
