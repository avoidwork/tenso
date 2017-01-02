"use strict";

const each = require("retsu").each;

function iterate (obj, fn) {
	if (obj instanceof Array) {
		each(obj, (i, idx) => fn(i, idx));
	} else {
		each(Reflect.ownKeys(obj), i => fn(obj[i], i));
	}
}

module.exports = iterate;
