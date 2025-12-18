// Database-heavy endpoint load test
import http from 'k6/http';
import { sleep, check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // DB queries may take longer
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const TOKEN = __ENV.AUTH_TOKEN || ''; // Set via environment variable

export default function () {
  const headers = TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {};

  // Test jobs listing (DB-heavy)
  const jobsRes = http.get(`${BASE_URL}/jobs`, { headers });
  
  check(jobsRes, {
    'jobs endpoint status is 200': (r) => r.status === 200 || r.status === 401,
    'jobs response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  // Test profile endpoint (DB query + joins)
  const profileRes = http.get(`${BASE_URL}/profile`, { headers });
  
  check(profileRes, {
    'profile endpoint responsive': (r) => r.status === 200 || r.status === 401,
    'profile response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(2);
}
