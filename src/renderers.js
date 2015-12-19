const array = require("retsu"),
	xml = require("tiny-xml"),
	yaml = require("yamljs"),
	path = require("path"),
	utility = require(path.join(__dirname, "utility.js"));

let renderers = new Map();

function sanitize (arg) {
	let output = arg;

	if (typeof arg === "string") {
		[["<", "&lt;"], [">", "&gt;"]].forEach(function (i) {
			output = output.replace(new RegExp(i[0], "g"), i[1]);
		});
	}

	return output;
}

renderers.set("text/csv", function (arg, req) {
	req.headers.accept = "text/csv";

	return arg.data.result;
});

renderers.set("text/html", function (arg, req, headers, tpl) {
	let protocol = req.headers["x-forwarded-proto"] ? req.headers["x-forwarded-proto"] + ":" : req.parsed.protocol;

	return (tpl || "")
		.replace(/\{\{title\}\}/g, req.server.config.title)
		.replace("{{url}}", req.parsed.href.replace(req.parsed.protocol, protocol))
		.replace("{{headers}}", Object.keys(headers).sort(array.sort).map(function (i) {
			return "<tr><td>" + i + "</td><td>" + sanitize(headers[i]) + "</td></tr>";
		}).join("\n"))
		.replace("{{formats}}", "<option value=''></option>" + Array.from(renderers.keys()).filter(function (i) { return i.indexOf("html") === -1; }).map(function (i) {
			return "<option value='" + i + "'>" + i.replace(/^.*\//, "").toUpperCase() + "</option>";
		}).join("\n"))
		.replace("{{body}}", JSON.stringify(arg, null, 2))
		.replace("{{year}}", new Date().getFullYear())
		.replace("{{version}}", "{{VERSION}}")
		.replace("{{allow}}", headers.allow)
		.replace("{{methods}}", utility.explode(headers.allow.replace("GET, HEAD, OPTIONS", "")).filter(function (i) {
			return i !== "";
		}).map(function (i) {
			return "<option value='" + i + "'>" + i + "</option>";
		}).join("\n"))
		.replace("{{csrf}}", headers["x-csrf-token"] || "");
});

renderers.set("application/javascript", function (arg, req, headers) {
	req.headers.accept = "application/javascript";
	headers["content-type"] = "application/javascript";

	return (req.parsed.query.callback || "callback") + "(" + JSON.stringify(arg, null, 0) + ");";
});

renderers.set("application/json", function (arg) {
	return arg;
});

renderers.set("application/yaml", function (arg) {
	return yaml.stringify(arg, 4);
});

renderers.set("application/xml", function (arg) {
	return xml.serialize(arg);
});

module.exports = renderers;
