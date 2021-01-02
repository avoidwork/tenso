"use strict";

class Base {
	constructor () {
		this.router = {
			use: () => void 0
		};
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
