"use strict";

(function () {
	console.log(["        ,----,", "      ,/   .`|", "    ,`   .'  :", "  ;    ;     /", ".'___,/    ,'              ,---,              ,---.", "|    :     |           ,-+-. /  | .--.--.    '   ,'\\", ";    |.';  ;   ,---.  ,--.'|'   |/  /    '  /   /   |", "`----'  |  |  /     \\|   |  ,\"' |  :  /`./ .   ; ,. :", "    '   :  ; /    /  |   | /  | |  :  ;_   '   | |: :", "    |   |  '.    ' / |   | |  | |\\  \\    `.'   | .; :", "    '   :  |'   ;   /|   | |  |/  `----.   \\   :    |", "    ;   |.' '   |  / |   | |--'  /  /`--'  /\\   \\  /", "    '---'   |   :    |   |/     '--'.     /  `----'", "             \\   \\  /'---'        `--'---'", "              `----'"].join("\n"));

	// Creating a DOM router
	router({ css: { current: "is-active", hidden: "dr-hidden" }, callback: function callback(ev) {
			window.requestAnimationFrame(function () {
				document.querySelectorAll("li.is-active").forEach(function (i) {
					return i.classList.remove("is-active");
				});
				ev.trigger.parentNode.classList.add("is-active");
			});
		} });

	// Resetting format selection (back button)
	window.requestAnimationFrame(function () {
		if (!/(PATCH|PUT|POST)/.test(document.querySelector("#allow").innerText)) {
			document.querySelector("li.request").classList.add("dr-hidden");
		}

		document.querySelector("#formats").selectedIndex = 0;
	});

	// Wiring up format selection
	document.querySelector("#formats").onchange = function (ev) {
		window.location = window.location.pathname + "?format=" + ev.target.options[ev.target.selectedIndex].value;
	};
})();
//# sourceMappingURL=app.js.map