"use strict";

const {join} = require("path"),
	{platform} = require("os"),
	{readdir} = require("fs").promises,
	{spawn} = require("child_process");

function shell (arg = "") {
	return new Promise((resolve, reject) => {
		const args = arg.split(/\s/g),
			cmd = args.shift(),
			result = [],
			eresult = [];

		const ps = spawn(cmd, args, {detached: false, stdio: ["pipe", "pipe", "pipe"], shell: true});

		ps.stdout.on("data", data => result.push(data.toString()));
		ps.stderr.on("data", data => eresult.push(data.toString()));
		ps.on("close", code => {
			if (code === 0) {
				resolve(result.join("\n").split("\n").filter(i => i.includes("[90m")).map(i => i.replace("[1] ", "")).join("\n"));
			} else {
				reject(new Error(eresult.join("\n")));
			}
		});
	});
}

(async function () {
	const apath = join("node_modules", "autocannon", "autocannon.js"),
		cpath = join("node_modules", "concurrently", "bin", "concurrently.js"),
		fpath = join(__dirname, "benchmarks"),
		files = await readdir(fpath),
		sep = platform() === "win32" ? "\\" : "/",
		result = [];

	for (const file of files) {
		try {
			const stdout = await shell(`node ${cpath} -k --success first "node benchmarks${sep}${file}" "node ${apath} -c 100 -d 40 -p 10 localhost:8000"`);

			result.push({file: file.replace(".js", ""), stdout});
		} catch (err) {
			console.error(err.stack);
			process.exit(1);
		}
	}

	console.log(result.map(i => `${i.file}\n${i.stdout}\n`).join("\n"));
	process.exit(0);
}());
