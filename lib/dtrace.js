"use strict";

const d = require("dtrace-provider");

module.exports = (id = "", ...probes) => {
	const dtp = d.createDTraceProvider(id);

	for (const p of probes) {
		dtp.addProbe(...p);
	}

	return dtp;
};
