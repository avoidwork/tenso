"use strict";

const d = require("dtrace-provider");

module.exports = (id, ...probes) => {
	const dtp = d.createDTraceProvider(id);

	probes.forEach(p => dtp.addProbe(...p));

	return dtp;
};
