"use strict";

function each (arr, fn) {
	let i = -1;

	for (const item of arr) {
		fn(item, ++i);
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
	const a = arg[0],
		b = arg[arg.length - 1];

	return (a === "\"" && b === "\"") || (a === "[" && b === "]") || (a === "{" && b === "}"); // eslint-disable-line no-extra-parens
}

module.exports = {
	canGet,
	canModify,
	each,
	hasBody,
	jsonWrap
};
