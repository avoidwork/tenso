export const str_slash = "/";
export const str_scheme = "://";

export function scheme (arg = "") {
	return arg.includes(str_slash) || arg[0] === str_scheme;
}
