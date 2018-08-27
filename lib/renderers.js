"use strict";

const xml = require("tiny-xml"),
	yaml = require("yamljs"),
	path = require("path"),
	csv = require("csv.js"),
	regex = require(path.join(__dirname, "regex.js")),
	utility = require(path.join(__dirname, "utility.js")),
	renderers = new Map();

function indent (req, val) {
	let result = val;

	if (req.headers.accept !== void 0) {
		const header = regex.indent.exec(req.headers.accept);

		if (header !== null) {
			result = parseInt(header[1], 10);
		}
	}

	return result;
}

function sanitize (arg) {
	return typeof arg === "string" ? arg.replace(/</g, "&lt;").replace(/>/g, "&gt;") : arg;
}

renderers.set("text/csv", (arg, req, headers) => {
	const val = arg.data || arg.error || arg,
		obj = Array.isArray(val) ? val : val instanceof Object === false ? {data: val} : val;

	req.headers.accept = "text/csv";
	headers["content-type"] = "text/csv";
	headers["content-disposition"] = `attachment; filename="${(req.parsed.pathname.replace(/.*\//g, "") || "download").replace(/\..*/, "_")}.csv"`;

	return csv.encode(obj);
});

renderers.set("text/html", (arg, req, headers, tpl) => {
	const protocol = req.headers["x-forwarded-proto"] ? req.headers["x-forwarded-proto"] + ":" : req.parsed.protocol;

	return (tpl || "")
		.replace(/\{\{title\}\}/g, req.server.config.title)
		.replace("{{url}}", req.parsed.href.replace(req.parsed.protocol, protocol))
		.replace("{{headers}}", Object.keys(headers).sort().map(i => `<tr><td>${i}</td><td>${sanitize(headers[i])}</td></tr>`).join("\n"))
		.replace("{{formats}}", `<option value=''></option>${(Array.from(renderers.keys()).filter(i => i.indexOf("html") === -1).map(i => `<option value='${i.trim()}'>${i.replace(/^.*\//, "").toUpperCase()}</option>`).join("\n"))}`)
		.replace("{{body}}", sanitize(JSON.stringify(arg, null, 2)))
		.replace("{{year}}", new Date().getFullYear())
		.replace("{{version}}", req.server.config.version)
		.replace("{{allow}}", headers.allow)
		.replace("{{methods}}", utility.explode((headers.allow || "").replace("GET, HEAD, OPTIONS", "")).filter(i => i !== "").map(i => `<option value='${i.trim()}'>$i.trim()}</option>`).join("\n"))
		.replace("{{csrf}}", headers["x-csrf-token"] || "")
		.replace("class=\"headers", req.server.config.renderHeaders === false ? "class=\"headers dr-hidden" : "class=\"headers");
});

renderers.set("text/plain", arg => arg.toString());

renderers.set("application/javascript", (arg, req, headers) => {
	req.headers.accept = "application/javascript";
	headers["content-type"] = "application/javascript";

	return `${(req.parsed.searchParams.get("callback") || "callback")}(${JSON.stringify(arg, null, 0)});`;
});

renderers.set("application/json", (arg, req) => JSON.stringify(arg, null, indent(req, req.server.config.json || 0)));
renderers.set("application/yaml", (arg, req) => yaml.stringify(arg, indent(req, 0)));
renderers.set("application/xml", arg => xml.serialize(arg));

module.exports = renderers;
