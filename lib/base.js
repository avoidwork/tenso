"use strict";

const http = require("http"),
	{each} = require("retsu");

function Base () {
	this.router = {
		use: () => void 0
	};
}

Base.prototype.constructor = Base;

Base.prototype.del = function (...args) {
	this.router.use(...args, "DELETE");
};

each(http.METHODS, i => {
	Base.prototype[i.toLowerCase()] = function (...args) {
		this.router.use(...args, i);
	};
});

module.exports = Base;
