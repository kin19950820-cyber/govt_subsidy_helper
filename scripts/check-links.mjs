// 官方連結 / 申請表 URL 可達性檢查（standalone，需網絡）。
//   node scripts/check-links.mjs
// 收集每項福利嘅 officialUrl / formUrl / sources[].url / forms[].url，
// 逐一 HTTP 檢查，並列出非 2xx/3xx（可能失效）嘅連結。
// 有失效連結時以非零 exit code 結束，方便 CI（可設為可選 job）。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "content", "benefits");

const targets = new Map(); // url -> Set(benefit slug)
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const b = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  const urls = [
    b.officialUrl,
    b.formUrl,
    ...(b.sources ?? []).map((s) => s.url),
    ...(b.forms ?? []).map((x) => x.url),
  ].filter(Boolean);
  for (const u of urls) {
    if (!targets.has(u)) targets.set(u, new Set());
    targets.get(u).add(b.slug);
  }
}

const UA =
  "HK-Benefits-LinkChecker/1.0 (+non-commercial; official-source link check)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function check(url) {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(25000),
    });
    return res.status;
  } catch (e) {
    return `ERR ${e.name}`;
  }
}

const bad = [];
let n = 0;
for (const [url, slugs] of targets) {
  const status = await check(url);
  const ok = typeof status === "number" && status >= 200 && status < 400;
  // Cloudflare-gated 官方站可能回 403（瀏覽器可開）— 視為警告
  const warn = status === 403;
  const tag = ok ? "OK " : warn ? "WRN" : "BAD";
  console.log(`${tag} ${status}  ${url}  [${[...slugs].join(", ")}]`);
  if (!ok && !warn) bad.push({ url, status, slugs: [...slugs] });
  n++;
  await sleep(300); // 禮貌
}

console.log(`\nChecked ${n} URLs · ${bad.length} broken · ${targets.size} unique`);
if (bad.length) {
  console.error("Broken links:\n" + bad.map((b) => `  ${b.status} ${b.url}`).join("\n"));
  process.exit(1);
}
