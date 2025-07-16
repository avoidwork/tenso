import {
	COLON,
	EMPTY,
	G,
	HEADER_ALLOW_GET,
	HTML,
	INT_0,
	INT_2,
	INT_NEG_1,
	NL,
	TEMPLATE_ALLOW,
	TEMPLATE_BODY,
	TEMPLATE_CSRF,
	TEMPLATE_FORMATS,
	TEMPLATE_HEADERS,
	TEMPLATE_METHODS,
	TEMPLATE_TITLE,
	TEMPLATE_URL,
	TEMPLATE_VERSION,
	TEMPLATE_YEAR,
	X_CSRF_TOKEN,
	X_FORWARDED_PROTO
} from "../core/constants.js";
import {explode} from "../utils/explode.js";
import {sanitize} from "../utils/sanitize.js";
import {renderers} from "../utils/renderers.js";

/**
 * Renders data as HTML using template replacement
 * Replaces template placeholders with actual values including headers, body, and metadata
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to render in the HTML template
 * @param {string} [tpl=EMPTY] - The HTML template string with placeholders
 * @returns {string} The rendered HTML string
 */
export function html (req, res, arg, tpl = EMPTY) {
	if (tpl.length === INT_0) {
		return EMPTY;
	}

	const protocol = X_FORWARDED_PROTO in req.headers ? req.headers[X_FORWARDED_PROTO] + COLON : req.parsed.protocol,
		headers = res.getHeaders();

	// Build all replacement values once
	const replacements = new Map([
		[new RegExp(TEMPLATE_TITLE, G), req.server.title],
		[TEMPLATE_URL, req.parsed.href.replace(req.parsed.protocol, protocol)],
		[TEMPLATE_HEADERS, Object.keys(headers).sort().map(i => `<tr><td>${i}</td><td>${sanitize(headers[i])}</td></tr>`).join(NL)],
		[TEMPLATE_FORMATS, `<option value=''></option>${Array.from(renderers.keys()).filter(i => i.indexOf(HTML) === INT_NEG_1).map(i => `<option value='${i.trim()}'>${i.replace(/^.*\//, EMPTY).toUpperCase()}</option>`).join(NL)}`],
		[TEMPLATE_BODY, sanitize(JSON.stringify(arg, null, INT_2))],
		[TEMPLATE_YEAR, new Date().getFullYear()],
		[TEMPLATE_VERSION, req.server.version],
		[TEMPLATE_ALLOW, headers.allow],
		[TEMPLATE_METHODS, explode((headers?.allow ?? EMPTY).replace(HEADER_ALLOW_GET, EMPTY)).filter(i => i !== EMPTY).map(i => `<option value='${i.trim()}'>${i.trim()}</option>`).join(NL)],
		[TEMPLATE_CSRF, headers?.[X_CSRF_TOKEN] ?? EMPTY],
		["class=\"headers", req.server.renderHeaders === false ? "class=\"headers dr-hidden" : "class=\"headers"]
	]);

	// Apply all replacements in a single pass
	let result = tpl;
	for (const [pattern, replacement] of replacements) {
		result = result.replace(pattern, replacement);
	}

	return result;
}
