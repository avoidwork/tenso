"use strict";

module.exports = {
	bodySplit: /&|=/,
	compress: /(javascript|json|text|xml|yaml)/,
	collection: /(.*)(\/.*)$/,
	def: /deflate/,
	dir: /\/$/,
	hasParam: /\/:\w*/,
	hypermedia: /(([a-z]+(_)?)?id|url|uri)$/i,
	id: /^_?id$/i,
	indent: /application\/json;\sindent=(\d+)/,
	leading: /.*\//,
	leftBrace: /\(/,
	mimetype: /;.*/,
	scheme: /^(\w+\:\/\/)|\//,
	trailing: /_.*$/,
	trailingS: /s$/,
	trailingSlash: /\/$/,
	trailingY: /y$/
};
