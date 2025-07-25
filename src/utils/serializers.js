import {custom} from "../serializers/custom.js";
import {plain} from "../serializers/plain.js";
import {
	HEADER_APPLICATION_JAVASCRIPT,
	HEADER_APPLICATION_JSON,
	HEADER_APPLICATION_JSON_LINES,
	HEADER_APPLICATION_JSONL,
	HEADER_APPLICATION_XML,
	HEADER_APPLICATION_YAML,
	HEADER_TEXT_CSV,
	HEADER_TEXT_HTML,
	HEADER_TEXT_JSON_LINES,
	HEADER_TEXT_PLAIN
} from "../core/constants.js";

/**
 * Map of content types to their corresponding serializer functions
 * Maps MIME types to functions that can serialize data for that format
 * @type {Map<string, Function>}
 */
export const serializers = new Map([
	[HEADER_APPLICATION_JSON, custom],
	[HEADER_APPLICATION_YAML, custom],
	[HEADER_APPLICATION_XML, custom],
	[HEADER_TEXT_PLAIN, plain],
	[HEADER_APPLICATION_JAVASCRIPT, custom],
	[HEADER_TEXT_CSV, plain],
	[HEADER_TEXT_HTML, custom],
	[HEADER_APPLICATION_JSON_LINES, plain],
	[HEADER_APPLICATION_JSONL, plain],
	[HEADER_TEXT_JSON_LINES, plain]
]);
