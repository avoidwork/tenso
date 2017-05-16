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

	router({css: {current: "is-active", hidden: "dr-hidden"}, callback: ev => {
		window.requestAnimationFrame(() => {
			document.querySelectorAll("li.is-active").forEach(i => i.classList.remove("is-active"));
			ev.trigger.parentNode.classList.add("is-active");
		});
	}});

	document.querySelector("#formats").onchange = function (ev) {
		console.log(ev);
	};
})();
