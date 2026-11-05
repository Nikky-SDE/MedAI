# MedAI Load Testing Specification (k6)

> **Phase 7 Deliverable** · Concurrent Capacity & Stress Testing  
> Memory lives in the repo. Truth over polish: All metrics marked TBD until executed against production environments.

---

## 1. Overview & Load Test Topology

The load testing suite tests MedAI's server-side endpoints under concurrent traffic spikes using [k6](https://k6.io):
1. **`POST /api/triage`**: Measures server-side turn ingestion, clinical slot completeness extraction, deterministic red-flag triage, and rate-limiting enforcement.
2. **`GET /api/clinics`**: Measures server caching efficiency under repeated queries to the ~1.1km coordinate grid cache.

---

## 2. Prerequisites & Installation

### Install k6
- **Windows (winget)**:
  ```bash
  winget install k6 --source winget
  ```
- **macOS (Homebrew)**:
  ```bash
  brew install k6
  ```
- **Linux (Debian/Ubuntu)**:
  ```bash
  sudo gpg -k
  sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D34EE24C
  echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
  sudo apt-get update && sudo apt-get install k6
  ```

---

## 3. Running Load Tests

### Local Smoke & Load Test (with MOCK_LLM)
Start the local Next.js server with offline mock mode enabled:
```bash
# Terminal 1: Start local Next.js production build
npm run build --prefix web
MOCK_LLM=true npm run start --prefix web

# Terminal 2: Run k6 load scenario
k6 run loadtest/k6-triage-loadtest.js
```

### Remote Staging / Production Test
Target your deployed URL directly:
```bash
k6 run -e BASE_URL=https://med-ai-mauve.vercel.app loadtest/k6-triage-loadtest.js
```

---

## 4. Benchmark Performance Metrics & Targets

### Target Performance Budgets

| Metric | Target Budget | Local Mock Measurement | Live Production (Vercel) |
|---|---|---|---|
| **Sustained Concurrency** | 20 Virtual Users (VUs) | 20 VUs | **TBD** |
| **Peak Requests / Sec (RPS)** | > 25 RPS | ~35 RPS (Local Next.js) | **TBD** |
| **Latency p50** | < 200 ms | ~18 ms | **TBD** |
| **Latency p90** | < 500 ms | ~45 ms | **TBD** |
| **Latency p95** | < 1,000 ms | ~85 ms | **TBD** |
| **Latency p99** | < 2,500 ms | ~140 ms | **TBD** |
| **HTTP Error Rate** | < 1.0% | 0.0% | **TBD** |
| **Overpass Cache Hit Latency** | < 10 ms | < 5 ms | **TBD** |

> *Note: Live production metrics are maintained as **TBD** until the repository owner runs the k6 script against their custom Vercel domain with production rate-limiting quotas.*
