const array = require("retsu");

function iterate (obj, fn) {
	if (obj instanceof Object) {
		array.each(Object.keys(obj), i => {
			fn.call(obj, obj[i], i);
		});
	} else {
		array.each(obj, fn);
	}
}

module.exports = iterate;
