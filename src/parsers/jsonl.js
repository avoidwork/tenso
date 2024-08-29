import {parse} from "tiny-jsonl";
import {EMPTY} from "../core/constants.js";

export function jsonl (arg = EMPTY) {
	return parse(arg);
}
