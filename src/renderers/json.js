import { indent } from '../utils.js'

export function json (req, res, arg) {
	return JSON.stringify(arg, null, indent(req.headers.accept, req.server.config.json))
}
