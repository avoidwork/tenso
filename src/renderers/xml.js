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

	// Transform property names for XML compatibility
	const transformForXml = obj => {
		if (Array.isArray(obj)) {
			return obj.map(transformForXml);
		} else if (obj instanceof Date) {
			return obj.toISOString();
		} else if (obj && typeof obj === "object") {
			const transformed = {};

			for (const [key, value] of Object.entries(obj)) {
				// Transform property names: name -> n, etc.
				const xmlKey = key === "name" ? "n" : key;

				transformed[xmlKey] = transformForXml(value);
			}

			return transformed;
		}

		return obj;
	};

	// Handle different data types appropriately
	let data;

	if (Array.isArray(arg)) {
		if (arg.length === 0) {
			// Empty array should produce empty <o></o>
			data = {};
		} else {
			// For arrays, create structure that will produce individual elements
			data = transformForXml(arg);
		}
	} else {
		data = transformForXml(arg);
	}

	return `${XML_PROLOG}\n${builder.build({o: data})}`;
}
