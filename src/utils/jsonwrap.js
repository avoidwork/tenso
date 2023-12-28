export function jsonWrap (arg) {
	const a = arg[0],
		b = arg[arg.length - 1];

	return (a === "\"" && b === "\"") || (a === "[" && b === "]") || (a === "{" && b === "}"); // eslint-disable-line no-extra-parens
}
