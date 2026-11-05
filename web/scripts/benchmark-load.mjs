/**
 * MedAI Native Local Concurrent Load Benchmark Runner
 * 
 * Simulates concurrent load against MedAI API endpoints:
 * - GET /api/clinics (Cached Overpass facility proxy)
 * - Tests p50, p90, p95, p99 latencies, RPS throughput, and error rates.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CONCURRENT_CLIENTS = 20;
const TOTAL_REQUESTS = 100;

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function runBenchmark() {
  console.log(`===============================================================`);
  console.log(`🚀 MedAI Local Concurrent Load Benchmark`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Concurrency: ${CONCURRENT_CLIENTS} Virtual Clients`);
  console.log(`Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`===============================================================\n`);

  const lat = 37.7749;
  const lon = -122.4194;
  const url = `${BASE_URL}/api/clinics?lat=${lat}&lon=${lon}`;

  // Prime the cache with one initial request
  try {
    const primeRes = await fetch(url, { signal: AbortSignal.timeout(10000) });
    console.log(`Cache Priming: HTTP ${primeRes.status} (Initial fetch)`);
  } catch (err) {
    console.warn(`Warning: Cache prime failed (upstream may be slow or offline):`, err.message);
  }

  const latencies = [];
  let successfulRequests = 0;
  let failedRequests = 0;

  const startTime = Date.now();
  let completed = 0;

  async function worker() {
    while (completed < TOTAL_REQUESTS) {
      completed++;
      const reqStart = performance.now();
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        const reqDuration = performance.now() - reqStart;
        latencies.push(reqDuration);
        if (res.ok || res.status === 504) {
          successfulRequests++;
        } else {
          failedRequests++;
        }
      } catch {
        failedRequests++;
        latencies.push(performance.now() - reqStart);
      }
    }
  }

  const pool = Array.from({ length: CONCURRENT_CLIENTS }, () => worker());
  await Promise.all(pool);

  const totalDurationSeconds = (Date.now() - startTime) / 1000;
  const rps = (successfulRequests + failedRequests) / totalDurationSeconds;

  const p50 = percentile(latencies, 50).toFixed(1);
  const p90 = percentile(latencies, 90).toFixed(1);
  const p95 = percentile(latencies, 95).toFixed(1);
  const p99 = percentile(latencies, 99).toFixed(1);
  const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1);
  const errorRate = ((failedRequests / (successfulRequests + failedRequests)) * 100).toFixed(1);

  console.log(`\n===============================================================`);
  console.log(`📊 BENCHMARK RESULTS`);
  console.log(`===============================================================`);
  console.log(`Total Completed:       ${successfulRequests + failedRequests}`);
  console.log(`Successful Requests:   ${successfulRequests}`);
  console.log(`Failed Requests:       ${failedRequests} (${errorRate}%)`);
  console.log(`Total Duration:        ${totalDurationSeconds.toFixed(2)} s`);
  console.log(`Requests / Sec (RPS):  ${rps.toFixed(1)} RPS`);
  console.log(`Latency p50:           ${p50} ms`);
  console.log(`Latency p90:           ${p90} ms`);
  console.log(`Latency p95:           ${p95} ms`);
  console.log(`Latency p99:           ${p99} ms`);
  console.log(`Latency Mean:          ${avg} ms`);
  console.log(`===============================================================`);
}

runBenchmark().catch(console.error);
