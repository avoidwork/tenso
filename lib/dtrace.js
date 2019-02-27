"use strict";

const path = require("path"),
	d = require("dtrace-provider"),
	{each} = require(path.join(__dirname, "utility.js"));

module.exports = (id, ...probes) => {
	const dtp = d.createDTraceProvider(id);

	each(probes, p => dtp.addProbe(...p));

	return dtp;
};
