import {SIGHUP, SIGINT, SIGTERM} from "./constants.js";

export function signals (app) {
	[SIGHUP, SIGINT, SIGTERM].forEach(signal => {
		process.on(signal, async () => {
			await app.server?.close();
			process.exit(0);
		});
	});
}
