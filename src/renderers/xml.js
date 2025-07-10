import {XMLBuilder} from "fast-xml-parser";
import {XML_ARRAY_NODE_NAME, XML_PROLOG} from "../core/constants.js";

/**
 * Renders data as XML format with proper formatting and entity processing
 * Handles arrays with special array node names and includes XML prolog
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to render as XML
 * @returns {string} The XML formatted string with prolog
 */
export function xml (req, res, arg) {
	const builder = new XMLBuilder({
		processEntities: true,
		format: true,
		ignoreAttributes: false,
		arrayNodeName: Array.isArray(arg) ? XML_ARRAY_NODE_NAME : undefined
	});

	return `${XML_PROLOG}\n${builder.build({output: arg})}`;
}
