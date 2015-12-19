const path = require("path"),
	regex = require(path.join(__dirname, "regex.js"));

function coerce (value) {
	let tmp;

	if (value === null || value === undefined) {
		return undefined;
	} else if (value === "true") {
		return true;
	} else if (value === "false") {
		return false;
	} else if (value === "null") {
		return null;
	} else if (value === "undefined") {
		return undefined;
	} else if (value === "") {
		return value;
	} else if (!isNaN(tmp = Number(value))) {
		return tmp;
	} else if (regex.json_wrap.test(value)) {
		return JSON.parse(value);
	} else {
		return value;
	}
}

function iterate (obj, fn) {
	if (obj instanceof Object) {
		Object.keys(obj).forEach(function (i) {
			fn.call(obj, obj[i], i);
		});
	} else {
		obj.forEach(fn);
	}
}

module.exports = {
	coerce: coerce,
	iterate: iterate
};
