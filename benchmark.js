#!/usr/bin/env node

/**
 * Main benchmark runner that executes all performance tests
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const benchmarksDir = join(__dirname, "benchmarks");

const benchmarks = [
	"auth.js",
	"basic-http.js",
	"hypermedia.js",
	"load-test.js",
	"memory.js",
	"parsers.js",
	"rate-limiting.js",
	"renderers.js",
	"serializers.js"
];

/**
 * Runs a single benchmark file
 * @param {string} file - The benchmark file to run
 * @returns {Promise<void>}
 */
function runBenchmark (file) {
	return new Promise((resolve, reject) => {
		console.log(`\n${"=".repeat(60)}`);
		console.log(`Running benchmark: ${file}`);
		console.log(`${"=".repeat(60)}`);

		const child = spawn("node", [join(benchmarksDir, file)], {
			stdio: "inherit",
			cwd: benchmarksDir
		});

		child.on("close", code => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Benchmark ${file} failed with exit code ${code}`));
			}
		});

		child.on("error", reject);
	});
}

/**
 * Main execution function
 */
async function main () {
	console.log("🚀 Starting Tenso Framework Benchmarks");
	console.log(`Node.js version: ${process.version}`);
	console.log(`Platform: ${process.platform}`);
	console.log(`Architecture: ${process.arch}`);

	const startTime = Date.now();

	try {
		for (const benchmark of benchmarks) {
			await runBenchmark(benchmark);
		}

		const duration = ((Date.now() - startTime) / 1000).toFixed(2);
		console.log(`\n${"=".repeat(60)}`);
		console.log(`✅ All benchmarks completed in ${duration}s`);
		console.log(`${"=".repeat(60)}`);

	} catch (error) {
		console.error(`\n❌ Benchmark suite failed: ${error.message}`);
		process.exit(1);
	}
}

main().catch(console.error);
