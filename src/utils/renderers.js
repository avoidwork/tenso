import {json} from "../renderers/json.js";
import {yaml} from "../renderers/yaml.js";
import {xml} from "../renderers/xml.js";
import {plain} from "../renderers/plain.js";
import {javascript} from "../renderers/javascript.js";
import {csv} from "../renderers/csv.js";
import {html} from "../renderers/html.js";
import {jsonl} from "../renderers/jsonl.js";

export const renderers = new Map([
	["application/json", json],
	["application/yaml", yaml],
	["application/xml", xml],
	["text/plain", plain],
	["application/javascript", javascript],
	["text/csv", csv],
	["text/html", html],
	["application/json-lines", jsonl],
	["application/jsonl", jsonl],
	["text/jsonl", jsonl]
]);
