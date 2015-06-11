/**
 * Sanitizes outbound Strings to avoid XSS issues
 *
 * @method sanitize
 * @param  {String} arg String to sanitize
 * @return {String}     Sanitized String
 */
function sanitize (arg) {
	let output = arg;

	if (typeof arg === "string") {
		array.each([["<", "&lt;"], [">", "&gt;"]], function (i) {
			output = output.replace(new RegExp(i[0], "g"), i[1]);
		});
	}

	return output;
}
