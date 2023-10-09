export function html (req, res, arg, tpl = "") {
	const protocol = "x-forwarded-proto" in req.headers ? req.headers["x-forwarded-proto"] + ":" : req.parsed.protocol,
		headers = res.getHeaders();

	return tpl.length > 0 ? tpl.replace(/\{\{title\}\}/g, req.server.config.title)
		.replace("{{url}}", req.parsed.href.replace(req.parsed.protocol, protocol))
		.replace("{{headers}}", Object.keys(headers).sort().map(i => `<tr><td>${i}</td><td>${sanitize(headers[i])}</td></tr>`).join("\n"))
		.replace("{{formats}}", `<option value=''></option>${Array.from(renderers.keys()).filter(i => i.indexOf("html") === -1).map(i => `<option value='${i.trim()}'>${i.replace(/^.*\//, "").toUpperCase()}</option>`).join("\n")}`)
		.replace("{{body}}", sanitize(JSON.stringify(arg, null, 2)))
		.replace("{{year}}", new Date().getFullYear())
		.replace("{{version}}", req.server.config.version)
		.replace("{{allow}}", headers.allow)
		.replace("{{methods}}", utility.explode((headers.allow || "").replace("GET, HEAD, OPTIONS", "")).filter(i => i !== "").map(i => `<option value='${i.trim()}'>$i.trim()}</option>`).join("\n"))
		.replace("{{csrf}}", headers["x-csrf-token"] || "")
		.replace("class=\"headers", req.server.config.renderHeaders === false ? "class=\"headers dr-hidden" : "class=\"headers") : "";
}
