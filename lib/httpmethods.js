"use strict";

const http = require("http"),
	each = require("retsu").each;

function HTTPMethods () {
	this.router = {
		use: () => void 0
	};
}

HTTPMethods.prototype.del = function (...args) {
	this.router.use(...args, "DELETE");
};

each(http.METHODS, i => {
	HTTPMethods.prototype[i.toLowerCase()] = function (...args) {
		this.router.use(...args, i);
	};
});

module.exports = HTTPMethods;
