const fs = require("fs");

function readEnvFile() {
  if (!fs.existsSync(".env")) return {};
  const result = {};
  for (const rawLine of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    result[line.slice(0, separator).trim()] = line
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
  }
  return result;
}

const localEnv = readEnvFile();
const apiKey = process.env.VNCDN_API_KEY || localEnv.VNCDN_API_KEY;
// Safety boundary: this runner must never purge any other domain.
const domain = "graduation.sontan.info";
const baseUrl = `https://${domain}`;
const apiBase = `https://console.vncdn.vn/apiv2/domains/${domain}`;
const waitMs = Number(process.env.PURGE_WAIT_MS || 7000);
const command = process.argv[2] || "help";
const amount = Number(process.argv[3] || 0);

function requireApiKey() {
  if (!apiKey) {
    throw new Error("Thiếu VNCDN_API_KEY. Hãy thêm VNCDN_API_KEY=... vào file .env.");
  }
}

function validateAmount(allowed) {
  if (!allowed.includes(amount)) {
    throw new Error(`Mức hợp lệ cho lệnh này: ${allowed.join(", ")}.`);
  }
}

function groupPaths(group, count) {
  return Array.from(
    { length: count },
    (_, index) => `/cdn-test/${group}/object-${String(index + 1).padStart(4, "0")}.svg`
  );
}

function sleep(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

async function apiRequest(endpoint, body) {
  requireApiKey();
  const startedAt = Date.now();
  const response = await fetch(`${apiBase}/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text.slice(0, 500) };
  }
  console.log(
    `API ${endpoint.toUpperCase()} status=${response.status} duration=${Date.now() - startedAt}ms`
  );
  if (!response.ok) {
    console.error(JSON.stringify(payload, null, 2));
    throw new Error(`${endpoint} bị từ chối với HTTP ${response.status}`);
  }
  return payload;
}

async function warm(paths) {
  // Chunking keeps each warm request small; it does not affect the purge-limit test.
  for (let offset = 0; offset < paths.length; offset += 100) {
    const chunk = paths.slice(offset, offset + 100);
    await apiRequest("warm", { urls: chunk, concurrency: 10, timeout_secs: 120 });
  }
}

async function purgeUrls(paths) {
  return apiRequest("purge", { mode: "url", values: paths });
}

async function purgePrefix(prefix) {
  return apiRequest("purge", { mode: "prefix", values: [prefix] });
}

async function mapConcurrent(items, concurrency, worker) {
  let cursor = 0;
  const results = new Array(items.length);
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

async function inspect(paths, label) {
  const states = await mapConcurrent(paths, 20, async (path) => {
    // Node does not keep a browser HTTP cache, so a plain request measures the CDN directly.
    const response = await fetch(`${baseUrl}${path}`);
    await response.arrayBuffer();
    const xCache = (response.headers.get("x-cache") || "").toUpperCase();
    const age = Number(response.headers.get("age") || 0);
    if (xCache.includes("HIT") || age > 0) return "HIT";
    if (xCache.includes("MISS") || age === 0) return "MISS";
    return "UNKNOWN";
  });
  const summary = states.reduce(
    (result, state) => ({ ...result, [state]: result[state] + 1 }),
    { HIT: 0, MISS: 0, UNKNOWN: 0 }
  );
  console.log(
    `${label}: HIT=${summary.HIT} MISS=${summary.MISS} UNKNOWN=${summary.UNKNOWN} TOTAL=${paths.length}`
  );
  return summary;
}

async function runUrlTest(count) {
  const paths = groupPaths(`url-${count}`, count);
  console.log(`\n[URL TEST] ${count} URL(s)`);
  await warm(paths);
  await sleep(waitMs);
  await inspect(paths, "Trước purge");
  const startedAt = Date.now();
  await purgeUrls(paths);
  console.log(`Purge accepted: values=${paths.length}`);
  await sleep(waitMs);
  const cold = await inspect(paths, "Ngay sau purge");
  await inspect(paths, "Lần truy cập kế tiếp");
  return { count, accepted: true, purgeMs: Date.now() - startedAt, ...cold };
}

async function runPrefixTest(count) {
  const group = `folder-${count}`;
  const prefix = `/cdn-test/${group}/`;
  const paths = groupPaths(group, count);
  console.log(`\n[PREFIX TEST] ${count} cached object(s) under ${prefix}`);
  await warm(paths);
  await sleep(waitMs);
  await inspect(paths, "Trước purge");
  const startedAt = Date.now();
  await purgePrefix(prefix);
  console.log(`Purge accepted: prefix=${prefix} expected_objects=${count}`);
  await sleep(waitMs);
  const cold = await inspect(paths, "Ngay sau purge");
  await inspect(paths, "Lần truy cập kế tiếp");
  return { count, accepted: true, purgeMs: Date.now() - startedAt, ...cold };
}

async function main() {
  if (command === "url") {
    validateAmount([1, 10, 50, 100]);
    await runUrlTest(amount);
    return;
  }
  if (command === "prefix") {
    validateAmount([100, 500, 1000]);
    await runPrefixTest(amount);
    return;
  }
  if (command === "all") {
    requireApiKey();
    const results = [];
    for (const count of [1, 10, 50, 100]) results.push({ mode: "url", ...(await runUrlTest(count)) });
    for (const count of [100, 500, 1000]) results.push({ mode: "prefix", ...(await runPrefixTest(count)) });
    console.log("\nFINAL RESULTS");
    console.table(results);
    return;
  }
  console.log(`Usage:
  node cdn-api-test.js url 1
  node cdn-api-test.js url 10
  node cdn-api-test.js url 50
  node cdn-api-test.js url 100
  node cdn-api-test.js prefix 100
  node cdn-api-test.js prefix 500
  node cdn-api-test.js prefix 1000
  node cdn-api-test.js all`);
}

main().catch((error) => {
  console.error(`TEST FAILED: ${error.message}`);
  process.exitCode = 1;
});
