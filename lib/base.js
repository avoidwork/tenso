"use strict";

class Base {
	constructor () {
		this.router = {
			all: () => void 0,
			allowed: () => void 0,
			allows: () => void 0,
			always: () => void 0,
			connect: () => void 0,
			del: () => void 0,
			delete: () => void 0,
			get: () => void 0,
			options: () => void 0,
			patch: () => void 0,
			post: () => void 0,
			put: () => void 0,
			trace: () => void 0,
			use: () => void 0
		};
	}

	all (route, fn) {
		this.router.always(route, fn);

		return this;
	}

	allows (...args) {
		return this.router.allows(...args);
	}

	allowed (...args) {
		return this.router.allowed(...args);
	}

	always (...args) {
		this.router.always(...args);

		return this;
	}

	connect (...args) {
		this.router.connect(...args);

		return this;
	}

	del (...args) {
		this.router.delete(...args);

		return this;
	}

	delete (...args) {
		this.router.delete(...args);

		return this;
	}

	get (...args) {
		this.router.get(...args);

		return this;
	}

	options (...args) {
		this.router.options(...args);

		return this;
	}

	patch (...args) {
		this.router.patch(...args);

		return this;
	}

	post (...args) {
		this.router.post(...args);

		return this;
	}

	put (...args) {
		this.router.put(...args);

		return this;
	}

	trace (...args) {
		this.router.trace(...args);

		return this;
	}
}

module.exports = Base;
