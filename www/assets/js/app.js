"use strict";

(function () {
	function escape(arg) {
		return arg.replace(/[\-\[\]{}()*+?.,\\\/\^\$|#\s]/g, "\\$&");
	}

	// Stage 1 of prettifying a <code>
	function prepare(html) {
		var keys = Array.from(html.match(/\".*":/g)),
		    matches = Array.from(keys.concat(html.match(/:\s(\".*\"|\d{3,3}|null)/g))),
		    replaces = matches.map(function (i) {
			keys.includes(i) ? i.replace(/(\"(.*)\")/, "<span class='key $2'>$1</span>") : i.replace(/(\".*\"|\d{3,3}|null)/, "<span class='item'>$1</span>");
		});

		var output = html;

		matches.forEach(function (i, idx) {
			output = output.replace(new RegExp(escape(i), "g"), replaces[idx]);
		});

		return output;
	}

	// Prettifies a <code>
	function prettify(arg) {
		// Changing <pre> into selectable Elements
		arg.parentNode.parentNode.innerHTML = prepare(arg.innerHTML).replace(/\n/g, "<br>\n").replace(/(\s{2,2})/g, "<span class='spaces'></span>");

		// Changing URIs into anchors
		document.querySelectorAll(".item").forEach(function (i) {
			var html = i.innerHTML,
			    val = html.replace(/(^\"|\"$)/g, "");

			if (val.indexOf("/") === 0 || val.indexOf("//") > -1) {
				html = html.replace(val, "<a href='" + val + "' title='View " + val + "'>" + val + "</a>");
			}

			i.innerHTML = html;
		});
	}

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
	};

	// Setting up the UI
	window.requestAnimationFrame(function () {
		// Hiding the request tab if read-only
		if (!/(PATCH|PUT|POST)/.test(document.querySelector("#allow").innerText)) {
			document.querySelector("li.request").classList.add("dr-hidden");
		}

		// Resetting format selection (back button)
		document.querySelector("#formats").selectedIndex = 0;

		// Prettifying the response
		prettify(document.querySelector("#body"));
	});
})();
//# sourceMappingURL=app.js.map