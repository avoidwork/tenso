"use strict";

const path = require("path"),
	cfg = require(path.join(__dirname, "..", "config.json")),
	iterate = require(path.join(__dirname, "iterate.js")),
	regex = {
		body: /POST|PUT|PATCH/i,
		body_split: /&|=/,
		collection: /(.*)(\/.*)$/,
		encode_form: /application\/x-www-form-urlencoded/,
		encode_json: /application\/json/,
		get_rewrite: /HEAD|OPTIONS/,
		has_param: /\/:(\w*)/,
		has_order_by: /(\?|&)order_by/,
		has_order_by_desc: /(\?|&)order_by=desc/,
		json_wrap: /^[\[\{"]/,
		leading: /.*\//,
		mimetype: /;.*/,
		modify: /DELETE|PATCH|POST|PUT/,
		options: /OPTIONS/,
		order_by: /^order_by\=/,
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
