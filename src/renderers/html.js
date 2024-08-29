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

export function html (req, res, arg, tpl = EMPTY) {
	const protocol = X_FORWARDED_PROTO in req.headers ? req.headers[X_FORWARDED_PROTO] + COLON : req.parsed.protocol,
		headers = res.getHeaders();

	return tpl.length > INT_0 ? tpl.replace(new RegExp(TEMPLATE_TITLE, G), req.server.title)
		.replace(TEMPLATE_URL, req.parsed.href.replace(req.parsed.protocol, protocol))
		.replace(TEMPLATE_HEADERS, Object.keys(headers).sort().map(i => `<tr><td>${i}</td><td>${sanitize(headers[i])}</td></tr>`).join(NL))
		.replace(TEMPLATE_FORMATS, `<option value=''></option>${Array.from(renderers.keys()).filter(i => i.indexOf(HTML) === INT_NEG_1).map(i => `<option value='${i.trim()}'>${i.replace(/^.*\//, EMPTY).toUpperCase()}</option>`).join(NL)}`)
		.replace(TEMPLATE_BODY, sanitize(JSON.stringify(arg, null, INT_2)))
		.replace(TEMPLATE_YEAR, new Date().getFullYear())
		.replace(TEMPLATE_VERSION, req.server.version)
		.replace(TEMPLATE_ALLOW, headers.allow)
		.replace(TEMPLATE_METHODS, explode((headers?.allow ?? EMPTY).replace(HEADER_ALLOW_GET, EMPTY)).filter(i => i !== EMPTY).map(i => `<option value='${i.trim()}'>$i.trim()}</option>`).join(NL))
		.replace(TEMPLATE_CSRF, headers?.[X_CSRF_TOKEN] ?? EMPTY)
		.replace("class=\"headers", req.server.renderHeaders === false ? "class=\"headers dr-hidden" : "class=\"headers") : EMPTY;
}
