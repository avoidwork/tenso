"use strict";

const {EventEmitter} = require("events");

class EventSource extends EventEmitter {
	constructor (...args) {
		super();
		this.initial = [...args];
	}

	send (data, event, id) {
		this.emit("data", {data, event, id});

		return this;
	}

	stream (req, res) {
		let id = -1;
		const fn = arg => this.transmit(res, arg, ++id);

		req.socket.setTimeout(0);
		req.socket.setNoDelay(true);
		req.socket.setKeepAlive(true);

		res.statusCode = 200;
		res.header("content-type", "text/event-stream");
		res.header("cache-control", "no-cache");
		res.header("connection", "keep-alive");

		this.on("data", fn);
		req.on("close", () => this.removeListener("data", fn));
		this.initial.forEach(i => this.send(i));

		return this;
	}

	transmit (res, arg, id) {
		res.write(`id: ${arg.id || id}\n`);

		if (arg.event !== void 0) {
			res.write(`event: ${arg.event}\n`);
		}

		res.write(`data: ${JSON.stringify(arg.data)}\n\n`);
	}
}

module.exports = (...args) => new EventSource(...args);
