import {stringify} from "csv-stringify/sync";
import {COMMA, FALSE, HEADER_CONTENT_DISPOSITION, HEADER_CONTENT_DISPOSITION_VALUE, TRUE} from "../core/constants.js";

export function csv (req, res, arg) {
	const filename = req.parsed.pathname.split("/").pop().split(".")[0];
	const input = res.statusCode < 400 ? Array.isArray(arg) ? arg : [arg] : [{Error: arg}];

	res.header(HEADER_CONTENT_DISPOSITION, HEADER_CONTENT_DISPOSITION_VALUE.replace("download", filename));

	return stringify(input, {
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
