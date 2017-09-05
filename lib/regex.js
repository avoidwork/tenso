"use strict";

const path = require("path"),
	cfg = require(path.join(__dirname, "..", "config.json")),
	iterate = require(path.join(__dirname, "iterate.js")),
	regex = {
		body: /^(PUT|POST|PATCH)$/,
		body_split: /&|=/,
		compress: /(javascript|json|text|xml|yaml)/,
		collection: /(.*)(\/.*)$/,
		def: /deflate/,
		dir: /\/$/,
		encode_form: /application\/x-www-form-urlencoded/,
		encode_json: /application\/json/,
		head: /^HEAD$/,
		"get": /^(GET|HEAD|OPTIONS)$/,
		get_rewrite: /HEAD|OPTIONS/,
		get_only: /^GET$/i,
		gzip: /gz/,
		has_param: /\/:(\w*)/,
		has_order_by: /(\?|&)order_by/,
		has_order_by_desc: /(\?|&)order_by=desc/,
		indent: /application\/json;\sindent=(\d+)/,
		json_wrap: /^[\[\{"]/,
		leading: /.*\//,
		leftBrace: /\(/,
		mimetype: /;.*/,
		modify: /DELETE|PATCH|POST|PUT/,
		options: /^OPTIONS$/,
		order_by: /^order_by\=/,
		partial: /^bytes=/,
		private: /private/,
		scheme: /^(\w+\:\/\/)|\//,
		trailing: /_.*$/,
		trailing_s: /s$/,
		trailing_slash: /\/$/,
		trailing_y: /y$/,
		unsortable: /boolean|number|string|void 0/
	};

iterate(cfg.regex || {}, (value, key) => {
	regex[key] = new RegExp(value, "i");
});

module.exports = regex;
