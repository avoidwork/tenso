"use strict";

function hasBody (arg) {
	return arg.includes("PATCH") || arg.includes("POST") || arg.includes("PUT");
}

module.exports = {
	hasBody
};
