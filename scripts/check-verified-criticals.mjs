// Build gate：任何 status=verified 且未封存嘅福利若缺 critical 欄位 → 失敗。
// needs_review 記錄唔會令 build 失敗（但會喺報告清楚列出）。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scoreBenefit } from "./completeness-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "content", "benefits");

const failing = [];
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const b = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  if (b.status !== "verified" || b.archived === true) continue;
  const s = scoreBenefit(b);
  if (s.criticalMissing.length > 0) failing.push({ slug: b.slug, missing: s.criticalMissing });
}

if (failing.length > 0) {
  console.error("✖ Verified benefits missing critical fields (must fix or downgrade status):");
  for (const f of failing) console.error(`  - ${f.slug}: ${f.missing.join(", ")}`);
  process.exit(1);
}
console.log("✓ All verified benefits pass critical-field completeness.");
