# Tenso Benchmark Suite

A comprehensive benchmarking toolkit for the Tenso HTTP REST API framework, designed to measure performance across various scenarios and identify potential bottlenecks.

## Overview

The benchmark suite consists of multiple specialized benchmark tools:

1. **Main Benchmark Suite** (`benchmark.js`) - Comprehensive benchmark runner and framework
2. **HTTP Performance Benchmark** (`benchmarks/http-benchmark.js`) - Core HTTP scenarios with 9 performance tests
3. **Memory Benchmark** (`benchmarks/memory-benchmark.js`) - Memory usage patterns and garbage collection behavior
4. **Routing Benchmark** (`benchmarks/routing-benchmark.js`) - Route matching, parameter extraction, and URL parsing performance
5. **Middleware Benchmark** (`benchmarks/middleware-benchmark.js`) - Middleware chain performance and impact analysis
6. **Content Negotiation Benchmark** (`benchmarks/content-negotiation-benchmark.js`) - Content type negotiation and serialization performance
7. **Streaming Benchmark** (`benchmarks/streaming-benchmark.js`) - Large payload handling and memory efficiency
8. **Concurrency Benchmark** (`benchmarks/concurrency-benchmark.js`) - Concurrent connection handling and load patterns
9. **Utility Benchmark** (`benchmarks/utility-benchmark.js`) - Utility function and operation performance

## Getting Started

### Prerequisites

- Node.js 17.0.0 or higher
- Built Tenso distribution (`npm run build`)

### Running Benchmarks

#### Full Benchmark Suite
```bash
# Run all benchmarks
npm run benchmark

# Or run directly
node benchmark.js
```

#### HTTP Performance Benchmarks
```bash
# Run all HTTP performance tests
node benchmarks/http-benchmark.js

# Run specific HTTP test
node benchmark.js http static-text
node benchmark.js http json-complex
node benchmark.js http hypermedia
```

#### Utility Benchmarks
```bash
# Run all utility benchmarks
node benchmarks/utility-benchmark.js

# Run specific utility test
node benchmark.js utility string-operations
node benchmark.js utility array-operations
node benchmark.js utility crypto-operations
```

#### Memory Benchmarks
```bash
# Run all memory scenarios
node benchmarks/memory-benchmark.js

# Run specific memory scenario
node benchmarks/memory-benchmark.js large-objects
```

#### Routing Benchmarks
```bash
# Run all routing tests
node benchmarks/routing-benchmark.js

# Run specific routing test
node benchmarks/routing-benchmark.js static-routes
node benchmarks/routing-benchmark.js parameterized-routes
node benchmarks/routing-benchmark.js nested-parameters
```

#### Middleware Benchmarks
```bash
# Run all middleware tests
node benchmarks/middleware-benchmark.js

# Run specific middleware test
node benchmarks/middleware-benchmark.js no-middleware
node benchmarks/middleware-benchmark.js heavy-middleware
```

#### Content Negotiation Benchmarks
```bash
# Run all content type tests
node benchmarks/content-negotiation-benchmark.js

# Run specific content test
node benchmarks/content-negotiation-benchmark.js json-complex
node benchmarks/content-negotiation-benchmark.js xml-simple
node benchmarks/content-negotiation-benchmark.js csv-tabular
```

#### Streaming Benchmarks
```bash
# Run all streaming tests
node benchmarks/streaming-benchmark.js

# Run specific streaming test
node benchmarks/streaming-benchmark.js large-array
node benchmarks/streaming-benchmark.js binary-data
```

#### Concurrency Benchmarks
```bash
# Run all concurrency tests
node benchmarks/concurrency-benchmark.js

# Run specific concurrency test
node benchmarks/concurrency-benchmark.js high-concurrency
node benchmarks/concurrency-benchmark.js burst-load
```

#### Individual Benchmarks
```bash
# Run specific benchmark
node benchmark.js static-text
node benchmark.js json-complex
```

## Main Benchmark Suite

### Test Scenarios

| Scenario | Description | Purpose |
|----------|-------------|---------|
| `static-text` | Simple static text response | Baseline performance measurement |
| `json-simple` | Basic JSON object serialization | JSON handling overhead |
| `json-complex` | Complex nested JSON with arrays | Large object serialization performance |
| `route-params` | URL parameter extraction | Routing performance with parameters |
| `query-params` | Query string parsing | Query parameter handling overhead |
| `content-negotiation` | Multiple content types | Content type selection performance |
| `middleware-chain` | Multiple middleware functions | Middleware stack overhead |
| `error-handling` | Error response generation | Error handling performance |
| `hypermedia` | HATEOAS link generation | Hypermedia feature overhead |

### Configuration

The benchmark configuration can be modified by changing constants at the top of `benchmark.js`:

```javascript
const BENCHMARK_PORT = 8080;          // Server port for testing
const WARMUP_REQUESTS = 100;          // Warmup requests before timing
const BENCHMARK_REQUESTS = 1000;      // Requests per benchmark
const CONCURRENT_CONNECTIONS = 10;    // Concurrent connections
const REQUEST_TIMEOUT = 5000;         // Request timeout in ms
```

