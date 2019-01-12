"use strict";

module.exports = {
	bodySplit: /&|=/,
	compress: /(javascript|json|text|xml|yaml)/,
	collection: /(.*)(\/.*)$/,
	hasParam: /\/:\w*/,
	hypermedia: /(([a-z]+(_)?)?id|url|uri)$/i,
	id: /^_?id$/i,
	leading: /.*\//,
	leftBrace: /\(/,
	mimetype: /;.*/,
	scheme: /^(\w+\:\/\/)|\//,
	trailing: /_.*$/,
	trailingS: /s$/,
	trailingSlash: /\/$/,
	trailingY: /y$/
};
