const str_indent = "indent=";

export function indent (arg = "", fallback = 0) {
	return arg.includes(str_indent) ? parseInt(arg.match(/indent=(\d+)/)[1], 10) : fallback;
}
