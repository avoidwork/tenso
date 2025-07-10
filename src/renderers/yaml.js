import YAML from "yamljs";

/**
 * Renders data as YAML format
 * Converts JavaScript objects and arrays to YAML string representation
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {*} arg - The data to render as YAML
 * @returns {string} The YAML formatted string
 */
export function yaml (req, res, arg) {
	return YAML.stringify(arg);
}
