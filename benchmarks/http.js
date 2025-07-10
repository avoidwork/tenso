#!/usr/bin/env node

import {request} from 'node:http';
import {performance} from 'node:perf_hooks';
import {tenso} from '../dist/tenso.js';

// Configuration constants
const BENCHMARK_PORT = 8080;
const WARMUP_REQUESTS = 100;
const BENCHMARK_REQUESTS = 1000;
const CONCURRENT_CONNECTIONS = 10;
const REQUEST_TIMEOUT = 5000;

let server;
let tensoApp;

/**
 * Creates sample data for benchmarks
 */
function createSampleData() {
	// Complex JSON data with 100 user objects
	const complexData = {
		users: Array.from({length: 100}, (_, i) => ({
			id: i + 1,
			name: `User ${i + 1}`,
			email: `user${i + 1}@example.com`,
			profile: {
				age: 20 + (i % 50),
				location: `City ${i % 10}`,
				interests: [`hobby${i % 5}`, `sport${i % 3}`, `music${i % 7}`],
				settings: {
					notifications: i % 2 === 0,
					privacy: i % 3 === 0 ? 'public' : 'private',
					theme: i % 4 === 0 ? 'dark' : 'light'
				}
			},
			createdAt: new Date(2020 + (i % 4), i % 12, (i % 28) + 1).toISOString(),
			lastActive: new Date().toISOString()
		})),
		meta: {
			total: 100,
			page: 1,
			pageSize: 100,
			hasMore: false
		}
	};

	return {
		simple: {message: 'Hello, World!', timestamp: new Date().toISOString()},
		complex: complexData
	};
}

/**
 * Setup test server with routes
 */
function setupServer() {
	tensoApp = tenso({
		port: BENCHMARK_PORT,
		silent: true,
		hypermedia: {enabled: true, header: true},
		logging: {enabled: false},
		security: {csrf: false}
	});

	const sampleData = createSampleData();

	// Static text endpoint
	tensoApp.get('/static', (req, res) => {
		res.send('Hello, World!');
	});

	// Simple JSON endpoint
	tensoApp.get('/json/simple', (req, res) => {
		res.json(sampleData.simple);
	});

	// Complex JSON endpoint
	tensoApp.get('/json/complex', (req, res) => {
		res.json(sampleData.complex);
	});

	// Route with parameters
	tensoApp.get('/users/:id', (req, res) => {
		const userId = parseInt(req.params.id, 10);
		const user = sampleData.complex.users.find(u => u.id === userId);
		
		if (user) {
			res.json(user);
		} else {
			res.error(404, 'User not found');
		}
	});

	// Query parameter handling
	tensoApp.get('/search', (req, res) => {
		const query = req.parsed?.searchParams || req.query || {};
		const q = query.get ? query.get('q') : query.q;
		const limit = query.get ? parseInt(query.get('limit'), 10) || 10 : parseInt(query.limit, 10) || 10;
		const offset = query.get ? parseInt(query.get('offset'), 10) || 0 : parseInt(query.offset, 10) || 0;
		
		const filteredUsers = sampleData.complex.users
			.filter(user => !q || user.name.toLowerCase().includes(q.toLowerCase()))
			.slice(offset, offset + limit);
		
		res.json({
			query: q,
			results: filteredUsers,
			total: filteredUsers.length
		});
	});

	// Content negotiation endpoint (supports JSON, XML, CSV)
	tensoApp.get('/data', (req, res) => {
		res.json(sampleData.simple);
	});

	// Middleware chain test with multiple middleware functions
	tensoApp.use('/middleware', (req, res, next) => {
		req.timing = {start: performance.now()};
		next();
	});

	tensoApp.use('/middleware', (req, res, next) => {
		req.auth = {user: 'test', role: 'user'};
		next();
	});

	tensoApp.use('/middleware', (req, res, next) => {
		req.processed = true;
		next();
	});

	tensoApp.get('/middleware', (req, res) => {
		const duration = performance.now() - req.timing.start;
		res.json({
			message: 'Middleware chain processed',
			auth: req.auth,
			processed: req.processed,
			duration: `${duration.toFixed(2)}ms`
		});
	});

	// Error handling endpoint
	tensoApp.get('/error', (req, res) => {
		res.error(400, 'This is a test error');
	});

	// Hypermedia/HATEOAS endpoint
	tensoApp.get('/hypermedia', (req, res) => {
		const data = {
			id: 1,
			name: 'Test Resource',
			user_id: 123,
			related_urls: ['/users/123', '/posts/456'],
			_links: {
				self: {href: '/hypermedia'},
				user: {href: '/users/123'},
				edit: {href: '/hypermedia/edit'}
			}
		};
		res.json(data);
	});

	return tensoApp.start();
}

/**
 * Makes an HTTP request with timing
 */
function makeRequest(path, options = {}) {
	return new Promise((resolve, reject) => {
		const requestOptions = {
			hostname: '127.0.0.1',
			port: BENCHMARK_PORT,
			path: path,
			method: 'GET',
			timeout: REQUEST_TIMEOUT,
			...options
		};

		const startTime = performance.now();
		const req = request(requestOptions, (res) => {
			let data = '';
			
			res.on('data', chunk => {
				data += chunk;
			});
			
			res.on('end', () => {
				const endTime = performance.now();
				resolve({
					statusCode: res.statusCode,
					headers: res.headers,
					data: data,
					duration: endTime - startTime,
					size: Buffer.byteLength(data, 'utf8')
				});
			});
		});

		req.on('error', reject);
		req.on('timeout', () => {
			req.destroy();
			reject(new Error('Request timeout'));
		});

		req.end();
	});
}

