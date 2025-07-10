import {json} from "../renderers/json.js";
import {yaml} from "../renderers/yaml.js";
import {xml} from "../renderers/xml.js";
import {plain} from "../renderers/plain.js";
import {javascript} from "../renderers/javascript.js";
import {csv} from "../renderers/csv.js";
import {html} from "../renderers/html.js";
import {jsonl} from "../renderers/jsonl.js";
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
 * Map of content types to their corresponding renderer functions
 * Maps MIME types to functions that can render data in that format
 * @type {Map<string, Function>}
 */
export const renderers = new Map([
	[HEADER_APPLICATION_JSON, json],
	[HEADER_APPLICATION_YAML, yaml],
	[HEADER_APPLICATION_XML, xml],
	[HEADER_TEXT_PLAIN, plain],
	[HEADER_APPLICATION_JAVASCRIPT, javascript],
	[HEADER_TEXT_CSV, csv],
	[HEADER_TEXT_HTML, html],
	[HEADER_APPLICATION_JSON_LINES, jsonl],
	[HEADER_APPLICATION_JSONL, jsonl],
	[HEADER_TEXT_JSON_LINES, jsonl]
]);
