"use strict";

(function () {
	const now = new Date().getTime(),
		render = window.requestAnimationFrame || function (arg) {
			setTimeout(arg(now), 16);
		};

	//const observer = observable();

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
		render(() => {
			document.querySelectorAll("li.is-active").forEach(i => i.classList.remove("is-active"));
			ev.trigger.parentNode.classList.add("is-active");
			console.log(arg.element.id, "is visible");
		});
	}});

	// Hooking into every click event
	//observer.hook(document.querySelector("body"), "click");

	// Capturing events, and redirecting
	/*observer.on("click", function (ev) {
		ev.preventDefault();
		ev.stopPropagation();
		console.log(ev);
	});*/
})();
