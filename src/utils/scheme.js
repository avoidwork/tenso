export function scheme (arg = "") {
	return arg.includes("://") || arg[0] === "/";
}
