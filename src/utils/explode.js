export function explode (arg = "", delimiter = ",") {
	return arg.trim().split(new RegExp(`\\s*${delimiter}\\s*`));
}
