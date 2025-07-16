# Tenso Framework Benchmarks

This directory contains comprehensive performance benchmarks for the Tenso framework. The benchmarks test various aspects of the framework including HTTP performance, parsing, rendering, authentication, rate limiting, hypermedia generation, and memory usage.

## 📋 Prerequisites

Before running the benchmarks, ensure you have:

1. Node.js 17.0.0 or higher
2. The Tenso framework built (`npm run build`)
3. Benchmark dependencies installed

## 🚀 Installation

```bash
cd benchmarks
npm install
```

## 🏃‍♂️ Running Benchmarks

### Run All Benchmarks
```bash
npm run bench
```

### Run Individual Benchmarks
```bash
# Basic HTTP performance
npm run bench:basic

# Parser performance  
npm run bench:parsers

# Renderer performance
npm run bench:renderers

# Serializer performance
npm run bench:serializers

# Authentication performance
npm run bench:auth

# Rate limiting performance
npm run bench:rate

# Hypermedia generation performance
npm run bench:hypermedia

# Memory usage tests
npm run bench:memory

# Load testing with autocannon
npm run bench:load
```

## 📊 Benchmark Categories

### 1. Basic HTTP (`basic-http.js`)

Tests fundamental HTTP request/response performance:

- **Request/Response Cycle**: Tests basic rendering performance
- **JSON Serialization**: Performance of JSON output formatting
- **Different Data Sizes**: Impact of response size on performance

**Key Metrics**: Requests/second, latency per request

### 2. Parsers (`parsers.js`)

Tests request body parsing performance:

- **JSON Parser**: `application/json` content parsing
- **JSONL Parser**: `application/jsonl` line-delimited JSON parsing  
- **Form Parser**: `application/x-www-form-urlencoded` parsing
- **Memory Usage**: Parser memory consumption

**Key Metrics**: Parse operations/second, memory usage

### 3. Renderers (`renderers.js`)

Tests response rendering performance:

- **JSON Rendering**: JSON output formatting
- **XML Rendering**: XML output with proper escaping
- **CSV Rendering**: Tabular data formatting
- **YAML Rendering**: YAML output formatting
- **Plain Text Rendering**: Simple text output
- **Data Size Impact**: Performance vs response size

**Key Metrics**: Render operations/second, memory usage

### 4. Serializers (`serializers.js`)

Tests data serialization performance for response processing:

- **Custom Serializer**: Structured response objects with metadata
- **Plain Serializer**: Direct data or error information return
- **Error Handling**: Error serialization with/without stack traces
- **MIME Type Support**: Serialization for different content types
- **Data Size Impact**: Performance across various data sizes
- **Status Code Handling**: Different HTTP status code scenarios

**Key Metrics**: Serializations/second, memory usage, error handling

### 5. Authentication (`auth.js`)

Tests authentication middleware performance:

- **Basic Auth**: Username/password validation
- **Bearer Token**: Token-based authentication
- **JWT Processing**: JSON Web Token validation
- **Route Protection**: Pattern matching for protected routes
- **Session Auth**: Session-based authentication

**Key Metrics**: Auth checks/second, memory per session

### 6. Rate Limiting (`rate-limiting.js`)

Tests rate limiting performance and accuracy:

- **Basic Rate Limiting**: Request counting and limiting
- **Different Limits**: Impact of limit values on performance
- **Window Reset**: Rate limit window management
- **High Concurrency**: Performance under heavy load
- **Cleanup**: Expired entry removal performance

**Key Metrics**: Rate checks/second, memory per client, accuracy

### 7. Hypermedia (`hypermedia.js`)

Tests HATEOAS link generation performance:

- **Link Generation**: Creating hypermedia links from data
- **Pagination Links**: Navigation link creation
- **Pattern Matching**: ID and URL pattern recognition
- **Link Deduplication**: Duplicate link removal
- **Link Headers**: HTTP Link header generation

**Key Metrics**: Link generation/second, links per object

### 8. Memory Usage (`memory.js`)

Tests memory consumption and leak detection:

- **Server Lifecycle**: Memory usage during start/stop
- **Request Processing**: Memory per request
- **Parser Memory**: Memory usage by parsers
- **Renderer Memory**: Memory usage by renderers
- **Rate Limit Memory**: Memory growth with clients
- **Leak Detection**: Long-running memory pattern analysis

