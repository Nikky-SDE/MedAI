import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * MedAI k6 Concurrent Load & Stress Test Suite
 * 
 * Simulates concurrent patient traffic against MedAI API endpoints:
 * 1. POST /api/triage (Server-owned clinical triage intake loop)
 * 2. GET /api/clinics (Server-cached Overpass healthcare facilities proxy)
 * 
 * Run with:
 *   k6 run loadtest/k6-triage-loadtest.js
 * 
 * Or target remote deployment:
 *   k6 run -e BASE_URL=https://your-domain.com loadtest/k6-triage-loadtest.js
 */

export const options = {
  scenarios: {
    // Scenario 1: Ramp-up and sustained concurrent triage load
    triage_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 5 },   // Warm-up to 5 VUs
        { duration: '30s', target: 20 },  // Sustained load at 20 concurrent VUs
        { duration: '10s', target: 0 },   // Cool-down
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    // 95% of requests must complete below 1.5s; 99% below 3s
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    // HTTP failure rate must stay below 5%
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const sessionId = 'test-session-' + Math.floor(Math.random() * 10000);

  // 1. Test POST /api/triage endpoint
  const triagePayload = JSON.stringify({
    sessionId: sessionId,
    message: 'I have had a throbbing frontal headache and mild nausea for the past 2 days.',
    turnNumber: 1,
  });

  const triageParams = {
    headers: {
      'Content-Type': 'application/json',
      'X-Mock-LLM': 'true',
    },
  };

  const triageRes = http.post(`${BASE_URL}/api/triage`, triagePayload, triageParams);

  check(triageRes, {
    'triage status is 200 or 401/429 (handled)': (r) => [200, 401, 429].includes(r.status),
    'triage response has body': (r) => r.body && r.body.length > 0,
  });

  sleep(0.5);

  // 2. Test GET /api/clinics cached facility proxy (San Francisco coords)
  const lat = 37.7749;
  const lon = -122.4194;
  const clinicsRes = http.get(`${BASE_URL}/api/clinics?lat=${lat}&lon=${lon}`);

  check(clinicsRes, {
    'clinics proxy status is 200 or 504': (r) => [200, 504].includes(r.status),
    'clinics response has valid json': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch (_) {
        return false;
      }
    },
  });

  sleep(1);
}
