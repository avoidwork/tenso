#!/usr/bin/env node

import {performance} from "node:perf_hooks";
import {readdir} from "node:fs/promises";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const BENCHMARKS_DIR = join(__dirname, "benchmarks");
const DEFAULT_ITERATIONS = 1000;
const DEFAULT_WARMUP = 100;

/**
 * Benchmark result statistics
 * @typedef {Object} BenchmarkStats
 * @property {number} mean - Mean execution time in milliseconds
 * @property {number} median - Median execution time in milliseconds
 * @property {number} min - Minimum execution time in milliseconds
 * @property {number} max - Maximum execution time in milliseconds
 * @property {number} stddev - Standard deviation in milliseconds
 * @property {number} opsPerSecond - Operations per second
 * @property {number} total - Total execution time in milliseconds
 */

/**
 * Calculates statistical measures for benchmark results
 * @param {number[]} times - Array of execution times in milliseconds
 * @returns {BenchmarkStats} Statistical measures
 */
function calculateStats (times) {
	const sorted = times.slice().sort((a, b) => a - b);
	const mean = times.reduce((sum, time) => sum + time, 0) / times.length;
	const median = sorted[Math.floor(sorted.length / 2)];
	const min = sorted[0];
	const max = sorted[sorted.length - 1];
	const variance = times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / times.length;
	const stddev = Math.sqrt(variance);
	const opsPerSecond = 1000 / mean;
	const total = times.reduce((sum, time) => sum + time, 0);

	return {mean, median, min, max, stddev, opsPerSecond, total};
}

/**
 * Formats benchmark statistics for display
 * @param {string} name - Benchmark name
 * @param {BenchmarkStats} stats - Statistical measures
 * @returns {string} Formatted output string
 */
function formatResults (name, stats) {
	return `
${name}:
  Mean: ${stats.mean.toFixed(4)}ms
  Median: ${stats.median.toFixed(4)}ms
  Min: ${stats.min.toFixed(4)}ms
  Max: ${stats.max.toFixed(4)}ms
  Std Dev: ${stats.stddev.toFixed(4)}ms
  Ops/sec: ${stats.opsPerSecond.toFixed(2)}
  Total: ${stats.total.toFixed(4)}ms
`;
}

/**
 * Runs a single benchmark function with warmup and iterations
 * @param {string} name - Benchmark name
 * @param {Function} benchmarkFn - Function to benchmark
 * @param {Object} options - Benchmark options
 * @param {number} [options.iterations=1000] - Number of iterations
 * @param {number} [options.warmup=100] - Number of warmup iterations
 * @returns {Promise<BenchmarkStats>} Benchmark results
 */
async function runBenchmark (name, benchmarkFn, options = {}) {
	const iterations = options.iterations ?? DEFAULT_ITERATIONS;
	const warmup = options.warmup ?? DEFAULT_WARMUP;
	const times = [];

	// Warmup phase
	console.log(`Running warmup for ${name}...`);
	for (let i = 0; i < warmup; i++) {
		await benchmarkFn();
	}

	// Benchmark phase
	console.log(`Running ${iterations} iterations for ${name}...`);
	for (let i = 0; i < iterations; i++) {
		const start = performance.now();
		await benchmarkFn();
		const end = performance.now();
		times.push(end - start);
	}

	const stats = calculateStats(times);
	console.log(formatResults(name, stats));

	return stats;
}

/**
 * Runs a benchmark suite
 * @param {string} suiteName - Name of the benchmark suite
 * @param {Object} benchmarks - Object containing benchmark functions
 * @param {Object} options - Benchmark options
 * @returns {Promise<Object>} Results for all benchmarks in the suite
 */
async function runBenchmarkSuite (suiteName, benchmarks, options = {}) {
	console.log(`\n=== ${suiteName.toUpperCase()} BENCHMARKS ===`);
	const results = {};

	for (const [name, benchmarkFn] of Object.entries(benchmarks)) {
		// Skip cleanup function from benchmarks
		if (name === "cleanup") continue; // eslint-disable-line

		try {
			results[name] = await runBenchmark(name, benchmarkFn, options);
		} catch (error) {
			console.error(`Error in benchmark ${name}:`, error);
			results[name] = {error: error.message};
		}
	}

	// Call cleanup function if it exists
	if (typeof benchmarks.cleanup === "function") {
		try {
			await benchmarks.cleanup();
		} catch (error) {
			console.error(`Error during cleanup for ${suiteName}:`, error);
		}
	}

	return results;
}

