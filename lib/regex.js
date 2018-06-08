"use strict";

const path = require("path"),
	{each} = require("retsu"),
	config = require(path.join(__dirname, "..", "config.json")),
	regex = {
		body: /^(PUT|POST|PATCH)$/,
		bodySplit: /&|=/,
		compress: /(javascript|json|text|xml|yaml)/,
		collection: /(.*)(\/.*)$/,
		def: /deflate/,
		dir: /\/$/,
		encodeForm: /application\/x-www-form-urlencoded/,
		encodeJson: /application\/json/,
		head: /^HEAD$/,
		"get": /^(GET|HEAD|OPTIONS)$/,
		getOnly: /^GET$/i,
		getRewrite: /^(HEAD|OPTIONS)$/,
		gzip: /gz/,
		hasParam: /\/:(\w*)/,
		hasOrderBy: /(\?|&)order_by/,
		hasOrderByDesc: /(\?|&)order_by=desc/,
		indent: /application\/json;\sindent=(\d+)/,
		jsonWrap: /^[\[\{"]/,
		leading: /.*\//,
		leftBrace: /\(/,
		mimetype: /;.*/,
		modify: /DELETE|PATCH|POST|PUT/,
		options: /^OPTIONS$/,
		orderBy: /^order_by\=/,
		partial: /^bytes=/,
		private: /private/,
		scheme: /^(\w+\:\/\/)|\//,
		trailing: /_.*$/,
		trailingS: /s$/,
		trailingSlash: /\/$/,
		trailingY: /y$/,
		unsortable: /boolean|number|string|void 0/
	};

each(Object.keys(config.regex || {}), key => {
	regex[key] = new RegExp(config.regex[key], "i");
});

module.exports = regex;
