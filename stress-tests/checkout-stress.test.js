import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { registerAndLogin } from './flows/auth-flow.js';
import { runCheckout } from './flows/checkout-flow.js';

const checkoutDuration = new Trend('checkout_duration', true); 
const checkoutFailRate = new Rate('checkout_fail_rate');
const totalCheckouts   = new Counter('total_checkouts');

export const options = {
  scenarios: {

    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 25  }, 
        { duration: '30s', target: 100 },
        { duration: '60s', target: 100 },
        { duration: '20s', target: 0   }, 
      ],
    },
  },

  thresholds: {

    checkout_duration: ['p(95)<3000'],

    checkout_fail_rate: ['rate<0.05'],

    http_req_failed: ['rate<0.05'],

    http_req_duration: ['p(90)<2000'],
  },
};


export default function () {

    const vuId = __VU; 

  const token = registerAndLogin(vuId);
  if (!token) {
    checkoutFailRate.add(true);
    //checkoutFailRate.add(1);
    return;
  }

  const start = Date.now();
  const isSuccess = runCheckout(token);
  const duration = Date.now() - start;

  checkoutDuration.add(duration);
  totalCheckouts.add(1);

  // const failed = isSuccess !== 200 && isSuccess !== 201;
  // checkoutFailRate.add(failed ? 1 : 0);
checkoutFailRate.add(!isSuccess ? 1 : 0);
  sleep(1); 
}

export function handleSummary(data) {
  const passed = data.metrics.checkout_fail_rate.values.rate < 0.05;

  console.log('\n======================================================');
  console.log('        STRESS TEST REPORT');
  console.log('======================================================');
  console.log(`Status          : ${passed ? ' PASSED' : ' FAILED'}`);
  console.log(`Total Checkouts : ${data.metrics.total_checkouts?.values.count ?? 0}`);
  console.log(`Fail Rate       : ${(data.metrics.checkout_fail_rate.values.rate * 100).toFixed(2)}%`);
  // console.log(`p50 Duration    : ${data.metrics.checkout_duration?.values['p(50)']?.toFixed(0) ?? 'N/A'} ms`);
  console.log(`p95 Duration    : ${data.metrics.checkout_duration?.values['p(95)']?.toFixed(0) ?? 'N/A'} ms`);
  // console.log(`p99 Duration    : ${data.metrics.checkout_duration?.values['p(99)']?.toFixed(0) ?? 'N/A'} ms`);
  console.log('======================================================\n');

  return {
    'stress-tests/reports/summary.json': JSON.stringify(data, null, 2),
  };
}