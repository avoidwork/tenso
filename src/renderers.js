"use strict";

const xml = require("tiny-xml"),
	yaml = require("yamljs"),
	path = require("path"),
	csv = require("csv.js"),
	utility = require(path.join(__dirname, "utility.js")),
	renderers = new Map();

function indent (arg = "", fallback = 0) {
	return arg.includes("indent=") ? parseInt(arg.match(/indent=(\d+)/)[1], 10) : fallback;
}

function sanitize (arg) {
	return typeof arg === "string" ? arg.replace(/</g, "&lt;").replace(/>/g, "&gt;") : arg;
}

function text (req, res, arg) {
	return Array.isArray(arg) ? arg.map(i => text(req, res, i)).join(",") : arg instanceof Object ? JSON.stringify(arg, null, indent(req.headers.accept, req.server.config.json)) : arg.toString();
}

renderers.set("application/json", (req, res, arg) => JSON.stringify(arg, null, indent(req.headers.accept, req.server.config.json)));
renderers.set("application/yaml", (req, res, arg) => yaml.stringify(arg));
renderers.set("application/xml", (req, res, arg) => xml.serialize(arg));
renderers.set("text/plain", text);

renderers.set("application/javascript", (req, res, arg) => {
	req.headers.accept = "application/javascript";
	res.header("content-type", "application/javascript");

	return `${req.parsed.searchParams.get("callback") || "callback"}(${JSON.stringify(arg, null, 0)});`;
});

renderers.set("text/csv", (req, res, arg) => {
	const val = arg.data || arg.error || arg;

	req.headers.accept = "text/csv";
	res.header("content-type", "text/csv");
	res.header("content-disposition", `attachment; filename="${(req.parsed.pathname.replace(/.*\//g, "") || "download").replace(/\..*/, "_")}.csv"`);

	return csv.encode(Array.isArray(val) ? val : val instanceof Object === false ? {data: val} : val);
});

renderers.set("text/html", (req, res, arg, tpl = "") => {
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
});

module.exports = renderers;
