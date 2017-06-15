"use strict";

const xml = require("tiny-xml"),
	yaml = require("yamljs"),
	path = require("path"),
	csv = require("csv.js"),
	iterate = require(path.join(__dirname, "iterate.js")),
	utility = require(path.join(__dirname, "utility.js")),
	renderers = new Map();

function sanitize (arg) {
	let output = arg;

	if (typeof arg === "string") {
		iterate([["<", "&lt;"], [">", "&gt;"]], i => {
			output = output.replace(new RegExp(i[0], "g"), i[1]);
		});
	}

	return output;
}

renderers.set("text/csv", (arg, req, headers) => {
	req.headers.accept = "text/csv";
	headers["content-type"] = "text/csv";
	headers["content-disposition"] = "attachment; filename=\"" + req.parsed.pathname.replace(/.*\//g, "").replace(/\..*/, "_") + (req.parsed.search || "").replace("?", "").replace(/\&|=/g, "_") + ".csv\"";

	return csv.encode(arg);
});

renderers.set("text/html", (arg, req, headers, tpl) => {
	const protocol = req.headers["x-forwarded-proto"] ? req.headers["x-forwarded-proto"] + ":" : req.parsed.protocol;

	return (tpl || "")
		.replace(/\{\{title\}\}/g, req.server.config.title)
		.replace("{{url}}", req.parsed.href.replace(req.parsed.protocol, protocol))
		.replace("{{headers}}", Reflect.ownKeys(headers).sort().map(i => {
			return "<tr><td>" + i + "</td><td>" + sanitize(headers[i]) + "</td></tr>";
		}).join("\n"))
		.replace("{{formats}}", "<option value=''></option>" + Array.from(renderers.keys()).filter(i => i.indexOf("html") === -1).map(i => {
			return "<option value='" + i + "'>" + i.replace(/^.*\//, "").toUpperCase() + "</option>";
		}).join("\n"))
		.replace("{{body}}", JSON.stringify(arg, null, 2).replace(/</g, "&lt;").replace(/>/g, "&gt;"))
		.replace("{{year}}", new Date().getFullYear())
		.replace("{{version}}", req.server.config.version)
		.replace("{{allow}}", headers.allow)
		.replace("{{methods}}", utility.explode(headers.allow.replace("GET, HEAD, OPTIONS", "")).filter(i => i !== "").map(i => {
			return "<option value='" + i + "'>" + i + "</option>";
		}).join("\n"))
		.replace("{{csrf}}", headers["x-csrf-token"] || "");
});

renderers.set("application/javascript", (arg, req, headers) => {
	req.headers.accept = "application/javascript";
	headers["content-type"] = "application/javascript";

	return (req.parsed.query.callback || "callback") + "(" + JSON.stringify(arg, null, 0) + ");";
});

renderers.set("application/json", arg => arg);
renderers.set("application/yaml", arg => yaml.stringify(arg, 4));
renderers.set("application/xml", arg => xml.serialize(arg));

module.exports = renderers;
