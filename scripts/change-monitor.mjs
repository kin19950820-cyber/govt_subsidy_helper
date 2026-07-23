// 變更監察 → reports/source-change-report.md
//   node scripts/change-monitor.mjs                  (offline：canonical vs baseline 快照)
//   node scripts/change-monitor.mjs --network        (額外抓官網、算 hash、標示官網已改動)
//   node scripts/change-monitor.mjs --write-snapshot (人手：把目前 canonical hash 寫入 baseline)
//
// 永不自動改動 canonical benefit JSON 或資格規則。偵測到變更 → 人手覆核。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { diffSnapshots, snapshotFromBenefits, sha256 } from "./change-monitor-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const benefitsDir = path.join(root, "content", "benefits");
const outDir = path.join(root, "reports");
const snapPath = path.join(root, "research", ".source-snapshot.json");
fs.mkdirSync(outDir, { recursive: true });
const args = new Set(process.argv.slice(2));

const benefits = fs
  .readdirSync(benefitsDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(benefitsDir, f), "utf8")));

const current = snapshotFromBenefits(benefits);
const baseline = fs.existsSync(snapPath) ? JSON.parse(fs.readFileSync(snapPath, "utf8")) : {};

// --write-snapshot：人手把目前 canonical 記錄的 hash 定為 baseline
if (args.has("--write-snapshot")) {
  fs.writeFileSync(snapPath, JSON.stringify(current, null, 2) + "\n");
  console.log(`Wrote baseline snapshot: ${Object.keys(current).length} sources -> research/.source-snapshot.json`);
  process.exit(0);
}

const { added, removed, changed } = diffSnapshots(baseline, current);

// --network：抓官網，比對 live hash vs canonical 記錄的 contentHash
const drift = [];
if (args.has("--network")) {
  for (const url of Object.keys(current)) {
    const recorded = current[url].contentHash;
    try {
      const res = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(20000) });
      const body = await res.text();
      const live = sha256(body);
      if (recorded && live !== recorded)
        drift.push({ url, slug: current[url].slug, status: res.status, live: live.slice(0, 12), recorded: recorded.slice(0, 12) });
      await new Promise((r) => setTimeout(r, 250));
    } catch (e) {
      drift.push({ url, slug: current[url].slug, status: `ERR ${e.name}` });
    }
  }
}

const md = ["# Source Change / Monitor Report", "", `Generated: ${new Date().toISOString()}`, ""];
md.push(
  `Baseline sources: ${Object.keys(baseline).length} · canonical sources: ${Object.keys(current).length} · ` +
    `added: ${added.length} · removed: ${removed.length} · hash-changed: ${changed.length}`
);
md.push("");
md.push(
  "> ⚠️ 變更只作提示，**永不自動更新資格規則或金額**。偵測到變更後，由人手依 " +
    "`docs/RESEARCH_AND_VERIFICATION.md` 覆核官方來源再修改 canonical 記錄。"
);
md.push("");

const section = (title, rows) => {
  md.push(`## ${title} (${rows.length})`);
  if (!rows.length) md.push("- none");
  else for (const r of rows) md.push(`- ${r}`);
  md.push("");
};
section("Added sources (in canonical, not in baseline)", added.map((a) => `\`${a.slug}\` — ${a.url}`));
section("Removed sources (in baseline, no longer in canonical)", removed.map((r) => `\`${r.slug}\` — ${r.url}`));
section(
  "Recorded-hash changed vs baseline",
  changed.map((c) => `\`${c.slug}\` — ${c.url} (${c.from.slice(0, 12) || "∅"} → ${c.to.slice(0, 12) || "∅"})`)
);
if (args.has("--network"))
  section(
    "Live drift (official page differs from recorded contentHash)",
    drift.map((d) => `\`${d.slug}\` — ${d.status} ${d.url}${d.live ? ` (live ${d.live} ≠ recorded ${d.recorded})` : ""}`)
  );

fs.writeFileSync(path.join(outDir, "source-change-report.md"), md.join("\n") + "\n");
console.log(
  `Change monitor: +${added.length} / -${removed.length} / ~${changed.length}` +
    (args.has("--network") ? ` / drift ${drift.length}` : "") +
    ` -> reports/source-change-report.md`
);
