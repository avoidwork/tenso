export function hasBody (arg) {
	return arg.includes("PATCH") || arg.includes("POST") || arg.includes("PUT");
}

export function hasRead (arg) {
	return arg.includes("GET") || arg.includes("HEAD") || arg.includes("OPTIONS");
}

export function jsonWrap (arg) {
	const a = arg[0],
		b = arg[arg.length - 1];

	return (a === "\"" && b === "\"") || (a === "[" && b === "]") || (a === "{" && b === "}"); // eslint-disable-line no-extra-parens
}
