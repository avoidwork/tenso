"use strict";

const each = require("retsu").each;

function iterate (obj, fn) {
	if (Array.isArray(obj) === true) {
		each(obj, (i, idx) => fn(i, idx));
	} else {
		each(Reflect.ownKeys(obj), i => fn(obj[i], i));
	}
}

module.exports = iterate;
