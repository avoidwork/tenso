"use strict";

(function (document, window, location, fetch, router, localStorage) {
	// Wiring up the request tab
	const button = document.querySelector("button"),
		close = document.querySelector("#close"),
		form = document.querySelector("form"),
		formats = document.querySelector("#formats"),
		methods = document.querySelector("#methods"),
		modal = document.querySelector(".modal"),
		loading = modal.querySelector(".loading"),
		textarea = document.querySelector("textarea"),
		resBody = modal.querySelector(".body"),
		toggle = document.querySelector("#viewModeToggle"),
		body = document.querySelector("body"),
		json = /^[\[\{"]/,
		isJson = /application\/json/;

	if (methods.childElementCount > 0) {
		form.setAttribute("method", methods.options[methods.selectedIndex].value);
	}

	function escape (arg) {
		return arg.replace(/[\-\[\]{}()*+?.,\\\/\^\$|#\s]/g, "\\$&");
	}

	// Stage 1 of prettifying a <code>
	function prepare (html) {
		const keys = Array.from(html.match(/\".*":/g)),
			matches = Array.from(keys.concat(html.match(/:\s(\".*\"|\d{3,3}|null)/g))),
			replaces = matches.map(i => keys.includes(i) ? i.replace(/(\"(.*)\")/, "<span class='key $2'>$1</span>") : i.replace(/(\".*\"|\d{3,3}|null)/, "<span class='item'>$1</span>"));

		let output = html;

		matches.forEach((i, idx) => {
			output = output.replace(new RegExp(escape(i), "g"), replaces[idx]);
		});

		return output;
	}

	// Prettifies a <code>
	function prettify (arg) {
		// Changing <pre> into selectable Elements
		arg.parentNode.parentNode.innerHTML = prepare(arg.innerHTML)
			.replace(/\n/g, "<br>\n")
			.replace(/(\s{2,2})/g, "<span class='spaces'></span>");

		// Changing URIs into anchors
		Array.from(document.querySelectorAll(".item")).forEach(i => {
			let html = i.innerHTML,
				val = html.replace(/(^\"|\"$)/g, "");

			if (val.indexOf("/") === 0 || val.indexOf("//") > -1) {
				html = html.replace(val, `<a href="${val}" title="View ${val}">${val}</a>`);
			}

			i.innerHTML = html;
		});
	}

	function maybeJson (arg) {
		let output = false;

		if (json.test(arg)) {
			try {
				JSON.parse(JSON.stringify(arg));
				output = true;
			} catch (err) {
				console.warn(err.message);
			}
		}

		return output;
	}

	function sanitize (arg = "") {
		let tmp = typeof arg !== "string" ? JSON.stringify(arg, null, 2) : arg;

		return tmp.replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
	}

	// Intercepting the submission
	form.onsubmit = ev => {
		ev.preventDefault();
		ev.stopPropagation();

		window.requestAnimationFrame(() => {
			resBody.innerText = "";
			resBody.classList.add("dr-hidden");
			loading.classList.remove("dr-hidden");
			button.classList.add("is-loading");
			modal.classList.add("is-active");
		});

		fetch(location.protocol + "//" + location.host + location.pathname, {method: methods.options[methods.selectedIndex].value, body: textarea.value, credentials: "include", headers: {"content-type": maybeJson(textarea.value) ? "application/json" : "application/x-www-form-urlencoded", "x-csrf-token": document.querySelector("#csrf").innerText}}).then(res => {
			if (!res.ok) {
				throw res;
			}

			return isJson.test(res.headers.get("content-type") || "") ? res.json() : res.text();
		}).then(arg => {
			window.requestAnimationFrame(() => {
				resBody.innerHTML = arg.data !== undefined ? Array.isArray(arg.data) ? arg.data.map(i => sanitize(i)).join("<br>\n") : sanitize(arg.data) : sanitize(arg.data) || sanitize(arg);
				resBody.parentNode.classList.remove("has-text-centered");
				resBody.classList.remove("dr-hidden");
				loading.classList.add("dr-hidden");
				button.classList.remove("is-loading");
			});
		}).catch(res => {
			window.requestAnimationFrame(() => {
				resBody.innerHTML = "<h1 class=\"title\">" + res.status + " - " + res.statusText + "</h1>";
				resBody.parentNode.classList.add("has-text-centered");
				resBody.classList.remove("dr-hidden");
				loading.classList.add("dr-hidden");
				button.classList.remove("is-loading");
			});

			console.warn(res.status + " - " + res.statusText);
		});
	};

	methods.onchange = () => form.setAttribute("method", methods.options[methods.selectedIndex].value);

	// Creating a DOM router
	router({css: {current: "is-active", hidden: "dr-hidden"}, callback: ev => {
		window.requestAnimationFrame(() => {
			Array.from(document.querySelectorAll("li.is-active")).forEach(i => i.classList.remove("is-active"));
			ev.trigger?.[0]?.parentNode?.classList?.add("is-active");
		});
	}});

	// Wiring up format selection
	close.onclick = ev => {
		ev.preventDefault();
		ev.stopPropagation();
		button.classList.remove("is-loading");
		modal.classList.remove("is-active");
	};

	// Wiring up format selection
	formats.onchange = ev => {
		window.location = `${window.location.pathname}?format=${ev.target.options[ev.target.selectedIndex].value}${window.location.search.replace(/^\?/, "&")}`;
	};

	// Dark mode toggle
	toggle.onclick = ev => {
		ev.preventDefault();
		ev.stopPropagation();
		window.requestAnimationFrame(() => {
			body.classList.toggle("dark");
			const isDark = body.classList.contains("dark");
			toggle.innerText = isDark ? "Light" : "Dark";
			localStorage.setItem("tensoDark", isDark);
		});
	};

	// Setting up the UI
	window.requestAnimationFrame(() => {
		// Hiding the request tab if read-only
		if (!(/(PATCH|PUT|POST)/).test(document.querySelector("#allow").innerText)) {
			document.querySelector("li.request").classList.add("dr-hidden");
		}

		// Resetting format selection (back button)
		formats.selectedIndex = 0;

		// Prettifying the response
		prettify(document.querySelector("#body"));

		// Setting up dark mode
		if (localStorage.getItem("tensoDark") === "true") {
			toggle.click();
			console.log("Starting in dark mode");
		}
	});

	console.log([
		"        ,----,",
		"      ,/   .`|",
		"    ,`   .'  :",
		"  ;    ;     /",
		".'___,/    ,'              ,---,              ,---.",
		"|    :     |           ,-+-. /  | .--.--.    '   ,'\\",
		";    |.';  ;   ,---.  ,--.'|'   |/  /    '  /   /   |",
		"`----'  |  |  /     \\|   |  ,\"' |  :  /`./ .   ; ,. :",
		"    '   :  ; /    /  |   | /  | |  :  ;_   '   | |: :",
		"    |   |  '.    ' / |   | |  | |\\  \\    `.'   | .; :",
		"    '   :  |'   ;   /|   | |  |/  `----.   \\   :    |",
		"    ;   |.' '   |  / |   | |--'  /  /`--'  /\\   \\  /",
		"    '---'   |   :    |   |/     '--'.     /  `----'",
		"             \\   \\  /'---'        `--'---'",
		"              `----'"
	].join("\n"));
}(document, window, location, fetch, domRouter.router, localStorage));
