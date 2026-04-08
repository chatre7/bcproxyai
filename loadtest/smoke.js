import http from 'k6/http';
import { check, sleep } from 'k6';
import { reportTo } from './_report.js';

export const options = {
  vus: 1,
  duration: '10s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';

export default function () {
  const homepage = http.get(`${BASE_URL}/`);
  check(homepage, {
    'homepage status 200': (r) => r.status === 200,
  });

  const status = http.get(`${BASE_URL}/api/status`);
  check(status, {
    'status endpoint 200': (r) => r.status === 200,
  });

  sleep(1);
}

export const handleSummary = reportTo(BASE_URL, 'smoke');