### Output Metrics

Each benchmark provides the following metrics:

- **Requests/sec**: Throughput measurement
- **Latency Statistics**: Average, min, max, 50th, 95th, 99th percentiles
- **Throughput**: Data transfer rate in MB/s
- **Error Rate**: Failed requests percentage
- **Response Size**: Average response payload size

### Sample Output

```
🚀 Tenso Benchmark Suite
========================

┌─ Static Text Response
│  Simple static text response performance
│  Testing: /static
└─ Running 1,000 requests with 10 concurrent connections

  Warming up with 100 requests...

  Results:
    Requests: 1,000
    Errors: 0
    Duration: 2.45s
    Requests/sec: 408.16
    Throughput: 0.05 MB/s
    Avg Response Size: 13 bytes

  Latency:
    Average: 24.11ms
    Min: 8.23ms
    Max: 89.45ms
    50th percentile: 22.10ms
    95th percentile: 45.67ms
    99th percentile: 67.89ms
```

## Memory Benchmark Suite

### Memory Test Scenarios

| Scenario | Description | Purpose |
|----------|-------------|---------|
| `large-objects` | Large object creation and serialization | Memory allocation patterns |
| `string-manipulation` | Heavy string operations | String memory usage |
| `buffer-operations` | Buffer creation and manipulation | Buffer memory management |
| `recursive-data` | Nested recursive data structures | Deep object memory usage |

### Memory Metrics

- **Heap Usage**: Used, total, min, max, average
- **RSS (Resident Set Size)**: Total memory used by process
- **Garbage Collection**: GC events and memory freed
- **Memory Growth**: Rate of memory increase over time
- **Leak Detection**: Warnings for potential memory leaks

### Configuration

Memory benchmark settings:

```javascript
const MEMORY_TEST_DURATION = 30000;    // Test duration in ms
const MEMORY_SAMPLE_INTERVAL = 1000;   // Memory sampling interval
const CONCURRENT_CONNECTIONS = 20;     // Concurrent connections
const REQUEST_INTERVAL = 50;           // Delay between requests
```

### Sample Output

```
🧠 Tenso Memory Benchmark Suite
===============================

┌─ Large Object Creation
│  Tests memory usage with large object creation and serialization
│  Duration: 30s
│  Concurrent connections: 20
└─ Monitoring memory usage...

  Load Testing Results:
    Requests sent: 12,000
    Responses received: 11,987
    Errors: 13
    Average latency: 45.23ms
    Requests/sec: 399.57

  Memory Usage (MB):
    RSS - Min: 45.23, Max: 78.91, Avg: 62.45
    Heap Used - Min: 12.34, Max: 34.56, Avg: 23.45
    Heap Total - Min: 25.67, Max: 45.89, Avg: 35.78

  Garbage Collection:
    GC Events: 15
    Total Memory Freed: 156.78 MB
    Memory Samples: 30

  Memory Growth:
    Total heap growth: 2.34 MB
    Growth rate: 78.00 KB/sec
```

## HTTP Performance Benchmark Suite

### HTTP Test Scenarios

The HTTP benchmark suite provides comprehensive testing of core HTTP server functionality:

| Scenario | Description | Purpose |
|----------|-------------|---------|
| `static-text` | Simple static text response | Baseline performance measurement |
| `json-simple` | Basic JSON object serialization | JSON handling overhead |
| `json-complex` | Complex nested JSON (100 users) | Large object serialization performance |
| `route-params` | URL parameter extraction | Routing performance with parameters |
| `query-params` | Query string parsing | Query parameter handling overhead |
| `content-negotiation` | Multiple content types | Content type selection performance |
| `middleware-chain` | Multiple middleware functions | Middleware stack overhead |
| `error-handling` | Error response generation | Error handling performance |
| `hypermedia` | HATEOAS link generation | Hypermedia feature overhead |

### Configuration

```javascript
const BENCHMARK_PORT = 8080;          // Server port for testing
const WARMUP_REQUESTS = 100;          // Warmup requests before timing
const BENCHMARK_REQUESTS = 1000;      // Requests per benchmark
const CONCURRENT_CONNECTIONS = 10;    // Concurrent connections
const REQUEST_TIMEOUT = 5000;         // Request timeout in ms
```

### Sample Output

```
🚀 Tenso HTTP Performance Benchmark
====================================

┌─ Static Text Response
│  Simple static text response performance
│  Testing: /static
└─ Running 1,000 requests...

  Results:
    Requests: 1,000
    Errors: 0
    Duration: 2.45s
    Requests/sec: 408.16
    Average latency: 24.11ms
```

## Utility Benchmark Suite

### Utility Test Scenarios

Tests various utility functions and operations commonly used in web applications:

