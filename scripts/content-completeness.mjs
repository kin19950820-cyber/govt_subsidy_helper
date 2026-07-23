// 產生內容完整度報告：reports/benefit-content-completeness.{json,md}
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scoreBenefit, CRITICAL_FIELDS } from "./completeness-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "content", "benefits");
const outDir = path.join(root, "reports");
fs.mkdirSync(outDir, { recursive: true });

const rows = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => scoreBenefit(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))))
  .sort((a, b) => a.score - b.score);

const verified = rows.filter((r) => r.status === "verified");
const failing = verified.filter((r) => r.criticalMissing.length > 0);
const avg = Math.round(rows.reduce((n, r) => n + r.score, 0) / (rows.length || 1));

fs.writeFileSync(
  path.join(outDir, "benefit-content-completeness.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), average: avg, rows }, null, 2) + "\n"
);

const md = [];
md.push("# Benefit Content Completeness");
md.push("");
md.push(`Generated: ${new Date().toISOString()} · benefits: ${rows.length} · average score: ${avg}/100`);
md.push("");
md.push(`Critical fields: ${CRITICAL_FIELDS.join(", ")}`);
md.push("");
md.push(`**Verified records failing a critical field: ${failing.length}** ${failing.length ? "(build gate would fail)" : "✓"}`);
md.push("");
md.push("| Score | Status | Slug | Missing critical | Missing recommended |");
md.push("| ---: | --- | --- | --- | --- |");
for (const r of rows) {
  md.push(
    `| ${r.score} | ${r.status}${r.archived ? " · archived" : ""} | ${r.slug} | ${r.criticalMissing.join(", ") || "—"} | ${r.recommendedMissing.join(", ") || "—"} |`
  );
}
md.push("");
fs.writeFileSync(path.join(outDir, "benefit-content-completeness.md"), md.join("\n"));

console.log(
  `Completeness: ${rows.length} benefits · avg ${avg}/100 · ${failing.length} verified failing criticals -> reports/`
);
