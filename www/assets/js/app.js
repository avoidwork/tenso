"use strict";

(function () {
	console.log(["        ,----,", "      ,/   .`|", "    ,`   .'  :", "  ;    ;     /", ".'___,/    ,'              ,---,              ,---.", "|    :     |           ,-+-. /  | .--.--.    '   ,'\\", ";    |.';  ;   ,---.  ,--.'|'   |/  /    '  /   /   |", "`----'  |  |  /     \\|   |  ,\"' |  :  /`./ .   ; ,. :", "    '   :  ; /    /  |   | /  | |  :  ;_   '   | |: :", "    |   |  '.    ' / |   | |  | |\\  \\    `.'   | .; :", "    '   :  |'   ;   /|   | |  |/  `----.   \\   :    |", "    ;   |.' '   |  / |   | |--'  /  /`--'  /\\   \\  /", "    '---'   |   :    |   |/     '--'.     /  `----'", "             \\   \\  /'---'        `--'---'", "              `----'"].join("\n"));

	router({ css: { current: "is-active", hidden: "dr-hidden" }, callback: function callback(ev) {
			window.requestAnimationFrame(function () {
				document.querySelectorAll("li.is-active").forEach(function (i) {
					return i.classList.remove("is-active");
				});
				ev.trigger.parentNode.classList.add("is-active");
			});
		} });

	document.querySelector("#formats").onchange = function (ev) {
		console.log(ev);
	};
})();
//# sourceMappingURL=app.js.map