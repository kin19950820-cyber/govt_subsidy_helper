import path from "node:path";
import { PROCESSED_DIR, SUPABASE_DIR } from "../config/sources.js";
import { SCHEMES } from "../extract/knowledgeBase.js";
import { TERMS } from "../extract/terms.js";
import { DownloadedFile, ExtractedScheme, SourceAuditEntry } from "../types.js";
import { readJson, writeText } from "../util/fs.js";
import { log } from "../util/log.js";

// SQL 值 helper
const s = (v: string | null | undefined) =>
  v == null ? "null" : `'${v.replace(/'/g, "''")}'`;
const j = (v: unknown) =>
  v == null ? "null" : `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const b = (v: boolean | null | undefined) => (v == null ? "null" : v ? "true" : "false");
const n = (v: number | null | undefined) => (v == null ? "null" : String(v));
const ts = (v: string | null | undefined) => (v == null ? "null" : s(v));

// 將每個欄位嘅 confidence/needs_review/source_url 收集成 field_meta jsonb（對應任務 #9）
function fieldMeta(sc: ExtractedScheme): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(sc)) {
    if (val && typeof val === "object" && "confidence" in (val as object) && "source_url" in (val as object)) {
      const fv = val as { confidence: string; needs_review: boolean; source_url: string };
      meta[k] = {
        confidence: fv.confidence,
        needs_review: fv.needs_review,
        source_url: fv.source_url,
      };
    }
  }
  return meta;
}

export function buildSeedSql(): void {
  writeText(path.join(SUPABASE_DIR, "research_agent_schema.sql"), SCHEMA_SQL);

  const documents = readJson<any[]>(path.join(PROCESSED_DIR, "documents.json"), []);
  const forms = readJson<any[]>(path.join(PROCESSED_DIR, "forms.json"), []);
  const audit = readJson<SourceAuditEntry[]>(
    path.join(PROCESSED_DIR, "source_audit.json"),
    []
  );

  const lines: string[] = [];
  lines.push("-- =============================================================");
  lines.push("-- 研究代理產生：官方來源學生津貼種子資料 (research-agent generated)");
  lines.push("-- 目標 schema: research（與 webapp 的 public 表分開，避免覆蓋）");
  lines.push("-- 先執行 supabase/research_agent_schema.sql，再執行本檔。");
  lines.push(`-- generated_at: ${new Date().toISOString()}`);
  lines.push("-- =============================================================");
  lines.push("set search_path = research, public;");
  lines.push("");

  // subsidy_schemes
  lines.push("-- ---------- subsidy_schemes ----------");
  for (const sc of SCHEMES) {
    lines.push(
      `insert into research.subsidy_schemes (scheme_code, name_zh, name_en, responsible_department, target_applicants, education_level, eligibility_criteria, means_test_requirement, residency_requirement, student_status_requirement, household_requirement, application_period, application_method, required_documents, submission_channel, approval_timeline, payment_arrangement, enquiry_phone, enquiry_email, official_page_url, form_url, notes, child_friendly, field_meta, last_checked_at) values (`
    );
    lines.push(
      [
        s(sc.scheme_code),
        s(sc.name_zh.value),
        s(sc.name_en.value),
        s(sc.responsible_department.value),
        s(sc.target_applicants.value),
        j(sc.education_level.value),
        j(sc.eligibility_criteria.value),
        s(sc.means_test_requirement.value),
        s(sc.residency_requirement.value),
        s(sc.student_status_requirement.value),
        s(sc.household_requirement.value),
        s(sc.application_period.value),
        s(sc.application_method.value),
        j(sc.required_documents.value),
        s(sc.submission_channel.value),
        s(sc.approval_timeline.value),
        s(sc.payment_arrangement.value),
        s(sc.enquiry_phone.value),
        s(sc.enquiry_email.value),
        s(sc.official_page_url.value),
        s(sc.form_url.value),
        j(sc.notes.value),
        j(sc.child_friendly),
        j(fieldMeta(sc)),
        ts(sc.last_checked_at),
      ].join(", ")
    );
    lines.push(") on conflict (scheme_code) do nothing;");
    lines.push("");
  }

  // subsidy_eligibility_rules
  lines.push("-- ---------- subsidy_eligibility_rules ----------");
  for (const sc of SCHEMES) {
    sc.rule_set.rules.forEach((r, i) => {
      lines.push(
        `insert into research.subsidy_eligibility_rules (scheme_code, seq, field, operator, value, source_url, confidence, needs_review) values (${[
          s(sc.scheme_code),
          n(i + 1),
          s(r.field),
          s(r.operator),
          j(r.value),
          s(r.source_url),
          s(r.confidence),
          b(r.needs_review),
        ].join(", ")}) on conflict (scheme_code, seq) do nothing;`
      );
    });
  }
  lines.push("");

  // subsidy_documents
  lines.push("-- ---------- subsidy_documents ----------");
  for (const d of documents) {
    lines.push(
      `insert into research.subsidy_documents (scheme_code, seq, document_label, required, confidence, needs_review, source_url, last_checked_at) values (${[
        s(d.scheme_code),
        n(d.seq),
        s(d.document_label),
        b(d.required),
        s(d.confidence),
        b(d.needs_review),
        s(d.source_url),
        ts(d.last_checked_at),
      ].join(", ")}) on conflict (scheme_code, seq) do nothing;`
    );
  }
  lines.push("");

  // subsidy_terms
  lines.push("-- ---------- subsidy_terms ----------");
  for (const t of TERMS) {
    lines.push(
      `insert into research.subsidy_terms (term_en, term_zh, simple_explanation_zh, source_url, last_checked_at) values (${[
        s(t.term_en),
        s(t.term_zh),
        s(t.simple_explanation_zh),
        s(t.source_url),
        ts(t.last_checked_at),
      ].join(", ")}) on conflict (term_en) do nothing;`
    );
  }
  lines.push("");

  // subsidy_forms
  lines.push("-- ---------- subsidy_forms ----------");
  for (const fm of forms) {
    lines.push(
      `insert into research.subsidy_forms (scheme_code, file_name, file_type, source_url, found_on_url, academic_year, language, checksum, bytes, downloaded_at, confidence, needs_review) values (${[
        s(fm.scheme_code ?? ""),
        s(fm.file_name),
        s(fm.file_type),
        s(fm.source_url),
        s(fm.found_on_url),
        s(fm.academic_year),
        s(fm.language),
        s(fm.checksum),
        n(fm.bytes),
        ts(fm.downloaded_at),
        s(fm.confidence),
        b(fm.needs_review),
      ].join(", ")}) on conflict (scheme_code, source_url) do nothing;`
    );
  }
  lines.push("");

  // subsidy_source_audit
  lines.push("-- ---------- subsidy_source_audit ----------");
  for (const a of audit) {
    lines.push(
      `insert into research.subsidy_source_audit (url, type, status, fetched_at, notes) values (${[
        s(a.url),
        s(a.type),
        n(a.status),
        ts(a.fetched_at),
        s(a.notes),
      ].join(", ")}) on conflict (url) do nothing;`
    );
  }
  lines.push("");

  writeText(path.join(SUPABASE_DIR, "seed_subsidy_schemes.sql"), lines.join("\n") + "\n");
  log.info(`已產生 SQL → supabase/research_agent_schema.sql、supabase/seed_subsidy_schemes.sql`);
}

const SCHEMA_SQL = `-- =============================================================
-- 研究代理資料表（research schema）
-- 與 webapp 的 public.* 表分開，避免覆蓋現有正式資料。
-- 喺 Supabase SQL Editor 執行本檔，再執行 seed_subsidy_schemes.sql。
-- =============================================================
create schema if not exists research;
create extension if not exists "pgcrypto";

create table if not exists research.subsidy_schemes (
  scheme_code text primary key,
  name_zh text,
  name_en text,
  responsible_department text,
  target_applicants text,
  education_level jsonb not null default '[]'::jsonb,
  eligibility_criteria jsonb not null default '[]'::jsonb,
  means_test_requirement text,
  residency_requirement text,
  student_status_requirement text,
  household_requirement text,
  application_period text,
  application_method text,
  required_documents jsonb not null default '[]'::jsonb,
  submission_channel text,
  approval_timeline text,
  payment_arrangement text,
  enquiry_phone text,
  enquiry_email text,
  official_page_url text,
  form_url text,
  notes jsonb not null default '[]'::jsonb,
  child_friendly jsonb not null default '{}'::jsonb,
  field_meta jsonb not null default '{}'::jsonb,   -- 每欄 confidence/needs_review/source_url
  last_checked_at timestamptz
);

create table if not exists research.subsidy_eligibility_rules (
  scheme_code text not null references research.subsidy_schemes (scheme_code) on delete cascade,
  seq int not null,
  field text not null,
  operator text not null,
  value jsonb,
  source_url text,
  confidence text,
  needs_review boolean not null default true,
  primary key (scheme_code, seq)
);

create table if not exists research.subsidy_documents (
  scheme_code text not null references research.subsidy_schemes (scheme_code) on delete cascade,
  seq int not null,
  document_label text not null,
  required boolean not null default true,
  confidence text,
  needs_review boolean not null default true,
  source_url text,
  last_checked_at timestamptz,
  primary key (scheme_code, seq)
);

create table if not exists research.subsidy_terms (
  term_en text primary key,
  term_zh text,
  simple_explanation_zh text,
  source_url text,
  last_checked_at timestamptz
);

create table if not exists research.subsidy_forms (
  id uuid primary key default gen_random_uuid(),
  scheme_code text not null default '',
  file_name text,
  file_type text,
  source_url text not null,
  found_on_url text,
  academic_year text,
  language text,
  checksum text,
  bytes bigint,
  downloaded_at timestamptz,
  confidence text,
  needs_review boolean not null default true,
  unique (scheme_code, source_url)
);

create table if not exists research.subsidy_source_audit (
  url text primary key,
  type text,
  status int,
  fetched_at timestamptz,
  notes text
);
`;
