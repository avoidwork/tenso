import {INT_401} from "../core/constants.js";

export function keymaster (req, res) {
	if (req.protect === false || req.protectAsync === false || req.session !== void 0 && req.isAuthenticated()) {
		req.exit();
	} else {
		res.error(INT_401);
	}
}
