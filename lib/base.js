"use strict";

const {METHODS} = require("http");

function Base () {
	this.router = {
		use: () => void 0
	};
}

Base.prototype.del = function (...args) {
	this.router.use(...args, "DELETE");
};

METHODS.forEach(i => {
	Base.prototype[i.toLowerCase()] = function (...args) {
		this.router.use(...args, i);
	};
});

module.exports = Base;
