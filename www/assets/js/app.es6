"use strict";

(function () {
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

	// Creating a DOM router
	router({css: {current: "is-active", hidden: "dr-hidden"}, callback: ev => {
		window.requestAnimationFrame(() => {
			document.querySelectorAll("li.is-active").forEach(i => i.classList.remove("is-active"));
			ev.trigger.parentNode.classList.add("is-active");
		});
	}});

	// Setting up the UI
	window.requestAnimationFrame(() => {
		// Hiding the request tab if read-only
		if (!(/(PATCH|PUT|POST)/).test(document.querySelector("#allow").innerText)) {
			document.querySelector("li.request").classList.add("dr-hidden");
		}

		// Resetting format selection (back button)
		document.querySelector("#formats").selectedIndex = 0;
	});

	// Wiring up format selection
	document.querySelector("#formats").onchange = function (ev) {
		window.location = window.location.pathname + "?format=" + ev.target.options[ev.target.selectedIndex].value;
	};

	// Wiring up JSON validation
	document.querySelector("textarea").onchange = function (ev) {
		try {
			JSON.parse(JSON.stringify(ev.target.value));
			ev.target.classList.remove("is-danger");
			document.querySelector(".button.is-primary").classList.remove("is-disabled");
		} catch (e) {
			ev.target.classList.add("is-danger");
			document.querySelector(".button.is-primary").classList.add("is-disabled");
			console.log(e);
		}
	}
})();
