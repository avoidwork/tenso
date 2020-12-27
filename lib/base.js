"use strict";

class Base {
	constructor () {
		this.router = {
			use: () => void 0
		};
	}

	connect (...args) {
		this.router.use(...args, "CONNECT");

		return this;
	}

	del (...args) {
		this.router.use(...args, "DELETE");

		return this;
	}

	delete (...args) {
		this.router.use(...args, "DELETE");

		return this;
	}

	get (...args) {
		this.router.use(...args, "GET");

		return this;
	}

	head (...args) {
		this.router.use(...args, "HEAD");

		return this;
	}

	options (...args) {
		this.router.use(...args, "OPTIONS");

		return this;
	}

	patch (...args) {
		this.router.use(...args, "PATCH");

		return this;
	}

	post (...args) {
		this.router.use(...args, "POST");

		return this;
	}

	put (...args) {
		this.router.use(...args, "PUT");

		return this;
	}

	trace (...args) {
		this.router.use(...args, "TRACE");

		return this;
	}
}

module.exports = Base;
