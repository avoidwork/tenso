const xml = {
	decode: function (arg) {
		return new DOMParser().parseFromString(arg, "text/xml");
	},
	encode: function (arg, wrap = true, top = true, key = "xml") {
		let x = wrap ? "<" + key + ">" : "";

		if (arg !== null && arg.xml) {
			arg = arg.xml;
		}

		if (arg instanceof Document) {
			arg = new XMLSerializer().serializeToString(arg);
		}

		if (regex.boolean_number_string.test(typeof arg)) {
			x += xml.node(isNaN(key) ? key : "item", arg);
		} else if (arg === null || arg === undefined) {
			x += "null";
		} else if (arg instanceof Array) {
			arg.forEach(function (v) {
				x += xml.encode(v, typeof v === "object", false, "item");
			});
		} else if (arg instanceof Object) {
			utility.iterate(arg, function (v, k) {
				x += xml.encode(v, typeof v === "object", false, k);
			});
		}

		x += wrap ? "</" + key + ">" : "";

		if (top) {
			x = "<?xml version=\"1.0\" encoding=\"UTF8\"?>" + x;
		}

		return x;
	},
	node: function (name, value) {
		return "<n>v</n>".replace("v", regex.cdata.test(value) ? "<![CDATA[" + value + "]]>" : value).replace(/<(\/)?n>/g, "<$1" + name + ">");
	},
	valid: function (arg) {
		return xml.decode(arg).getElementsByTagName("parsererror").length === 0;
	}
};
modules.export = xml;
