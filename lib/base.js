"use strict";

class Base {
	constructor () {
		this.router = {
			use: () => void 0
		};
	}

	acl (...args) {
		this.router.use(...args, "ACL");
	}

	bind (...args) {
		this.router.use(...args, "BIND");
	}

	checkout (...args) {
		this.router.use(...args, "CHECKOUT");
	}

	connect (...args) {
		this.router.use(...args, "CONNECT");
	}

	copy (...args) {
		this.router.use(...args, "COPY");
	}

	del (...args) {
		this.router.use(...args, "DELETE");
	}

	delete (...args) {
		this.router.use(...args, "DELETE");
	}

	get (...args) {
		this.router.use(...args, "GET");
	}

	head (...args) {
		this.router.use(...args, "HEAD");
	}

	link (...args) {
		this.router.use(...args, "LINK");
	}

	lock (...args) {
		this.router.use(...args, "LOCK");
	}

	"m-search" (...args) {
		this.router.use(...args, "M-SEARCH");
	}

	merge (...args) {
		this.router.use(...args, "MERGE");
	}

	mkactivity (...args) {
		this.router.use(...args, "MKACTIVITY");
	}

	mkcalendar (...args) {
		this.router.use(...args, "MKCALENDAR");
	}

	mkcol (...args) {
		this.router.use(...args, "MKCOL");
	}

	move (...args) {
		this.router.use(...args, "MOVE");
	}

	notify (...args) {
		this.router.use(...args, "NOTIFY");
	}

	options (...args) {
		this.router.use(...args, "OPTIONS");
	}

	patch (...args) {
		this.router.use(...args, "PATCH");
	}

	post (...args) {
		this.router.use(...args, "POST");
	}

	propfind (...args) {
		this.router.use(...args, "PROPFIND");
	}

	proppatch (...args) {
		this.router.use(...args, "PROPPATCH");
	}

	purge (...args) {
		this.router.use(...args, "PURGE");
	}

	put (...args) {
		this.router.use(...args, "PUT");
	}

	rebind (...args) {
		this.router.use(...args, "REBIND");
	}

	report (...args) {
		this.router.use(...args, "REPORT");
	}

	search (...args) {
		this.router.use(...args, "SEARCH");
	}

	source (...args) {
		this.router.use(...args, "SOURCE");
	}

	subscribe (...args) {
		this.router.use(...args, "SUBSCRIBE");
	}

	trace (...args) {
		this.router.use(...args, "TRACE");
	}

	unbind (...args) {
		this.router.use(...args, "UNBIND");
	}

	unlink (...args) {
		this.router.use(...args, "UNLINK");
	}

	unlock (...args) {
		this.router.use(...args, "UNLOCK");
	}

	unsubscribe (...args) {
		this.router.use(...args, "UNSUBSCRIBE");
	}
}

module.exports = Base;
