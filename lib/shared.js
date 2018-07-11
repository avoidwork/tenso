"use strict";

function each (arr, fn) {
	const nth = arr.length;
	let i = -1;

	while (++i < nth) {
		fn(arr[i], i);
	}

	return arr;
}

module.exports = {
	each
};
