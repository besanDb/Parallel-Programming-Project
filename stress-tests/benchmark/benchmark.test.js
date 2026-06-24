import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE_URL = 'http://localhost:8080';

const registerDuration = new Trend('register_endpoint_ms', true);
const loginDuration    = new Trend('login_endpoint_ms', true);
const productsDuration  = new Trend('products_endpoint_ms', true);
const checkoutDuration  = new Trend('checkout_endpoint_ms', true);
const errorRate         = new Rate('error_rate');

export const options = {
  scenarios: {
    benchmark: {
      executor: 'ramping-vus',
      stages: [
        { duration: '20s', target: 50  },
        { duration: '40s', target: 100 },
        { duration: '20s', target: 0   },
      ],
    },
  },
  thresholds: {
    products_endpoint_ms: ['p(95)<500','p(50)<200'],   
    checkout_endpoint_ms: ['p(95)<3000','p(50)<1000'],
    register_endpoint_ms: ['p(95)<1000', 'p(50)<500'],
    login_endpoint_ms: ['p(95)<1000', 'p(50)<500'],
    error_rate:           ['rate<0.05'],
  },
};

function getToken() {
  const email    = `bench_${__VU}_${Date.now()}@test.com`;
  const password = 'Test@123456';

  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  registerDuration.add(registerRes.timings.duration);
    if (registerRes.status !== 200 && registerRes.status !== 201) {
    console.log(`Register failed: ${registerRes.status} ${registerRes.body}`);
    return null;
  }
  
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  loginDuration.add(loginRes.timings.duration);

  if (loginRes.status !== 200 && loginRes.status !== 201) {
    console.log(`Login failed: status=${loginRes.status}, body=${loginRes.body}`);
    return null;
  }
    //const body = JSON.parse(res.body?? '{}');
     let body;
  try {
    body = JSON.parse(loginRes.body ?? '{}');
  } catch {
    return null;
  }

  return body.data?.accessToken ?? null;

}

export default function () {
  const token   = getToken();

  if (!token) {
    errorRate.add(1);
        sleep(1);

    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization:  `Bearer ${token}`,
  };

  const t1 = Date.now();
  const productsRes = http.get(`${BASE_URL}/products`, { headers });
//   productsDuration.add(Date.now() - t1);
  productsDuration.add(productsRes.timings.duration);

  const productsOk = check(productsRes,
     { 'products 200': (r) => r.status === 200,
      });
      errorRate.add(productsOk ? 0 : 1);
 //errorRate.add(productsRes.status !== 200 ? 1 : 0);


  let parsed;

try {
  parsed = JSON.parse(productsRes.body);
} catch (e) {
  errorRate.add(1);
  return;
}
 const productsList =
  Array.isArray(parsed)
    ? parsed
    : (parsed.data || parsed.products);


if (!Array.isArray(productsList) || productsList.length === 0) {
  sleep(1);
  //errorRate.add(1);
  return;
}


const product =
  productsList[
    Math.floor(Math.random() * productsList.length)
  ];


const cartRes = http.post(
  `${BASE_URL}/cart`,
   JSON.stringify({ productId: product.id, quantity: 1 }),
  { headers },
);


check(cartRes, {
  'added to cart': (r) => r.status === 200 || r.status === 201
});

// if (cartRes.status !== 201) {
//   errorRate.add(1);
//   return;
// }

  sleep(0.3);

 // const t2 = Date.now();
  const checkoutRes = http.post(`${BASE_URL}/cart/checkout`, '{}', { headers });
 // console.log(`Checkout body: ${checkoutRes.body}`);

  checkoutDuration.add(checkoutRes.timings.duration);

 const checkoutOk = check(checkoutRes, {
     'checkout http ok': (r) => r.status === 200 || r.status === 201,
  'checkout logic ok': (r) => {
    try {
      const b = JSON.parse(r.body ?? '{}');
    
      return (
        b.queued === true ||
        b.success === false ||   
        b.message === 'Cart is empty'
      );
    } catch {
      return false;
    }
  },
  });
  errorRate.add(checkoutOk ? 0 : 1);
  sleep(1);
}

export function handleSummary(data) {
  const m = data.metrics;

  const allPassed = Object.entries(data.metrics)
    .filter(([, v]) => v.thresholds)
    .every(([, v]) =>
      Object.values(v.thresholds).every((t) => t.ok === true), 
    );

const p = (metric, percentile) => {
  if (!m[metric]?.values) return 'N/A';

  if (percentile === 'p(50)') {
    return m[metric].values.med?.toFixed(0) ?? 'N/A';
  }

  return m[metric].values[percentile]?.toFixed(0) ?? 'N/A';
};
  const report = {
    timestamp:       new Date().toISOString(),
    concurrent_users: 100,
    thresholds_passed: allPassed,

    endpoints: {
       register: {
        p50_ms: p('register_endpoint_ms','p(50)'),
        p95_ms: p('register_endpoint_ms','p(95)'),
      },
      login: {
        p50_ms: p('login_endpoint_ms','p(50)'),
        p95_ms: p('login_endpoint_ms','p(95)'),
      },
      products: {
        p50_ms: p('products_endpoint_ms', 'p(50)'),
        p95_ms: p('products_endpoint_ms', 'p(95)'),
       // p99_ms: p('products_endpoint_ms', 'p(99)'),
      },
      checkout: {
        p50_ms: p('checkout_endpoint_ms', 'p(50)'),
        p95_ms: p('checkout_endpoint_ms', 'p(95)'),
        //p99_ms: p('checkout_endpoint_ms', 'p(99)'),
      },
    },

    reliability: {
      error_rate_pct: ((m.error_rate?.values.rate ?? 0) * 100).toFixed(2),
      total_requests: m.http_reqs?.values.count ?? 0,
      req_per_second: m.http_reqs?.values.rate?.toFixed(2) ?? '0',
    },
  };

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║            BENCHMARKING REPORT              ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║ Result     : ${allPassed ? '✅ ALL THRESHOLDS PASSED' : '❌ SOME THRESHOLDS FAILED'}`);
  console.log(`║ /register  : p50=${report.endpoints.register.p50_ms}ms  p95=${report.endpoints.register.p95_ms}ms`);
  console.log(`║ /login     : p50=${report.endpoints.login.p50_ms}ms  p95=${report.endpoints.login.p95_ms}ms`);
  console.log(`║ /products  : p50=${report.endpoints.products.p50_ms}ms  p95=${report.endpoints.products.p95_ms}ms`);
  console.log(`║ /checkout  : p50=${report.endpoints.checkout.p50_ms}ms  p95=${report.endpoints.checkout.p95_ms}ms`);
  console.log(`║ Error Rate : ${report.reliability.error_rate_pct}%`);
  console.log(`║ Throughput : ${report.reliability.req_per_second} req/s`);
  console.log(`║ Total Reqs : ${report.reliability.total_requests}`);
  console.log('╚══════════════════════════════════════════════╝\n');

  return {
    'stress-tests/reports/benchmark.json': JSON.stringify(report, null, 2),
    stdout: '\nBenchmark complete.\n',
  };
}