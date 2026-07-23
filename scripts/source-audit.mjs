// 來源審計 → reports/source-change-report.md
//   node scripts/source-audit.mjs            (offline，確定性，報告用)
//   node scripts/source-audit.mjs --strict   (有 error 級 issue 即 exit 1)
//   node scripts/source-audit.mjs --network  (額外檢查 HTTP 狀態 / redirect)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditSources, domainOf } from "./source-audit-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "content", "benefits");
const outDir = path.join(root, "reports");
fs.mkdirSync(outDir, { recursive: true });
const args = new Set(process.argv.slice(2));

const allowlist = JSON.parse(
  fs.readFileSync(path.join(root, "content", "taxonomy", "official_domains.json"), "utf8")
).allow;

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
const all = [];
for (const f of files) {
  const b = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  const issues = auditSources(b, { allow: allowlist });
  if (issues.length) all.push({ slug: b.slug, issues });
}

let network = [];
if (args.has("--network")) {
  const urls = new Set();
  for (const f of files) {
    const b = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    [b.officialUrl, b.formUrl, ...(b.sources ?? []).map((s) => s?.url)].filter(Boolean).forEach((u) => urls.add(u));
  }
  for (const u of urls) {
    try {
      const res = await fetch(u, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(20000) });
      if (res.status >= 400 || res.status === 0) network.push({ url: u, status: res.status });
      await new Promise((r) => setTimeout(r, 250));
    } catch (e) {
      network.push({ url: u, status: `ERR ${e.name}` });
    }
  }
}

const errorCount = all.reduce(
  (n, r) => n + r.issues.filter((i) => i.severity === "error").length,
  0
);

const md = ["# Source Change / Audit Report", "", `Generated: ${new Date().toISOString()}`, ""];
md.push(`Allowlist domains: ${allowlist.length} · error-level issues: ${errorCount}`);
md.push("");
if (all.length === 0) md.push("No offline source issues. ✓");
for (const r of all) {
  md.push(`## ${r.slug}`);
  for (const i of r.issues)
    md.push(`- **${i.severity}** ${i.type}${i.url ? ` — ${i.url}` : ""}${i.detail ? ` (${i.detail})` : ""}`);
  md.push("");
}
if (args.has("--network")) {
  md.push("## Network check");
  md.push(network.length ? network.map((n) => `- ${n.status} ${n.url}`).join("\n") : "- all reachable ✓");
}
fs.writeFileSync(path.join(outDir, "source-change-report.md"), md.join("\n") + "\n");
console.log(`Source audit: ${errorCount} error issues, ${all.length} benefits flagged -> reports/source-change-report.md`);

if (args.has("--strict") && errorCount > 0) process.exit(1);
