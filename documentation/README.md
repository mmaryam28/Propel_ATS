# Load Testing Guide - Propel Application

## Overview
This guide covers load testing the Propel backend API using k6, a modern open-source load testing tool.

## Prerequisites

### Install k6

**Windows (PowerShell as Administrator):**
```powershell
choco install k6
```

If you don't have Chocolatey:
```powershell
winget install k6 --source winget
```

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install k6
```

### Verify Installation
```bash
k6 version
```

## Test Scripts

### 1. Basic Load Test (`basic-load-test.js`)
Tests general application responsiveness under load.

**Run:**
```bash
k6 run load-tests/basic-load-test.js
```

**With deployed backend:**
```bash
k6 run load-tests/basic-load-test.js -e API_URL=https://your-backend.onrender.com
```

**Metrics to watch:**
- Average response time
- 95th percentile latency
- Error rate
- Requests per second

### 2. Database Load Test (`database-load-test.js`)
Tests database-heavy endpoints (jobs, profile).

**Run with authentication:**
```bash
$env:AUTH_TOKEN="your-jwt-token"
k6 run load-tests/database-load-test.js -e API_URL=https://your-backend.onrender.com
```

**Bottlenecks to look for:**
- Response time spikes > 1000ms
- Increased error rates
- Database connection pool exhaustion
- Query timeout errors

### 3. File Upload Test (`file-upload-test.js`)
Tests resume upload functionality under concurrent load.

**Run:**
```bash
k6 run load-tests/file-upload-test.js -e API_URL=https://your-backend.onrender.com -e AUTH_TOKEN=your-token
```

**Expected behavior:**
- Slower response times (up to 3 seconds acceptable)
- Some failures at peak load expected
- Memory usage increases during test

## Running All Tests

Create a test runner script:

```bash
# Run all tests sequentially
k6 run load-tests/basic-load-test.js --out json=results/basic-results.json
k6 run load-tests/database-load-test.js --out json=results/db-results.json
k6 run load-tests/file-upload-test.js --out json=results/upload-results.json
```

## Interpreting Results

### Key Metrics

1. **http_req_duration** - Response time
   - avg: Average response time
   - p(95): 95th percentile (most important)
   - max: Maximum response time

2. **http_req_failed** - Error rate
   - Should be < 1% for most endpoints
   - < 5% acceptable for file uploads

3. **http_reqs** - Throughput
   - Total requests handled
   - Requests per second

4. **vus** - Virtual Users
   - Peak concurrent users reached

### Example Output
```
     execution: local
        script: basic-load-test.js
        output: -

     scenarios: (100.00%) 1 scenario, 100 max VUs, 2m30s max duration

     ✓ health check status is 200
     ✓ health check response time < 500ms

     checks.........................: 100.00% ✓ 9824      ✗ 0
     data_received..................: 2.5 MB  42 kB/s
     data_sent......................: 1.2 MB  20 kB/s
     http_req_blocked...............: avg=1.23ms   p(95)=3.45ms
     http_req_duration..............: avg=320ms    p(95)=610ms    max=1.2s
     http_reqs......................: 9824    163/s
     vus............................: 100     min=0        max=100
```

## Common Bottlenecks & Solutions

### 1. High Response Times (> 500ms)
**Causes:**
- Inefficient database queries
- Missing indexes
- No caching

**Solutions:**
- Add database indexes on frequently queried fields
- Implement Redis caching
- Optimize N+1 queries

### 2. Database Connection Errors
**Symptoms:**
- `ECONNREFUSED` errors
- Timeout errors
- `too many connections`

**Solutions:**
- Increase connection pool size
- Add connection retry logic
- Scale database resources

### 3. File Upload Failures
**Symptoms:**
- 413 Payload Too Large
- Timeouts during upload
- Memory errors

**Solutions:**
- Limit concurrent uploads
- Increase request timeout
- Add file size limits
- Implement chunked uploads

### 4. Memory Leaks
**Symptoms:**
- Response time increases over test duration
- Server crashes after sustained load
- Out of memory errors

**Solutions:**
- Profile memory usage
- Fix unclosed database connections
- Implement proper garbage collection
- Add memory limits

## Frontend Responsiveness Testing

While k6 tests are running:

1. **Open frontend in browser**
2. **Perform user actions:**
   - Navigate between pages
   - Submit job applications
   - Upload resume
   - Search jobs
   - Update profile

3. **Check for:**
   - UI remains responsive
   - No freezing or hanging
   - Form submissions complete
   - Pages load within 2 seconds
   - No JavaScript errors in console

## Generating Performance Report

### Export Results
```bash
k6 run load-tests/basic-load-test.js --out json=results.json
```

### Report Template

```markdown
# Performance Test Report - Propel Application

## Test Configuration
- **Tool:** k6 v0.45.0
- **Date:** 2025-12-18
- **Duration:** 2 minutes per test
- **Users:** 50-100 concurrent
- **Backend URL:** https://propel-backend.onrender.com

## Test Results

### 1. Basic Load Test
- **Avg Response Time:** 320 ms
- **95th Percentile:** 610 ms
- **Max Response Time:** 1,200 ms
- **Error Rate:** 0.3%
- **Throughput:** 163 req/s

### 2. Database Load Test
- **Avg Response Time:** 580 ms
- **95th Percentile:** 950 ms
- **Error Rate:** 1.2%
- **Bottleneck:** Jobs endpoint slower under peak load

### 3. File Upload Test
- **Avg Response Time:** 1,840 ms
- **95th Percentile:** 2,750 ms
- **Error Rate:** 4.5%
- **Finding:** Concurrent uploads degrade performance

## Bottlenecks Identified

1. **Database Query Performance**
   - Jobs listing endpoint shows 2x slowdown at 100 users
   - Missing indexes on `createdAt` and `userId` fields

2. **File Upload Handling**
   - No rate limiting on uploads
   - Memory spikes during concurrent uploads

3. **Connection Pool Exhaustion**
   - Supabase connection limit reached at peak load

## Optimization Recommendations

1. **Database Optimizations**
   - Add composite index: `jobs(userId, createdAt)`
   - Enable query result caching (Redis)
   - Implement connection pooling with retry logic

2. **File Upload Improvements**
   - Add rate limiting: 5 uploads per user per minute
   - Implement chunked upload for large files
   - Increase memory allocation to 1GB

3. **Scaling Recommendations**
   - Upgrade Supabase plan for more connections
   - Add CDN for static assets
   - Enable gzip compression

## Frontend Responsiveness

✅ **Passed All Checks**
- UI remained responsive during peak load
- Page navigation < 2 seconds
- No UI freezes or errors
- Form submissions completed successfully

## Conclusion

Application handles 50-100 concurrent users with acceptable performance. Identified bottlenecks are addressable through database optimization and connection pool tuning. Recommend implementing proposed optimizations before production launch.
```

## Next Steps

1. **Run tests on deployed backend**
2. **Document results** using template above
3. **Implement optimizations** based on findings
4. **Re-test** to verify improvements
5. **Submit report** with metrics and recommendations

## Troubleshooting

### k6 not found
- Ensure k6 is in PATH
- Restart terminal after installation

### Connection refused errors
- Verify backend is running
- Check API_URL is correct
- Confirm firewall allows connections

### Authentication errors
- Generate valid JWT token
- Set AUTH_TOKEN environment variable
- Check token hasn't expired

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [Load Testing Best Practices](https://k6.io/docs/testing-guides/)
- [Performance Optimization Guide](https://docs.nestjs.com/techniques/performance)
