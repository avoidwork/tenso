#!/usr/bin/env node

import {performance} from 'node:perf_hooks';

// Test data for benchmarks
const testData = {
	strings: Array.from({length: 1000}, (_, i) => `test-string-${i}-with-content`),
	smallObjects: Array.from({length: 100}, (_, i) => ({id: i, name: `item-${i}`, value: i * 10})),
	largeObjects: Array.from({length: 10}, (_, i) => ({
		id: i,
		name: `large-item-${i}`,
		data: Array.from({length: 100}, (_, j) => ({
			key: `key-${j}`,
			value: `value-${j}`,
			metadata: {
				timestamp: Date.now(),
				index: j,
				category: `category-${j % 10}`
			}
		}))
	})),
	arrays: {
		small: Array.from({length: 100}, (_, i) => i),
		medium: Array.from({length: 1000}, (_, i) => i),
		large: Array.from({length: 10000}, (_, i) => i)
	},
	jsonData: {
		simple: {message: 'Hello World', timestamp: Date.now()},
		complex: {
			users: Array.from({length: 50}, (_, i) => ({
				id: i,
				profile: {name: `User ${i}`, email: `user${i}@test.com`}
			}))
		}
	}
};

/**
 * String manipulation utilities
 */
function stringOperations() {
	const str = testData.strings[Math.floor(Math.random() * testData.strings.length)];
	
	// Various string operations
	const upper = str.toUpperCase();
	const lower = str.toLowerCase();
	const split = str.split('-');
	const joined = split.join('_');
	const trimmed = `  ${str}  `.trim();
	const replaced = str.replace(/test/g, 'demo');
	const substr = str.substring(0, 10);
	const matched = str.match(/\d+/g);
	
	return {upper, lower, split, joined, trimmed, replaced, substr, matched};
}

/**
 * Object manipulation utilities
 */
function objectOperations() {
	const obj = testData.smallObjects[Math.floor(Math.random() * testData.smallObjects.length)];
	
	// Object operations
	const keys = Object.keys(obj);
	const values = Object.values(obj);
	const entries = Object.entries(obj);
	const cloned = {...obj};
	const extended = {...obj, extra: 'value', timestamp: Date.now()};
	const hasProperty = obj.hasOwnProperty('id');
	const frozen = Object.freeze({...obj});
	const stringified = JSON.stringify(obj);
	
	return {keys, values, entries, cloned, extended, hasProperty, frozen, stringified};
}

/**
 * Array processing utilities
 */
function arrayOperations() {
	const arr = testData.arrays.medium.slice();
	
	// Array operations
	const mapped = arr.map(x => x * 2);
	const filtered = arr.filter(x => x % 2 === 0);
	const reduced = arr.reduce((acc, x) => acc + x, 0);
	const sorted = arr.slice().sort((a, b) => b - a);
	const reversed = arr.slice().reverse();
	const found = arr.find(x => x === 500);
	const includes = arr.includes(750);
	const sliced = arr.slice(100, 200);
	const joined = arr.join(',');
	
	return {mapped, filtered, reduced, sorted, reversed, found, includes, sliced, joined};
}

/**
 * JSON processing utilities
 */
function jsonOperations() {
	const data = testData.jsonData.complex;
	
	// JSON operations
	const stringified = JSON.stringify(data);
	const parsed = JSON.parse(stringified);
	const prettified = JSON.stringify(data, null, 2);
	const minified = JSON.stringify(data);
	
	// Data extraction
	const userIds = data.users.map(u => u.id);
	const userNames = data.users.map(u => u.profile.name);
	const filteredUsers = data.users.filter(u => u.id % 2 === 0);
	
	return {stringified, parsed, prettified, minified, userIds, userNames, filteredUsers};
}

/**
 * RegExp operations
 */
function regexpOperations() {
	const strings = testData.strings;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	const numberRegex = /\d+/g;
	const wordRegex = /\w+/g;
	
	let emailMatches = 0;
	let numberMatches = 0;
	let wordMatches = 0;
	
	for (const str of strings) {
		if (emailRegex.test(str)) emailMatches++;
		const nums = str.match(numberRegex);
		if (nums) numberMatches += nums.length;
		const words = str.match(wordRegex);
		if (words) wordMatches += words.length;
	}
	
	return {emailMatches, numberMatches, wordMatches};
}

/**
 * Date and time operations
 */