**Key Metrics**: Memory usage, growth patterns, leak detection

### 9. Load Testing (`load-test.js`)

Real-world load testing using autocannon:

- **Basic Load Tests**: Various connection levels
- **POST Request Tests**: Request body handling under load
- **Format Tests**: Different response formats under load
- **Rate Limit Tests**: Rate limiting behavior under load
- **Stress Tests**: High-connection scenarios
- **Mixed Workloads**: Realistic usage patterns

**Key Metrics**: RPS, latency, throughput, error rates

## 📈 Interpreting Results

### Benchmark.js Results
Most benchmarks use the Benchmark.js library and display results like:
```
JSON Renderer - Simple object x 1,234,567 ops/sec ±1.23% (87 runs sampled)
```

- **ops/sec**: Operations per second (higher is better)
- **±percentage**: Margin of error
- **runs sampled**: Number of test runs

### Memory Results
Memory benchmarks show:
```
Heap Used: 15.34 MB
Memory per client: 156 bytes
```

- **Heap Used**: Total memory consumed
- **Growth patterns**: Indicates potential leaks

### Load Test Results
Load tests show:
```
Requests/sec: 1234.56
Latency avg: 12.34ms
Latency p99: 45.67ms
Throughput: 5.67 MB/sec
Error rate: 0.12%
```

## 🎯 Performance Goals

### Excellent Performance
- **Basic HTTP**: >5,000 RPS for simple responses
- **Parsers**: >10,000 operations/sec for medium payloads
- **Renderers**: >5,000 operations/sec for JSON
- **Authentication**: >50,000 checks/sec
- **Rate Limiting**: >100,000 checks/sec
- **Memory**: <100 bytes per client session

### Good Performance  
- **Basic HTTP**: >2,000 RPS
- **Latency**: <10ms average, <50ms p99
- **Memory Growth**: <5MB over 1000 operations
- **Error Rate**: <0.1%

### Warning Signs
- **Consistent Memory Growth**: Potential memory leaks
- **High Latency**: >100ms average response time
- **High Error Rates**: >1% error rate
- **Poor Throughput**: <500 RPS for simple operations

## 🔧 Benchmark Options

### Memory Benchmarks
For better memory benchmarking, run with garbage collection exposed:
```bash
node --expose-gc memory.js
```

### Custom Configurations
Modify benchmark parameters in individual files:
- Iteration counts
- Data sizes  
- Connection levels
- Test durations

## 📝 Adding New Benchmarks

To add new benchmarks:

1. Create a new `.js` file in the benchmarks directory
2. Follow the established pattern:
   ```javascript
   import Benchmark from 'benchmark';
   import { tenso } from '../dist/tenso.js';
   
   function benchmarkNewFeature() {
     const suite = new Benchmark.Suite();
     // Add tests...
   }
   ```
3. Add the script to `package.json`
4. Update `run-all.js` to include the new benchmark

## 🐛 Troubleshooting

### Common Issues

**"Cannot find module" errors**: Ensure you've built the project first with `npm run build` in the root directory.

**High memory usage**: Some benchmarks intentionally stress memory. Monitor system resources.

**Port conflicts**: Benchmarks use random ports, but conflicts can occur with many concurrent tests.

**Timeout errors**: Reduce iteration counts or test duration for slower systems.

### Performance Variance

Benchmark results can vary based on:
- System load
- Node.js version
- Hardware specifications
- Network conditions (for load tests)

Run benchmarks multiple times and look for consistent patterns rather than absolute numbers.

## 📊 Continuous Integration

For CI environments, consider:
- Running subset of benchmarks (exclude stress tests)
- Using shorter test durations
- Setting performance thresholds
- Comparing against baseline results

Example CI script:
```bash
# Quick benchmark suite for CI
npm run bench:basic
npm run bench:parsers
npm run bench:auth
```

## 🔍 Profiling

For detailed performance analysis:

1. **Node.js Profiler**:
   ```bash
   node --prof your-benchmark.js
   node --prof-process isolate-*.log > processed.txt
   ```

2. **Chrome DevTools**:
   ```bash
   node --inspect your-benchmark.js
   ```

3. **Clinic.js** (install separately):
   ```bash
   clinic doctor -- node your-benchmark.js
   ```

This benchmark suite provides comprehensive performance insights to help optimize the Tenso framework and identify potential bottlenecks or regressions. 