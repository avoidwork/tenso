function includes (a = "", b = "") {
	return a.indexOf(b) !== -1;
}

export function hasBody (arg) {
	return includes(arg, "PATCH") || includes(arg, "POST") || includes(arg, "PUT");
}

export function hasRead (arg) {
	return includes(arg, "GET") || includes(arg, "HEAD") || includes(arg, "OPTIONS");
}

export function jsonWrap (arg) {
	const a = arg[0],
		b = arg[arg.length - 1];

	return (a === "\"" && b === "\"") || (a === "[" && b === "]") || (a === "{" && b === "}"); // eslint-disable-line no-extra-parens
}
