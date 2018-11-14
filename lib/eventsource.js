"use strict";

const {EventEmitter} = require("events");

function handler (res, arg, id) {
	if (arg.id !== void 0) {
		res.write(`id: ${arg.id}\n`);
	} else {
		res.write(`id: ${++id}\n`);
	}

	if (arg.event !== void 0) {
		res.write(`event: ${arg.event}\n`);
	}

	res.write(`data: ${JSON.stringify(arg.data)}\n\n`);
}

class EventSource extends EventEmitter {
	constructor (...args) {
		super();
		this.init = [...args];
	}

	send (data, event, id) {
		this.emit("data", {data, event, id});
	}

	stream (req, res) {
		let id = -1;
		const fn = arg => handler(res, arg, id);

		req.socket.setTimeout(0);
		req.socket.setNoDelay(true);
		req.socket.setKeepAlive(true);

		res.statusCode = 200;
		res.header("content-type", "text/event-stream");
		res.header("cache-control", "no-cache");
		res.header("connection", "keep-alive");

		this.on("data", fn);
		req.on("close", () => this.removeListener("data", fn));

		if (this.init.length > 0) {
			this.send(this.init);
		}
	}
}

module.exports = (...args) => new EventSource(...args);
