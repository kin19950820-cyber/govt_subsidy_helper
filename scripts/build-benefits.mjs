// 由 content/benefits/*.json + content/taxonomy/*.json 匯總成
// src/lib/benefits/benefits.generated.json（App 靜態匯入，構建安全）。
// 新增一項福利：喺 content/benefits/ 加一個 JSON，再執行本script。
//   node scripts/build-benefits.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const benefitsDir = path.join(root, "content", "benefits");
const taxDir = path.join(root, "content", "taxonomy");
const outFile = path.join(root, "src", "lib", "benefits", "benefits.generated.json");

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const categories = readJson(path.join(taxDir, "categories.json"));
const lifeEvents = readJson(path.join(taxDir, "life_events.json"));
const catCodes = new Set(categories.map((c) => c.code));
const leCodes = new Set(lifeEvents.map((e) => e.code));

const files = fs
  .readdirSync(benefitsDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

const benefits = [];
const problems = [];
for (const f of files) {
  const b = readJson(path.join(benefitsDir, f));
  // 基本驗證（唔會靜靜吞錯）
  if (!b.slug) problems.push(`${f}: missing slug`);
  if (b.slug && `${b.slug}.json` !== f) problems.push(`${f}: slug/file mismatch (${b.slug})`);
  if (!catCodes.has(b.categoryCode)) problems.push(`${f}: unknown categoryCode ${b.categoryCode}`);
  for (const le of b.lifeEvents ?? []) {
    if (!leCodes.has(le)) problems.push(`${f}: unknown lifeEvent ${le}`);
  }
  benefits.push(b);
}

if (problems.length) {
  console.error("Benefit content validation failed:\n" + problems.join("\n"));
  process.exit(1);
}

const payload = {
  generatedAt: new Date().toISOString(),
  categories,
  lifeEvents,
  benefits,
};
fs.writeFileSync(outFile, JSON.stringify(payload, null, 2) + "\n", "utf8");
console.log(
  `Built ${benefits.length} benefits, ${categories.length} categories, ${lifeEvents.length} life events -> ${path.relative(root, outFile)}`
);
