import {stringify} from "csv-stringify/sync";

export function csv (req, res, arg) {
	return stringify(Array.isArray(arg) ? arg : [arg], {
		cast: {
			boolean: value => value ? "true" : "false",
			date: value => value.toISOString(),
			number: value => value.toString()
		},
		delimiter: ",",
		header: true,
		quoted: false
	});
}
