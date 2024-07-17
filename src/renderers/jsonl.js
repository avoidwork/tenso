import {jsonl as renderer} from "tiny-jsonl";

export function jsonl (req, res, arg) {
	return renderer(arg);
}
