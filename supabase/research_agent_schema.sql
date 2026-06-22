-- =============================================================
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
