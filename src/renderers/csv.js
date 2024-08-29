import {stringify} from "csv-stringify/sync";
import {COMMA, FALSE, HEADER_CONTENT_DISPOSITION, HEADER_CONTENT_DISPOSITION_VALUE, TRUE} from "../core/constants.js";

export function csv (req, res, arg) {
	res.header(HEADER_CONTENT_DISPOSITION, HEADER_CONTENT_DISPOSITION_VALUE);

	return stringify(Array.isArray(arg) ? arg : [arg], {
		cast: {
			boolean: value => value ? TRUE : FALSE,
			date: value => value.toISOString(),
			number: value => value.toString()
		},
		delimiter: COMMA,
		header: true,
		quoted: false
	});
}