function dateOperations() {
	const now = new Date();
	const timestamp = Date.now();
	const isoString = now.toISOString();
	const dateString = now.toDateString();
	const timeString = now.toTimeString();
	const utcString = now.toUTCString();
	
	// Date calculations
	const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
	const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
	const daysDiff = Math.floor((tomorrow.getTime() - yesterday.getTime()) / (24 * 60 * 60 * 1000));
	
	return {
		now, timestamp, isoString, dateString, timeString, utcString,
		yesterday, tomorrow, daysDiff
	};
}

/**
 * URL and query string operations
 */
function urlOperations() {
	const baseUrl = 'https://example.com/api/users';
	const params = new URLSearchParams({
		page: '1',
		limit: '10',
		sort: 'name',
		filter: 'active'
	});
	
	const fullUrl = `${baseUrl}?${params.toString()}`;
	const parsedUrl = new URL(fullUrl);
	const hostname = parsedUrl.hostname;
	const pathname = parsedUrl.pathname;
	const searchParams = parsedUrl.searchParams;
	const pageParam = searchParams.get('page');
	const allParams = Object.fromEntries(searchParams.entries());
	
	return {fullUrl, parsedUrl, hostname, pathname, pageParam, allParams};
}

/**
 * Math operations
 */
function mathOperations() {
	const numbers = testData.arrays.small;
	
	const sum = numbers.reduce((a, b) => a + b, 0);
	const avg = sum / numbers.length;
	const min = Math.min(...numbers);
	const max = Math.max(...numbers);
	const sqrt = Math.sqrt(avg);
	const abs = Math.abs(-avg);
	const floor = Math.floor(avg);
	const ceil = Math.ceil(avg);
	const round = Math.round(avg);
	const random = Math.random();
	
	return {sum, avg, min, max, sqrt, abs, floor, ceil, round, random};
}

/**
 * Crypto operations (basic)
 */
function cryptoOperations() {
	const data = 'test-data-for-crypto-operations';
	const buffer = Buffer.from(data, 'utf8');
	const base64 = buffer.toString('base64');
	const hex = buffer.toString('hex');
	const decoded = Buffer.from(base64, 'base64').toString('utf8');
	
	// Simple hash simulation (not cryptographically secure)
	let hash = 0;
	for (let i = 0; i < data.length; i++) {
		const char = data.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	
	return {buffer, base64, hex, decoded, hash};
}

/**
 * Benchmark functions
 */
const benchmarks = {
	async 'string-operations'() {
		const startTime = performance.now();
		for (let i = 0; i < 100; i++) {
			stringOperations();
		}
		const endTime = performance.now();
		return endTime - startTime;
	},

	async 'object-operations'() {
		const startTime = performance.now();
		for (let i = 0; i < 100; i++) {
			objectOperations();
		}
		const endTime = performance.now();
		return endTime - startTime;
	},

	async 'array-operations'() {
		const startTime = performance.now();
		for (let i = 0; i < 10; i++) {
			arrayOperations();
		}
		const endTime = performance.now();
		return endTime - startTime;
	},

	async 'json-operations'() {
		const startTime = performance.now();
		for (let i = 0; i < 100; i++) {
			jsonOperations();
		}
		const endTime = performance.now();
		return endTime - startTime;
	},

	async 'regexp-operations'() {
		const startTime = performance.now();
		regexpOperations();
		const endTime = performance.now();
		return endTime - startTime;
	},

	async 'date-operations'() {
		const startTime = performance.now();
		for (let i = 0; i < 1000; i++) {
			dateOperations();
		}
		const endTime = performance.now();
		return endTime - startTime;
	},

	async 'url-operations'() {
		const startTime = performance.now();
		for (let i = 0; i < 1000; i++) {
			urlOperations();
		}
		const endTime = performance.now();
		return endTime - startTime;
	},

	async 'math-operations'() {
		const startTime = performance.now();
		for (let i = 0; i < 1000; i++) {
			mathOperations();
		}
		const endTime = performance.now();
		return endTime - startTime;
	},

	async 'crypto-operations'() {
		const startTime = performance.now();
		for (let i = 0; i < 1000; i++) {
			cryptoOperations();
		}
		const endTime = performance.now();
		return endTime - startTime;
	},

	async 'memory-allocation'() {
		const startTime = performance.now();
		const arrays = [];
		for (let i = 0; i < 1000; i++) {
			arrays.push(new Array(100).fill(i));
		}
		// Force garbage collection opportunity
		arrays.length = 0;
		const endTime = performance.now();
		return endTime - startTime;
	},

	async cleanup() {
		// Cleanup function - nothing to clean up for utility benchmarks
		return Promise.resolve();
	}
};

export default benchmarks; 