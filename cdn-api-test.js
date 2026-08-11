const fs = require("fs");
const readline = require("readline");

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
const concurrency = Number(process.env.CDN_TEST_CONCURRENCY || 40);
const measureTimeoutMs = Number(process.env.PURGE_MEASURE_TIMEOUT_MS || 120000);
const pollIntervalMs = Number(process.env.PURGE_POLL_INTERVAL_MS || 500);
const command = process.argv[2] || "help";
const amount = Number(process.argv[3] || 0);

function requireApiKey() {
  if (!apiKey) {
    throw new Error("Thiếu VNCDN_API_KEY. Hãy thêm VNCDN_API_KEY=... vào file .env.");
  }
}

function validateAmount() {
  if (!Number.isInteger(amount) || amount < 1 || amount > 10000) {
    throw new Error("Số lượng phải là số nguyên trong khoảng 1-10000.");
  }
}

function groupPaths(group, count) {
  return Array.from(
    { length: count },
    (_, index) => `/cdn-test/${group}/object-${String(index + 1).padStart(5, "0")}.svg`
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
    if (response.status === 405) {
      console.error(
        "Endpoint hiện không nhận POST. Dùng measure-manual-prefix/measure-manual-url để đo qua dashboard."
      );
    }
    throw new Error(`${endpoint} bị từ chối với HTTP ${response.status}`);
  }
  return payload;
}

function waitForEnter(message) {
  if (!process.stdin.isTTY) {
    throw new Error("Chế độ manual cần chạy trong terminal tương tác.");
  }
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => terminal.question(message, () => {
    terminal.close();
    resolve();
  }));
}

async function warm(paths) {
  // Warm through the public CDN because this provider currently returns 405 for /warm.
  const fetchOne = async (path) => {
    const response = await fetch(`${baseUrl}${path}`);
    await response.arrayBuffer();
    if (!response.ok) throw new Error(`Warm lỗi HTTP ${response.status}: ${path}`);
  };
  await mapConcurrent(paths, concurrency, fetchOne);
  await mapConcurrent(paths, concurrency, fetchOne);
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
  const states = await mapConcurrent(paths, concurrency, inspectPath);
  const summary = states.reduce(
    (result, state) => ({ ...result, [state]: result[state] + 1 }),
    { HIT: 0, MISS: 0, UNKNOWN: 0 }
  );
  console.log(
    `${label}: HIT=${summary.HIT} MISS=${summary.MISS} UNKNOWN=${summary.UNKNOWN} TOTAL=${paths.length}`
  );
  return summary;
}

async function inspectPath(path) {
  // Node does not keep a browser HTTP cache, so this measures the CDN directly.
  const response = await fetch(`${baseUrl}${path}`);
  await response.arrayBuffer();
  const xCache = (response.headers.get("x-cache") || "").toUpperCase();
  const ageHeader = response.headers.get("age");
  const age = ageHeader === null ? null : Number(ageHeader);
  if (xCache.includes("HIT") || age > 0) return "HIT";
  if (xCache.includes("MISS") || age === 0) return "MISS";
  return "UNKNOWN";
}

async function waitUntilPurged(paths, startedAt) {
  let pending = paths.slice();
  let observedMiss = 0;
  let rounds = 0;
  while (pending.length && Date.now() - startedAt < measureTimeoutMs) {
    rounds += 1;
    const states = await mapConcurrent(pending, concurrency, inspectPath);
    const nextPending = [];
    states.forEach((state, index) => {
      if (state === "MISS") observedMiss += 1;
      else nextPending.push(pending[index]);
    });
    pending = nextPending;
    console.log(
      `Lần đo ${rounds}: MISS=${observedMiss}/${paths.length}, còn chờ=${pending.length}, elapsed=${Date.now() - startedAt}ms`
    );
    if (pending.length) await sleep(pollIntervalMs);
  }
  return { observedMiss, pending: pending.length, rounds };
}

