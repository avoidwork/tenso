import {stringify} from "csv-stringify/sync";
import {COMMA, FALSE, HEADER_CONTENT_DISPOSITION, HEADER_CONTENT_DISPOSITION_VALUE, TRUE} from "../core/constants.js";

/**
 * Renders data as CSV format with headers and download attachment
 * Converts arrays and objects to CSV format with proper casting for different data types
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to render as CSV
 * @returns {string} The CSV formatted string
 */
export function csv (req, res, arg) {
	const filename = req.url.split("/").pop().split(".")[0];
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
