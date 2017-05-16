"use strict";

(function () {
	var now = new Date().getTime(),
	    render = window.requestAnimationFrame || function (arg) {
		setTimeout(arg(now), 16);
	};

	console.log(["        ,----,", "      ,/   .`|", "    ,`   .'  :", "  ;    ;     /", ".'___,/    ,'              ,---,              ,---.", "|    :     |           ,-+-. /  | .--.--.    '   ,'\\", ";    |.';  ;   ,---.  ,--.'|'   |/  /    '  /   /   |", "`----'  |  |  /     \\|   |  ,\"' |  :  /`./ .   ; ,. :", "    '   :  ; /    /  |   | /  | |  :  ;_   '   | |: :", "    |   |  '.    ' / |   | |  | |\\  \\    `.'   | .; :", "    '   :  |'   ;   /|   | |  |/  `----.   \\   :    |", "    ;   |.' '   |  / |   | |--'  /  /`--'  /\\   \\  /", "    '---'   |   :    |   |/     '--'.     /  `----'", "             \\   \\  /'---'        `--'---'", "              `----'"].join("\n"));

	router({ css: { current: "is-active", hidden: "dr-hidden" }, callback: function callback(ev) {
			render(function () {
				document.querySelectorAll("li.is-active").forEach(function (i) {
					return i.classList.remove("is-active");
				});
				ev.trigger.parentNode.classList.add("is-active");
				console.log(ev.element.id, "is visible");
			});
		} });

	document.querySelector("#formats").onchange = function (ev) {
		console.log(ev);
	};
})();
//# sourceMappingURL=app.js.map