/**
 * Benchmark functions
 */
const benchmarks = {
	async 'static-text'() {
		const result = await makeRequest('/static');
		if (result.statusCode !== 200) {
			throw new Error(`Expected 200, got ${result.statusCode}`);
		}
		return result.duration;
	},

	async 'json-simple'() {
		const result = await makeRequest('/json/simple');
		if (result.statusCode !== 200) {
			throw new Error(`Expected 200, got ${result.statusCode}`);
		}
		const data = JSON.parse(result.data);
		// Handle both direct and wrapped responses
		const responseData = data.data || data;
		if (!responseData.message && !responseData.timestamp) {
			throw new Error('Invalid JSON response');
		}
		return result.duration;
	},

	async 'json-complex'() {
		const result = await makeRequest('/json/complex');
		if (result.statusCode !== 200) {
			throw new Error(`Expected 200, got ${result.statusCode}`);
		}
		const data = JSON.parse(result.data);
		// Handle both direct and wrapped responses
		const responseData = data.data || data;
		if (!responseData.users || responseData.users.length !== 100) {
			throw new Error('Invalid complex JSON response');
		}
		return result.duration;
	},

	async 'route-params'() {
		const userId = Math.floor(Math.random() * 100) + 1;
		const result = await makeRequest(`/users/${userId}`);
		if (result.statusCode !== 200) {
			throw new Error(`Expected 200, got ${result.statusCode}`);
		}
		const data = JSON.parse(result.data);
		// Handle both direct and wrapped responses
		const responseData = data.data || data;
		if (responseData.id !== userId) {
			throw new Error('Parameter extraction failed');
		}
		return result.duration;
	},

	async 'query-params'() {
		const query = `q=User&limit=5&offset=${Math.floor(Math.random() * 10)}`;
		const result = await makeRequest(`/search?${query}`);
		if (result.statusCode !== 200) {
			throw new Error(`Expected 200, got ${result.statusCode}`);
		}
		const data = JSON.parse(result.data);
		// Handle both direct and wrapped responses
		const responseData = data.data || data;
		if (!responseData.results || !Array.isArray(responseData.results)) {
			throw new Error('Query parameter handling failed');
		}
		return result.duration;
	},

	async 'content-negotiation'() {
		const headers = {
			'Accept': Math.random() > 0.5 ? 'application/json' : 'application/xml'
		};
		const result = await makeRequest('/data', {headers});
		if (result.statusCode !== 200) {
			throw new Error(`Expected 200, got ${result.statusCode}`);
		}
		return result.duration;
	},

	async 'middleware-chain'() {
		const result = await makeRequest('/middleware');
		if (result.statusCode !== 200) {
			throw new Error(`Expected 200, got ${result.statusCode}`);
		}
		const data = JSON.parse(result.data);
		// Handle both direct and wrapped responses
		const responseData = data.data || data;
		if (!responseData.processed || !responseData.auth) {
			throw new Error('Middleware chain failed');
		}
		return result.duration;
	},

	async 'error-handling'() {
		const result = await makeRequest('/error');
		if (result.statusCode !== 400) {
			throw new Error(`Expected 400, got ${result.statusCode}`);
		}
		return result.duration;
	},

	async 'hypermedia'() {
		const result = await makeRequest('/hypermedia');
		if (result.statusCode !== 200) {
			throw new Error(`Expected 200, got ${result.statusCode}`);
		}
		const data = JSON.parse(result.data);
		// Handle both direct and wrapped responses
		const responseData = data.data || data;
		if (!responseData._links || !responseData.user_id) {
			throw new Error('Hypermedia generation failed');
		}
		return result.duration;
	},

	async cleanup() {
		if (tensoApp) {
			await tensoApp.stop();
		}
	}
};

/**
 * Initialize benchmark
 */
async function init() {
	console.log('🚀 Tenso HTTP Performance Benchmark');
	console.log('====================================');
	console.log('Setting up test server...');
	
	await setupServer();
	
	// Warmup the server
	console.log('Warming up server...');
	for (let i = 0; i < 10; i++) {
		try {
			await makeRequest('/static');
		} catch (error) {
			// Ignore warmup errors
		}
	}
	
	console.log('Server ready for benchmarking\n');
}

// Auto-initialize if running standalone
if (process.argv[1] === new URL(import.meta.url).pathname) {
	init().then(() => {
		console.log('Benchmark server initialized. Use benchmark.js to run tests.');
	}).catch(console.error);
}

// Initialize when imported - wrap benchmarks to ensure async initialization
const initPromise = init();
const asyncBenchmarks = {};

// Wrap each benchmark to ensure initialization is complete
for (const [name, fn] of Object.entries(benchmarks)) {
	asyncBenchmarks[name] = async (...args) => {
		await initPromise;
		return fn(...args);
	};
}

export default asyncBenchmarks; 