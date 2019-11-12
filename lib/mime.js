"use strict";

const {extname} = require("path"),
	valid = Object.entries(require("mime-db")).filter(i => "extensions" in i[1]),
	extensions = valid.reduce((a, v) => {
		const result = Object.assign({type: v[0]}, v[1]);

		for (const key of result.extensions) {
			a[`.${key}`] = result;
		}

		return a;
	}, {});

module.exports = (arg = "") => {
	const ext = extname(arg);

	return ext in extensions ? extensions[ext].type : "application/octet-stream";
};
