import { stringify } from 'yaml';
export function yaml (req, res, arg) {
	return stringify(arg);
}
