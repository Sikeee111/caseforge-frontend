const http = require("http");
const https = require("https");

const URL = process.env.TEST_URL || "https://caseforge-backend-goou.onrender.com/api/cases";
const TOTAL_REQUESTS = Number(process.env.REQUESTS || 300);
const CONCURRENCY = Number(process.env.CONCURRENCY || 50);

let completed = 0;
let succeeded = 0;
let failed = 0;
let inFlight = 0;
let index = 0;
const durations = [];

function requestOnce() {
  return new Promise((resolve) => {
    const started = Date.now();
    const client = URL.startsWith("https://") ? https : http;

    const req = client.get(
      URL,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "CaseForge-Load-Test/1.0",
        },
      },
      (res) => {
        res.resume();

        res.on("end", () => {
          const duration = Date.now() - started;
          durations.push(duration);

          if (res.statusCode >= 200 && res.statusCode < 400) {
            succeeded += 1;
          } else {
            failed += 1;
          }

          resolve();
        });
      }
    );

    req.setTimeout(15000, () => {
      req.destroy();
      failed += 1;
      durations.push(Date.now() - started);
      resolve();
    });

    req.on("error", () => {
      failed += 1;
      durations.push(Date.now() - started);
      resolve();
    });
  });
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return sorted[index];
}

async function worker() {
  while (true) {
    const current = index++;
    if (current >= TOTAL_REQUESTS) return;

    inFlight += 1;
    await requestOnce();
    inFlight -= 1;
    completed += 1;

    if (completed % 25 === 0 || completed === TOTAL_REQUESTS) {
      process.stdout.write(
        `\rCompleted ${completed}/${TOTAL_REQUESTS} | in flight ${inFlight}`
      );
    }
  }
}

(async () => {
  console.log("CaseForge read-only load test");
  console.log(`URL: ${URL}`);
  console.log(`Requests: ${TOTAL_REQUESTS}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log("");

  const started = Date.now();

  await Promise.all(
    Array.from(
      { length: Math.min(CONCURRENCY, TOTAL_REQUESTS) },
      () => worker()
    )
  );

  const elapsed = Date.now() - started;

  console.log("\n");
  console.log(`Total time: ${(elapsed / 1000).toFixed(2)}s`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Requests/sec: ${(TOTAL_REQUESTS / (elapsed / 1000)).toFixed(2)}`);
  console.log(`p50: ${percentile(durations, 50)} ms`);
  console.log(`p95: ${percentile(durations, 95)} ms`);
  console.log(`p99: ${percentile(durations, 99)} ms`);
})();