// 由 content/benefits/*.json + content/taxonomy/*.json 產生 supabase/benefits_seed.sql
// （去正規化 public.benefits + taxonomy + benefit_life_events）。
//   node scripts/emit-benefits-sql.mjs
// 先執行 supabase/benefits_schema.sql，再匯入本輸出。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bdir = path.join(root, "content", "benefits");
const tdir = path.join(root, "content", "taxonomy");
const out = path.join(root, "supabase", "benefits_seed.sql");
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const s = (v) => (v == null || v === "" ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const j = (v) => (v == null ? "'[]'::jsonb" : `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`);
const jo = (v) => (v == null ? "'{}'::jsonb" : `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`);
const b = (v) => (v ? "true" : "false");

const categories = readJson(path.join(tdir, "categories.json"));
const lifeEvents = readJson(path.join(tdir, "life_events.json"));
const files = fs.readdirSync(bdir).filter((f) => f.endsWith(".json")).sort();

const lines = [];
lines.push("-- =============================================================");
lines.push("-- 由 content/ 產生嘅 public.benefits 種子（Batch B）");
lines.push("-- 先執行 supabase/benefits_schema.sql，再執行本檔。");
lines.push(`-- generated_at: ${new Date().toISOString()} · benefits: ${files.length}`);
lines.push("-- =============================================================");
lines.push("");

lines.push("-- taxonomy");
for (const c of categories)
  lines.push(
    `insert into public.benefit_categories (code, name_zh, name_en, icon, sort) values (${s(c.code)}, ${s(c.name_zh)}, ${s(c.name_en)}, ${s(c.icon)}, ${c.sort ?? 0}) on conflict (code) do nothing;`
  );
for (const e of lifeEvents)
  lines.push(
    `insert into public.life_events (code, name_zh, name_en, sort) values (${s(e.code)}, ${s(e.name_zh)}, ${s(e.name_en)}, ${e.sort ?? 0}) on conflict (code) do nothing;`
  );
lines.push("");

lines.push("-- benefits (denormalized authoritative rows)");
for (const f of files) {
  const x = readJson(path.join(bdir, f));
  const cols = [
    s(x.id), s(x.slug), s(x.nameZh), s(x.nameEn), s(x.department), s(x.categoryCode),
    s(x.purpose), s(x.targetBeneficiaries), s(x.summary), s(x.suitableFor), s(x.notSuitableFor),
    j(x.eligibility), s(x.meansTest), s(x.residencyRequirement), s(x.incomeRequirement),
    s(x.assetRequirement), s(x.ageRequirement), s(x.employmentRequirement), s(x.studentRequirement),
    s(x.applicationMethod), s(x.onlineUrl), s(x.formUrl), s(x.guidanceUrl), s(x.faqUrl),
    s(x.processingTime), s(x.renewal), s(x.appeal), s(x.contactPhone), s(x.contactEmail),
    s(x.officialUrl), s(x.sourceUrl), s(x.lastUpdated), s(x.status ?? "needs_review"), b(x.active),
    s(x.disclaimer), j(x.audience), j(x.steps), j(x.documents), j(x.forms), j(x.sources),
    j(x.faq), j(x.rules), j(x.relatedSlugs), j(x.lifeEvents), jo(x.matchRule), jo(x.facets),
    s(x.knowledgeDoc),
  ].join(", ");
  lines.push(
    "insert into public.benefits (id, slug, name_zh, name_en, department, category_code, purpose, target_beneficiaries, summary, suitable_for, not_suitable_for, eligibility, means_test, residency_requirement, income_requirement, asset_requirement, age_requirement, employment_requirement, student_requirement, application_method, online_url, form_url, guidance_url, faq_url, processing_time, renewal, appeal, contact_phone, contact_email, official_url, source_url, last_updated, status, active, disclaimer, audience, steps, documents, forms, sources, faq, rules, related_slugs, life_events, match_rule, facets, knowledge_doc) values (" +
      cols +
      ") on conflict (id) do nothing;"
  );
  for (const le of x.lifeEvents ?? [])
    lines.push(
      `insert into public.benefit_life_events (benefit_id, life_event_code) values (${s(x.id)}, ${s(le)}) on conflict do nothing;`
    );
}
lines.push("");

fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
console.log(`Wrote ${path.relative(root, out)} · ${files.length} benefits`);
