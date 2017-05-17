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

	// Creating a DOM router
	router({css: {current: "is-active", hidden: "dr-hidden"}, callback: ev => {
		window.requestAnimationFrame(() => {
			const methods = document.querySelector("#methods");

			document.querySelectorAll("li.is-active").forEach(i => i.classList.remove("is-active"));
			ev.trigger.parentNode.classList.add("is-active");

			if (methods !== null) {
				let form = document.querySelector("form");

				form.setAttribute("method", methods.options[methods.selectedIndex].value);

				// Intercepting the submission
				form.onsubmit = ev => {
					ev.preventDefault();
					ev.stopPropagation();
					window.requestAnimationFrame(() => ev.target.querySelector("button").classList.add("is-loading"));
				};

				methods.onchange = () => form.setAttribute("method", methods.options[methods.selectedIndex].value);
			}
		});
	}});

	// Wiring up format selection
	document.querySelector("#formats").onchange = ev => {
		window.location = window.location.pathname + "?format=" + ev.target.options[ev.target.selectedIndex].value;
	};

	// Wiring up JSON validation
	document.querySelector("textarea").onkeyup = ev => {
		if (ev.target.value !== "") {
			ev.target.classList.remove("is-danger");
			document.querySelector(".button.is-primary").classList.remove("is-disabled");
		} else {
			ev.target.classList.add("is-danger");
			document.querySelector(".button.is-primary").classList.add("is-disabled");
		}
	};

	// Setting up the UI
	window.requestAnimationFrame(() => {
		// Hiding the request tab if read-only
		if (!(/(PATCH|PUT|POST)/).test(document.querySelector("#allow").innerText)) {
			document.querySelector("li.request").classList.add("dr-hidden");
		}

		// Resetting format selection (back button)
		document.querySelector("#formats").selectedIndex = 0;

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
