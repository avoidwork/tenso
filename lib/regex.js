"use strict";

module.exports = {
	bodySplit: /&|=/,
	collection: /(.*)(\/.*)$/,
	hypermedia: /(([a-z]+(_)?)?id|url|uri)$/i,
	leading: /.*\//,
	leftBrace: /\(/,
	mimetype: /;.*/,
	trailing: /_.*$/,
	trailingS: /s$/,
	trailingSlash: /\/$/,
	trailingY: /y$/
};
