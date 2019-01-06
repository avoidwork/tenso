"use strict";

function each (arr, fn) {
	const nth = arr.length;
	let i = -1;

	while (++i < nth) {
		fn(arr[i], i);
	}

	return arr;
}

function hasBody (arg) {
	return arg.includes("PATCH") || arg.includes("POST") || arg.includes("PUT");
}

function canGet (arg) {
	return arg.includes("GET") || arg.includes("HEAD") || arg.includes("OPTIONS");
}

function canModify (arg) {
	return arg.includes("DELETE") || hasBody(arg);
}

function jsonWrap (arg) {
	const x = arg[0];

	return x === "\"" || x === "[" || x === "{";
}

module.exports = {
	canGet,
	canModify,
	each,
	hasBody,
	jsonWrap
};
