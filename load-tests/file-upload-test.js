// File upload/download load test
import http from 'k6/http';
import { sleep, check } from 'k6';

export let options = {
  stages: [
    { duration: '20s', target: 20 },   // Lower concurrent users for file uploads
    { duration: '40s', target: 50 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // File uploads take longer
    http_req_failed: ['rate<0.05'],    // Allow 5% error rate for uploads
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const TOKEN = __ENV.AUTH_TOKEN || '';

export default function () {
  const headers = TOKEN 
    ? { 'Authorization': `Bearer ${TOKEN}` }
    : {};

  // Create a test file buffer
  const testFile = {
    data: 'Test resume content for load testing. '.repeat(100),
    filename: 'test-resume.pdf',
    content_type: 'application/pdf',
  };

  // Test resume upload
  const uploadRes = http.post(
    `${BASE_URL}/resume/upload`,
    { file: http.file(testFile.data, testFile.filename, testFile.content_type) },
    { headers }
  );

  check(uploadRes, {
    'upload status is 2xx or 401': (r) => [200, 201, 401].includes(r.status),
    'upload response time < 3000ms': (r) => r.timings.duration < 3000,
  });

  sleep(3);
}
