/**
 * Renderers
 *
 * @type {Object}
 */
let renderers = {
	csv: {
		fn: function (arg, req) {
			req.headers.accept = "text/csv";
			return arg.data.result;
		},
		header: "text/csv"
	},
	html: {
		fn: function (arg, req, headers, tpl) {
			let protocol = req.headers["x-forwarded-proto"] ? req.headers["x-forwarded-proto"] + ":" : req.parsed.protocol;

			return (tpl || "")
				.replace(/\{\{title\}\}/g, req.server.config.title)
				.replace("{{url}}", req.parsed.href.replace(req.parsed.protocol, protocol))
				.replace("{{headers}}", Object.keys(headers).sort(array.sort).map(function (i) {
					return "<tr><td>" + i + "</td><td>" + sanitize(headers[i]) + "</td></tr>";
				}).join("\n"))
				.replace("{{formats}}", req.server.config.renderers.map(function (i) {
					return "<option value='" + i + "'>" + i.toUpperCase() + "</option>";
				}).join("\n"))
				.replace("{{body}}", JSON.stringify(arg, null, 2))
				.replace("{{year}}", new Date().getFullYear())
				.replace("{{version}}", "{{VERSION}}")
				.replace("{{allow}}", headers.allow)
				.replace("{{methods}}", string.explode(headers.allow.replace("GET, HEAD, OPTIONS", "")).filter(function (i) {
					return i !== "";
				}).map(function (i) {
					return "<option value='" + i + "'>" + i + "</option>";
				}).join("\n"))
				.replace("{{csrf}}", headers["x-csrf-token"] || "");
		},
		header: "text/html"
	},
	json: {
		fn: function (arg) {
			return arg;
		},
		header: "application/json"
	},
	yaml: {
		fn: function (arg) {
			return yaml.stringify(arg, 4);
		},
		header: "application/yaml"
	},
	xml: {
		fn: function (arg) {
			return xml.encode(arg);
		},
		header: "application/xml"
	}
};
