"use strict";

module.exports = {
	bodySplit: /&|=/,
	compress: /(javascript|json|text|xml|yaml)/,
	collection: /(.*)(\/.*)$/,
	hasParam: /\/:\w*/,
	hypermedia: /(([a-z]+(_)?)?id|url|uri)$/i,
	leading: /.*\//,
	leftBrace: /\(/,
	mimetype: /;.*/,
	trailing: /_.*$/,
	trailingS: /s$/,
	trailingSlash: /\/$/,
	trailingY: /y$/
};
