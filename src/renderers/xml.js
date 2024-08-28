import {XMLBuilder} from "fast-xml-parser";
import {XML_ARRAY_NODE_NAME, XML_PROLOG} from "../core/constants.js";

export function xml (req, res, arg) {
	const builder = new XMLBuilder({
		processEntities: true,
		format: true,
		ignoreAttributes: false,
		arrayNodeName: Array.isArray(arg) ? XML_ARRAY_NODE_NAME : undefined
	});

	return `${XML_PROLOG}\n${builder.build(arg)}`;
}
