"use strict";

module.exports = {
	body: /^(PUT|POST|PATCH)$/,
	bodySplit: /&|=/,
	compress: /(javascript|json|text|xml|yaml)/,
	collection: /(.*)(\/.*)$/,
	def: /deflate/,
	dir: /\/$/,
	"get": /^(GET|HEAD|OPTIONS)$/,
	hasParam: /\/:\w*/,
	hasOrderByDesc: /(\?|&)order_by=desc/,
	hypermedia: /(([a-z]+(_)?)?id|url|uri)$/i,
	id: /^_?id$/i,
	indent: /application\/json;\sindent=(\d+)/,
	jsonWrap: /^[\[\{"]/,
	leading: /.*\//,
	leftBrace: /\(/,
	mimetype: /;.*/,
	modify: /DELETE|PATCH|POST|PUT/,
	orderBy: /^order_by\=/,
	scheme: /^(\w+\:\/\/)|\//,
	trailing: /_.*$/,
	trailingS: /s$/,
	trailingSlash: /\/$/,
	trailingY: /y$/
};