/**
 * Loads and runs all benchmark files from the benchmarks directory
 * @param {string[]} [specificBenchmarks] - Specific benchmark files to run
 * @param {Object} [options] - Benchmark options
 * @returns {Promise<Object>} Results for all benchmark suites
 */
async function runAllBenchmarks (specificBenchmarks = [], options = {}) {
	const results = {};

	try {
		const files = await readdir(BENCHMARKS_DIR);
		const benchmarkFiles = files.filter(file =>
			file.endsWith(".js") &&
			(specificBenchmarks.length === 0 || specificBenchmarks.includes(file.replace(".js", "")))
		);

		for (const file of benchmarkFiles) {
			try {
				const benchmarkPath = join(BENCHMARKS_DIR, file);
				const benchmarkModule = await import(benchmarkPath);
				const suiteName = file.replace(".js", "");

				if (benchmarkModule.default && typeof benchmarkModule.default === "object") {
					results[suiteName] = await runBenchmarkSuite(suiteName, benchmarkModule.default, options);
				}
			} catch (error) {
				console.error(`Error loading benchmark ${file}:`, error);
			}
		}
	} catch (error) {
		console.error("Error reading benchmarks directory:", error);
	}

	return results;
}

/**
 * Main function to parse CLI arguments and run benchmarks
 */
async function main () {
	const args = process.argv.slice(2);
	const options = {
		iterations: DEFAULT_ITERATIONS,
		warmup: DEFAULT_WARMUP
	};
	const specificBenchmarks = [];

	// Parse command line arguments
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === "--iterations" || arg === "-i") {
			options.iterations = parseInt(args[++i], 10) || DEFAULT_ITERATIONS;
		} else if (arg === "--warmup" || arg === "-w") {
			options.warmup = parseInt(args[++i], 10) || DEFAULT_WARMUP;
		} else if (arg === "--help" || arg === "-h") {
			console.log(`
Usage: node benchmark.js [options] [benchmark-names...]

Options:
  --iterations, -i <number>  Number of iterations (default: ${DEFAULT_ITERATIONS})
  --warmup, -w <number>      Number of warmup iterations (default: ${DEFAULT_WARMUP})
  --help, -h                 Show this help message

Examples:
  node benchmark.js                    # Run all benchmarks
  node benchmark.js routing utility    # Run specific benchmarks
  node benchmark.js -i 2000 -w 200     # Run with custom iterations and warmup
`);
			process.exit(0);
		} else if (!arg.startsWith("-")) {
			specificBenchmarks.push(arg);
		}
	}

	console.log(`Starting benchmarks with ${options.iterations} iterations and ${options.warmup} warmup iterations...`);

	const startTime = performance.now();
	const results = await runAllBenchmarks(specificBenchmarks, options);
	const endTime = performance.now();

	console.log("\n=== BENCHMARK SUMMARY ===");
	console.log(`Total execution time: ${(endTime - startTime).toFixed(2)}ms`);
	console.log(`Benchmarks completed: ${Object.keys(results).length}`);

	// Summary of fastest operations
	const allBenchmarks = [];
	for (const [suite, suiteResults] of Object.entries(results)) {
		for (const [benchmark, stats] of Object.entries(suiteResults)) {
			if (stats.opsPerSecond && !stats.error) {
				allBenchmarks.push({
					name: `${suite}.${benchmark}`,
					opsPerSecond: stats.opsPerSecond,
					mean: stats.mean
				});
			}
		}
	}

	if (allBenchmarks.length > 0) {
		allBenchmarks.sort((a, b) => b.opsPerSecond - a.opsPerSecond);
		console.log("\nFastest operations:");
		allBenchmarks.slice(0, 5).forEach((benchmark, index) => {
			console.log(`${index + 1}. ${benchmark.name}: ${benchmark.opsPerSecond.toFixed(2)} ops/sec`);
		});
	}

	// Final cleanup - ensure all resources are freed
	setTimeout(() => {
		process.exit(0);
	}, 100); // Give a small delay for any async cleanup to complete
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main().catch(console.error);
}

export {runBenchmark, runBenchmarkSuite, runAllBenchmarks, calculateStats, formatResults};