async function measurePurge(paths, purge, label) {
  console.log(`\n[MEASURE] ${label} — ${paths.length} object(s)`);
  console.log(`Concurrency=${concurrency}; domain=${domain}`);
  const warmStarted = Date.now();
  await warm(paths);
  console.log(`Warm hoàn tất sau ${Date.now() - warmStarted}ms`);
  const before = await inspect(paths, "Trước purge");
  if (before.HIT !== paths.length) {
    throw new Error(`Trạng thái đầu vào chưa warm đủ: HIT=${before.HIT}/${paths.length}`);
  }

  const purgeStarted = Date.now();
  await purge();
  const apiAcceptedMs = Date.now() - purgeStarted;
  const observation = await waitUntilPurged(paths, purgeStarted);
  const observedMs = Date.now() - purgeStarted;
  const success = observation.pending === 0;
  const result = {
    mode: label,
    objects: paths.length,
    apiAcceptedMs,
    observedMs,
    miss: observation.observedMiss,
    pending: observation.pending,
    rounds: observation.rounds,
    success,
  };
  console.log("\nKẾT QUẢ ĐO");
  console.table([result]);
  console.log(
    success
      ? `Purge toàn bộ được xác nhận trong <= ${observedMs}ms (API phản hồi ${apiAcceptedMs}ms).`
      : `Hết ${measureTimeoutMs}ms nhưng mới quan sát MISS=${observation.observedMiss}/${paths.length}.`
  );
  process.exitCode = success ? 0 : 2;
  return result;
}

async function measureManual(paths, label, purgeInstruction) {
  console.log(`\n[MANUAL MEASURE] ${label} — ${paths.length} object(s)`);
  console.log(`Domain khóa cứng: ${domain}`);
  const warmStarted = Date.now();
  await warm(paths);
  console.log(`Warm hoàn tất sau ${Date.now() - warmStarted}ms`);
  const before = await inspect(paths, "Trước purge");
  if (before.HIT !== paths.length) {
    throw new Error(`Trạng thái đầu vào chưa warm đủ: HIT=${before.HIT}/${paths.length}`);
  }
  console.log(`\nChuẩn bị trên dashboard: ${purgeInstruction}`);
  await waitForEnter("Khi con trỏ đã đặt trên nút Purge, nhấn Enter tại đây rồi bấm Purge ngay: ");
  const purgeStarted = Date.now();
  process.stdout.write("\x07");
  console.log("ĐANG ĐO — hãy bấm Purge trên dashboard ngay bây giờ.");
  const observation = await waitUntilPurged(paths, purgeStarted);
  const observedMs = Date.now() - purgeStarted;
  const success = observation.pending === 0;
  console.log("\nKẾT QUẢ ĐO THỦ CÔNG");
  console.table([{
    mode: label,
    objects: paths.length,
    observedMs,
    observedSeconds: (observedMs / 1000).toFixed(2),
    miss: observation.observedMiss,
    pending: observation.pending,
    rounds: observation.rounds,
    success,
  }]);
  console.log("Lưu ý: observedMs gồm độ trễ thao tác bấm nút và thời gian quét xác minh toàn bộ object.");
  process.exitCode = success ? 0 : 2;
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
    validateAmount();
    await runUrlTest(amount);
    return;
  }
  if (command === "prefix") {
    validateAmount();
    await runPrefixTest(amount);
    return;
  }
  if (command === "measure-url") {
    validateAmount();
    const paths = groupPaths(`url-${amount}`, amount);
    await measurePurge(paths, () => purgeUrls(paths), "url");
    return;
  }
  if (command === "measure-prefix") {
    validateAmount();
    const group = `folder-${amount}`;
    const paths = groupPaths(group, amount);
    await measurePurge(paths, () => purgePrefix(`/cdn-test/${group}/`), "prefix");
    return;
  }
  if (command === "measure-manual-url") {
    validateAmount();
    const paths = groupPaths(`url-${amount}`, amount);
    await measureManual(
      paths,
      "url/manual",
      `By URL — dán danh sách từ lệnh ./cdn-purge-test.sh urls ${amount}`
    );
    return;
  }
  if (command === "measure-manual-prefix") {
    validateAmount();
    const group = `folder-${amount}`;
    const paths = groupPaths(group, amount);
    await measureManual(paths, "prefix/manual", `By Prefix — /cdn-test/${group}/`);
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
  node cdn-api-test.js measure-url 100
  node cdn-api-test.js measure-prefix 10000
  node cdn-api-test.js measure-manual-url 100
  node cdn-api-test.js measure-manual-prefix 10000
  node cdn-api-test.js all`);
}

main().catch((error) => {
  console.error(`TEST FAILED: ${error.message}`);
  process.exitCode = 1;
});
