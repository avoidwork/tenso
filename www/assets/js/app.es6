"use strict";

(function () {
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
		document.querySelectorAll(".item").forEach(i => {
			let html = i.innerHTML,
				val = html.replace(/(^\"|\"$)/g, "");

			if (val.indexOf( "/" ) === 0 || val.indexOf("//") > -1) {
				html = html.replace(val, "<a href='" + val + "' title='View " + val + "'>" + val + "</a>");
			}

			i.innerHTML = html;
		});
	}

	// Wiring up the request tab
	const button = document.querySelector("button"),
		close = document.querySelector("#close"),
		form = document.querySelector("form"),
		methods = document.querySelector("#methods"),
		modal = document.querySelector(".modal"),
		loading = modal.querySelector(".loading"),
		resBody = modal.querySelector(".body");
	
	let flight = false;

	form.setAttribute("method", methods.options[methods.selectedIndex].value);

	// Intercepting the submission
	form.onsubmit = ev => {
		ev.preventDefault();
		ev.stopPropagation();
		flight = true;
		window.requestAnimationFrame(() => {
			resBody.innerText = "";
			resBody.classList.add("dr-hidden");
			loading.classList.remove("dr-hidden");
			button.classList.add("is-loading");
			modal.classList.add("is-active");
		});
	};

	methods.onchange = () => form.setAttribute("method", methods.options[methods.selectedIndex].value);

	// Creating a DOM router
	router({css: {current: "is-active", hidden: "dr-hidden"}, callback: ev => {
		flight = false;
		window.requestAnimationFrame(() => {
			document.querySelectorAll("li.is-active").forEach(i => i.classList.remove("is-active"));
			ev.trigger.parentNode.classList.add("is-active");
		});
	}});

	// Wiring up format selection
	close.onclick = ev => {
		flight = false;
		ev.preventDefault();
		ev.stopPropagation();
		button.classList.remove("is-loading");
		modal.classList.remove("is-active");
	};

	// Wiring up format selection
	formats.onchange = ev => {
		window.location = window.location.pathname + "?format=" + ev.target.options[ev.target.selectedIndex].value;
	};

	// Wiring up JSON validation
	document.querySelector("textarea").onkeyup = ev => {
		if (ev.target.value !== "") {
			ev.target.classList.remove("is-danger");
			button.classList.remove("is-disabled");
		} else {
			ev.target.classList.add("is-danger");
			button.classList.add("is-disabled");
		}
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
})();
