"use strict";

const path = require("path"),
	{chunk} = require("retsu"),
	coerce = require("tiny-coerce"),
	{bodySplit} = require(path.join(__dirname, "regex.js"));

const parsers = new Map([
	[
		"application/x-www-form-urlencoded",
		arg => {
			const args = arg ? chunk(arg.split(bodySplit), 2) : [],
				result = {};

			for (const i of args) {
				result[decodeURIComponent(i[0].replace(/\+/g, "%20"))] = coerce(decodeURIComponent(i[1].replace(/\+/g, "%20")));
			}

			return result;
		}
	],
	[
		"application/json",
		arg => JSON.parse(arg)
	]
]);

module.exports = parsers;
