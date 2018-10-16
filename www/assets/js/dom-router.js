/**
 * URL hash DOM router
 *
 * @author Jason Mulligan <jason.mulligan@avoidwork.com>
 * @copyright 2018
 * @license BSD-3-Clause
 * @version 3.0.8
 */
(function (document, window) {
	const not_hash = /.*\#/,
		includes = typeof Array.includes === "function" ? (obj, arg) => obj.includes(arg) : (obj, arg) => obj.indexOf(arg) > -1,
		from = typeof Array.from === "function" ? arg => Array.from(arg) : arg => [].slice.call(arg),
		has = (a, b) => a in b,
		time = new Date().getTime(),
		render = window.requestAnimationFrame || function (fn) { setTimeout(fn(new Date().getTime() - time), 16); };

	class Route {
		constructor (cfg) {
			this.hash = cfg.hash;
			this.element = cfg.element;
			this.trigger = cfg.trigger;
			this.timestamp = new Date().toISOString();
		}
	}

	class Router {
		constructor ({active = true, callback = function () {}, css = {current: "dr-current", hidden: "dr-hidden"}, ctx = document.body, start = null, delimiter = "/", error = function () {}, logging = false, stop = true} = {}) {
			this.active = active;
			this.callback = callback;
			this.css = css;
			this.ctx = ctx;
			this.error = error;
			this.start = start;
			this.delimiter = delimiter;
			this.history = [];
			this.logging = logging;
			this.routes = [];
			this.stop = stop;
		}

		current () {
			return this.history[0];
		}

		hashchange (ev) {
			const oldHash = includes(ev.oldURL, "#") ? ev.oldURL.replace(not_hash, "") : null,
				newHash = includes(ev.newURL, "#") ? ev.newURL.replace(not_hash, "") : null;

			if (this.active && this.valid(newHash)) {
				if (this.stop === true && typeof ev.stopPropagation === "function") {
					ev.stopPropagation();

					if (typeof ev.preventDefault === "function") {
						ev.preventDefault();
					}
				}

				if (!includes(this.routes, newHash)) {
					this.route(this.routes.filter(i => includes(i, newHash))[0] || this.start);
				} else {
					render(() => {
						try {
							const oldHashes = oldHash ? oldHash.split(this.delimiter) : [],
								newHashes = newHash.split(this.delimiter);
							let newEl, newTrigger;

							newHashes.forEach((i, idx) => {
								let nth = idx + 1,
									valid = oldHashes.length >= nth,
									oldEl = valid ? this.select("#" + oldHashes.slice(0, nth).join(" #"))[0] : null,
									oldTrigger = valid ? this.select("a[href='#" + oldHashes.slice(0, nth).join(this.delimiter) + "']")[0] : null;

								newEl = this.select("#" + newHashes.slice(0, nth).join(" #"))[0];
								newTrigger = this.select("a[href='#" + newHashes.slice(0, nth).join(this.delimiter) + "']")[0];
								this.load(oldTrigger || null, oldEl || null, newTrigger || null, newEl || null);
							}, this);

							const r = new Route({
								element: newEl || null,
								hash: newHash,
								trigger: newTrigger || null
							});

							this.log(r);
							this.callback(r);
						} catch (err) {
							this.error(err);
						}
					});
				}
			}
		}

		load (oldTrigger, oldEl, newTrigger, newEl) {
			if (oldTrigger && this.css.current) {
				oldTrigger.classList.remove(this.css.current);
			}

			if (oldEl && oldEl.id !== newEl.id) {
				oldEl.classList.add(this.css.hidden);
			}

			if (newTrigger && this.css.current) {
				newTrigger.classList.add(this.css.current);
			}

			if (newEl) {
				this.sweep(newEl, this.css.hidden);
			}

			return this;
		}

		log (arg) {
			if (this.logging) {
				this.history.unshift(arg);
			}

			return this;
		}

		process () {
			const hash = document.location.hash.replace("#", "");

			this.scan(this.start);

			if (!has(this.css.hidden, this.ctx.classList)) {
				if (hash !== "" && includes(this.routes, hash)) {
					this.hashchange({oldURL: "", newURL: document.location.hash});
				} else {
					this.route(this.start);
				}
			}
		}

		route (arg = "") {
			document.location.hash = arg;

			return this;
		}

		select (arg) {
			return from(this.ctx.querySelectorAll.call(this.ctx, arg));
		}

		scan (arg) {
			this.routes = this.select("a").filter(i => includes(i.href, "#")).map(i => i.href.replace(not_hash, "")).filter(i => i !== "");
			this.start = arg || this.routes[0] || null;

			return this;
		}

		sweep (obj, klass) {
			from(obj.parentNode.childNodes).filter(i => i.nodeType === 1 && i.id && i.id !== obj.id).forEach(i => i.classList.add(klass));
			obj.classList.remove(klass);

			return this;
		}

		valid (arg = "") {
			return arg === "" || (/=/).test(arg) === false;
		}
	}

	function factory (arg) {
		const obj = new Router(arg);

		obj.hashchange = obj.hashchange.bind(obj);

		if ("addEventListener" in window) {
			window.addEventListener("hashchange", obj.hashchange, false);
		} else {
			window.onhashchange = obj.hashchange;
		}

		if (obj.active) {
			obj.process();
		}

		return obj;
	}

	factory.version = "3.0.8";

	// CJS, AMD & window supported
	if (typeof exports !== "undefined") {
		module.exports = factory;
	} else if (typeof define === "function" && define.amd !== void 0) {
		define(() => factory);
	} else {
		window.router = factory;
	}
}(document, window));
