export function indent (arg = "", fallback = 0) {
	return arg.includes("indent=") ? parseInt(arg.match(/indent=(\d+)/)[1], 10) : fallback;
}
