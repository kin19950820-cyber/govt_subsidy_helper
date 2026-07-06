-- =============================================================
-- 學生津貼小助手 — 資料庫結構 (schema)
-- 喺 Supabase SQL Editor 依次執行：
--   1) schema.sql
--   2) rls.sql
--   3) seed.sql
-- =============================================================

create extension if not exists "pgcrypto";

-- ---------- 使用者個人資料 ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  applicant_name text,
  id_number_partial text,          -- 只儲存部分身份證（例如後 4 位）
  phone text,
  address text,
  school_name text,
  bank_account text,               -- 選填，敏感資料
  income_band text,                -- below_10k / 10k_20k / ...
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 家庭成員 ----------
create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  relationship text,
  created_at timestamptz not null default now()
);
create index if not exists household_members_user_idx
  on public.household_members (user_id);

-- ---------- 學生 ----------
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  grade_level text not null,        -- kindergarten / primary / secondary / tertiary
  school_name text,
  created_at timestamptz not null default now()
);
create index if not exists students_user_idx on public.students (user_id);

-- ---------- 津貼計劃（denormalized，方便讀取） ----------
create table if not exists public.subsidy_schemes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_zh text not null,
  name_en text,
  category text,
  audience jsonb not null default '[]'::jsonb,       -- AudienceGroup[]
  summary text,
  suitable_for text,
  not_suitable_for text,
  eligibility jsonb not null default '[]'::jsonb,   -- string[]
  documents jsonb not null default '[]'::jsonb,     -- DocumentKey[]
  steps jsonb not null default '[]'::jsonb,         -- {order,text}[]
  official_url text,
  form_url text,
  department text,
  phone text,
  last_verified date,
  disclaimer text,
  rule jsonb not null default '{}'::jsonb,           -- EligibilityRule
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subsidy_schemes_active_idx
  on public.subsidy_schemes (active);

-- ---------- 配對規則（normalized，可選用） ----------
-- App 預設讀 subsidy_schemes.rule (jsonb)；呢個表方便日後做更細緻嘅規則管理。
create table if not exists public.subsidy_eligibility_rules (
  id uuid primary key default gen_random_uuid(),
  scheme_id uuid not null references public.subsidy_schemes (id) on delete cascade,
  rule_key text not null,           -- 例如 max_income_band / grade_levels
  rule_value jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists eligibility_rules_scheme_idx
  on public.subsidy_eligibility_rules (scheme_id);

-- ---------- 所需文件（normalized，可選用） ----------
create table if not exists public.subsidy_documents (
  id uuid primary key default gen_random_uuid(),
  scheme_id uuid not null references public.subsidy_schemes (id) on delete cascade,
  document_key text not null,       -- applicant_id / student_id / ...
  required boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists subsidy_documents_scheme_idx
  on public.subsidy_documents (scheme_id);

-- ---------- 申請草稿 ----------
create table if not exists public.application_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scheme_id uuid references public.subsidy_schemes (id) on delete set null,
  scheme_name_zh text,
  status text not null default 'draft',   -- draft / reviewed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists application_drafts_user_idx
  on public.application_drafts (user_id);

-- ---------- 草稿欄位 ----------
create table if not exists public.application_draft_fields (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.application_drafts (id) on delete cascade,
  field_key text not null,
  field_label text,
  field_value text,
  created_at timestamptz not null default now()
);
create index if not exists draft_fields_draft_idx
  on public.application_draft_fields (draft_id);

-- ---------- 管理員 ----------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

-- ---------- auto update updated_at ----------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_schemes_updated on public.subsidy_schemes;
create trigger trg_schemes_updated before update on public.subsidy_schemes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_drafts_updated on public.application_drafts;
create trigger trg_drafts_updated before update on public.application_drafts
  for each row execute function public.set_updated_at();
