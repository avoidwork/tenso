import YAML from "yamljs";

export function yaml (req, res, arg) {
	return YAML.stringify(arg);
}
