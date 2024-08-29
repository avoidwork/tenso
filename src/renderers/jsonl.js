import {stringify} from "tiny-jsonl";

export function jsonl (req, res, arg) {
	return stringify(arg);
}
