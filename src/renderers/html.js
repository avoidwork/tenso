import {COLON, EMPTY, HEADER_ALLOW_GET, HTML, X_CSRF_TOKEN, X_FORWARDED_PROTO} from "../utils/constants.js";
import {explode} from "../utils/explode.js";
import {sanitize} from "../utils/sanitize.js";
import {renderers} from "../utils/renderers.js";

export function html (req, res, arg, tpl = "") {
	const protocol = X_FORWARDED_PROTO in req.headers ? req.headers[X_FORWARDED_PROTO] + COLON : req.parsed.protocol,
		headers = res.getHeaders();

	return tpl.length > 0 ? tpl.replace(/\{\{title\}\}/g, req.server.config.title)
		.replace("{{url}}", req.parsed.href.replace(req.parsed.protocol, protocol))
		.replace("{{headers}}", Object.keys(headers).sort().map(i => `<tr><td>${i}</td><td>${sanitize(headers[i])}</td></tr>`).join("\n"))
		.replace("{{formats}}", `<option value=''></option>${Array.from(renderers.keys()).filter(i => i.indexOf(HTML) === -1).map(i => `<option value='${i.trim()}'>${i.replace(/^.*\//, "").toUpperCase()}</option>`).join("\n")}`)
		.replace("{{body}}", sanitize(JSON.stringify(arg, null, 2)))
		.replace("{{year}}", new Date().getFullYear())
		.replace("{{version}}", req.server.config.version)
		.replace("{{allow}}", headers.allow)
		.replace("{{methods}}", explode((headers?.allow ?? EMPTY).replace(HEADER_ALLOW_GET, EMPTY)).filter(i => i !== EMPTY).map(i => `<option value='${i.trim()}'>$i.trim()}</option>`).join("\n"))
		.replace("{{csrf}}", headers?.[X_CSRF_TOKEN] ?? EMPTY)
		.replace("class=\"headers", req.server.config.renderHeaders === false ? "class=\"headers dr-hidden" : "class=\"headers") : EMPTY;
}
