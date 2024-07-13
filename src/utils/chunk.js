export function chunk (arg = [], size = 2) {
	const result = [];
	const nth = Math.ceil(arg.length / size);
	let i = 0;

	while (i < nth) {
		result.push(arg.slice(i * size, (i + 1) * size));
		i++;
	}

	return result;
}