| Scenario | Description | Purpose |
|----------|-------------|---------|
| `string-operations` | String manipulation functions | String processing performance |
| `object-operations` | Object property access and modification | Object handling efficiency |
| `array-operations` | Array methods (map, filter, reduce) | Array processing performance |
| `json-operations` | JSON stringify/parse operations | JSON serialization overhead |
| `regexp-operations` | Regular expression matching | Pattern matching performance |
| `date-operations` | Date creation and formatting | Date handling efficiency |
| `url-operations` | URL parsing and manipulation | URL processing performance |
| `math-operations` | Mathematical calculations | Math function performance |
| `crypto-operations` | Basic cryptographic operations | Crypto function overhead |
| `memory-allocation` | Memory allocation patterns | Memory allocation efficiency |

### Sample Output

```
🔧 Tenso Utility Benchmark Suite
=================================

┌─ String Operations
│  String manipulation performance
└─ Running 100 iterations...

  Results:
    Iterations: 100
    Total time: 15.23ms
    Average: 0.15ms per iteration
    Operations/sec: 6,566.81
```

## Performance Analysis

### Interpreting Results

#### Requests per Second (RPS)
- **High RPS (>1000)**: Excellent performance
- **Medium RPS (500-1000)**: Good performance  
- **Low RPS (<500)**: Potential bottlenecks

#### Latency Percentiles
- **50th percentile**: Typical user experience
- **95th percentile**: Worst case for most users
- **99th percentile**: Worst case scenario

#### Memory Patterns
- **Stable memory**: Good garbage collection
- **Growing memory**: Potential memory leaks
- **High GC frequency**: Memory pressure

### Common Performance Issues

#### High Latency
- **Cause**: Blocking operations, heavy computation
- **Solution**: Optimize algorithms, use async patterns

#### Memory Leaks
- **Symptoms**: Continuous memory growth, high GC frequency
- **Solution**: Check for retained references, object pools

#### Low Throughput
- **Cause**: Middleware overhead, serialization bottlenecks
- **Solution**: Optimize middleware chain, use streaming

## Optimization Guidelines

### General Performance
1. **Minimize middleware**: Only use necessary middleware
2. **Optimize serialization**: Consider alternative formats for large data
3. **Use connection pooling**: For database and external service calls
4. **Enable compression**: For large responses
5. **Cache static content**: Use CDN or reverse proxy

### Memory Optimization
1. **Object pooling**: Reuse objects for frequent operations
2. **Streaming**: Use streams for large data sets
3. **Weak references**: For caches and temporary storage
4. **Monitor GC**: Tune garbage collection settings if needed

### Monitoring in Production
1. **Track key metrics**: RPS, latency percentiles, memory usage
2. **Set up alerts**: For performance degradation
3. **Regular benchmarking**: Compare performance over time
4. **Profile bottlenecks**: Use tools like clinic.js or 0x

## Advanced Usage

### Custom Benchmarks

Add custom benchmark scenarios to the `BENCHMARKS` object:

```javascript
const BENCHMARKS = {
  "custom-test": {
    name: "Custom Test",
    path: "/custom",
    description: "Description of custom test",
    setup: (app) => {
      app.get("/custom", (req, res) => {
        // Custom logic here
        res.json({custom: "response"});
      });
    }
  }
};
```

### Environment Variables

Control benchmark behavior with environment variables:

```bash
# Enable garbage collection tracking
node --expose-gc benchmarks/memory-benchmark.js

# Increase memory sampling
MEMORY_SAMPLE_INTERVAL=500 node benchmarks/memory-benchmark.js

# Run with production-like settings
NODE_ENV=production npm run benchmark
```

### Integration with CI/CD

Example GitHub Actions workflow:

```yaml
name: Performance Benchmarks
on: [push, pull_request]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run benchmark
      - run: node benchmarks/memory-benchmark.js
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
Error: listen EADDRINUSE :::8080
```
**Solution**: Change `BENCHMARK_PORT` or kill process using the port

#### Memory Benchmark Errors
```bash
Error: Cannot find module '../dist/tenso.js'
```
**Solution**: Run `npm run build` to create distribution files

#### High Error Rates
**Causes**: Server overload, timeout issues, network problems
**Solutions**: Reduce concurrency, increase timeouts, check server health

### Performance Debugging

1. **Enable debug logging**: Set `logging.enabled: true` in config
2. **Use profilers**: clinic.js, 0x, or Node.js inspector
3. **Monitor system resources**: CPU, memory, network
4. **Check for blocking operations**: Use async/await properly

## Contributing

To add new benchmarks or improve existing ones:

1. Fork the repository
2. Add new benchmark scenarios following existing patterns
3. Update documentation
4. Test thoroughly
5. Submit a pull request

### Benchmark Best Practices

- **Realistic scenarios**: Test real-world use cases
- **Consistent environment**: Use same hardware/OS for comparisons
- **Warmup period**: Allow JIT compilation to stabilize
- **Multiple runs**: Average results over several runs
- **Document changes**: Explain what the benchmark measures

## References

- [Node.js Performance Hooks](https://nodejs.org/api/perf_hooks.html)
- [Memory Usage API](https://nodejs.org/api/process.html#process_process_memoryusage)
- [HTTP Benchmarking Best Practices](https://github.com/nodejs/node/blob/main/doc/guides/writing-and-running-benchmarks.md) 