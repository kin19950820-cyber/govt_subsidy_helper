-- =============================================================
-- 香港福利及公共服務平台 — 可擴充資料庫結構
-- 設計目標：容納 300+ 項政府福利而毋須改變結構。
--   * 敘述性欄位用文字欄
--   * 可變 / 可擴充屬性用 JSONB（facets、eligibility、steps、match_rule）
--     → 加新面向 / 新規則只需寫入 JSONB，毋須 ALTER TABLE
--   * 明細用正規化子表（documents / forms / sources / faq / rules / life_events）
-- 與 webapp 現有 public.subsidy_schemes 並存，唔會覆蓋。
-- =============================================================
create extension if not exists "pgcrypto";

-- ---------- 分類 taxonomy ----------
create table if not exists public.benefit_categories (
  code text primary key,
  name_zh text not null,
  name_en text,
  icon text,
  sort int not null default 0,
  active boolean not null default true
);

-- ---------- 人生階段 taxonomy ----------
create table if not exists public.life_events (
  code text primary key,
  name_zh text not null,
  name_en text,
  sort int not null default 0
);

-- ---------- 福利主表 ----------
create table if not exists public.benefits (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_zh text not null,
  name_en text,
  department text,
  category_code text references public.benefit_categories (code),
  purpose text,
  target_beneficiaries text,
  summary text,
  suitable_for text,
  not_suitable_for text,
  eligibility jsonb not null default '[]'::jsonb,      -- string[]
  means_test text,
  residency_requirement text,
  income_requirement text,
  asset_requirement text,
  age_requirement text,
  employment_requirement text,
  student_requirement text,
  application_method text,
  online_url text,
  form_url text,
  guidance_url text,
  faq_url text,
  processing_time text,
  renewal text,
  appeal text,
  contact_phone text,
  contact_email text,
  official_url text,
  source_url text,
  last_updated date,
  status text not null default 'draft',                -- draft | needs_review | verified
  active boolean not null default true,
  audience jsonb not null default '[]'::jsonb,         -- 受惠群組（相容舊 UI）
  steps jsonb not null default '[]'::jsonb,            -- {order,text}[]
  match_rule jsonb not null default '{}'::jsonb,       -- 配對規則
  facets jsonb not null default '{}'::jsonb,           -- 可擴充搜尋面向
  knowledge_doc text,                                  -- knowledge/<file>.md
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists benefits_category_idx on public.benefits (category_code);
create index if not exists benefits_active_idx on public.benefits (active);
create index if not exists benefits_status_idx on public.benefits (status);
create index if not exists benefits_facets_gin on public.benefits using gin (facets);
create index if not exists benefits_eligibility_gin on public.benefits using gin (eligibility);

-- ---------- 福利 ↔ 人生階段（多對多） ----------
create table if not exists public.benefit_life_events (
  benefit_id uuid not null references public.benefits (id) on delete cascade,
  life_event_code text not null references public.life_events (code) on delete cascade,
  primary key (benefit_id, life_event_code)
);
create index if not exists ble_event_idx on public.benefit_life_events (life_event_code);

-- ---------- 所需文件 ----------
create table if not exists public.benefit_documents (
  id uuid primary key default gen_random_uuid(),
  benefit_id uuid not null references public.benefits (id) on delete cascade,
  seq int not null default 0,
  label text not null,
  doc_key text,
  required boolean not null default true,
  note text
);
create index if not exists bdoc_benefit_idx on public.benefit_documents (benefit_id);

-- ---------- 表格 / 下載 ----------
create table if not exists public.benefit_forms (
  id uuid primary key default gen_random_uuid(),
  benefit_id uuid not null references public.benefits (id) on delete cascade,
  name text,
  type text,
  url text not null,
  checksum text,
  note text
);
create index if not exists bform_benefit_idx on public.benefit_forms (benefit_id);

-- ---------- 來源審計 ----------
create table if not exists public.benefit_sources (
  id uuid primary key default gen_random_uuid(),
  benefit_id uuid not null references public.benefits (id) on delete cascade,
  url text not null,
  title text,
  published_date date,
  note text
);
create index if not exists bsrc_benefit_idx on public.benefit_sources (benefit_id);

-- ---------- FAQ ----------
create table if not exists public.benefit_faq (
  id uuid primary key default gen_random_uuid(),
  benefit_id uuid not null references public.benefits (id) on delete cascade,
  seq int not null default 0,
  question text not null,
  answer text not null,
  source_url text
);
create index if not exists bfaq_benefit_idx on public.benefit_faq (benefit_id);

-- ---------- 機讀資格規則 ----------
create table if not exists public.benefit_eligibility_rules (
  id uuid primary key default gen_random_uuid(),
  benefit_id uuid not null references public.benefits (id) on delete cascade,
  seq int not null default 0,
  field text not null,
  operator text not null,
  value jsonb,
  source_url text,
  confidence text,
  needs_review boolean not null default true
);
create index if not exists brule_benefit_idx on public.benefit_eligibility_rules (benefit_id);

-- ---------- 相關福利 ----------
create table if not exists public.benefit_related (
  benefit_id uuid not null references public.benefits (id) on delete cascade,
  related_slug text not null,
  primary key (benefit_id, related_slug)
);

-- ---------- updated_at 觸發器 ----------
create or replace function public.set_updated_at_benefits()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_benefits_updated on public.benefits;
create trigger trg_benefits_updated before update on public.benefits
  for each row execute function public.set_updated_at_benefits();

-- =============================================================
-- Row Level Security
--   * 公眾可讀 active 福利及全部 taxonomy / 明細
--   * 只有 admin（admin_users）可寫
-- =============================================================
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.admin_users a where a.user_id = auth.uid());
$$;

alter table public.benefit_categories        enable row level security;
alter table public.life_events                enable row level security;
alter table public.benefits                   enable row level security;
alter table public.benefit_life_events        enable row level security;
alter table public.benefit_documents          enable row level security;
alter table public.benefit_forms              enable row level security;
alter table public.benefit_sources            enable row level security;
alter table public.benefit_faq                enable row level security;
alter table public.benefit_eligibility_rules  enable row level security;
alter table public.benefit_related            enable row level security;

-- 公開讀 taxonomy
drop policy if exists "read categories" on public.benefit_categories;
create policy "read categories" on public.benefit_categories for select using (true);
drop policy if exists "admin write categories" on public.benefit_categories;
create policy "admin write categories" on public.benefit_categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read life_events" on public.life_events;
create policy "read life_events" on public.life_events for select using (true);
drop policy if exists "admin write life_events" on public.life_events;
create policy "admin write life_events" on public.life_events for all using (public.is_admin()) with check (public.is_admin());

-- benefits：公眾讀 active 或 admin
drop policy if exists "read active benefits" on public.benefits;
create policy "read active benefits" on public.benefits for select using (active = true or public.is_admin());
drop policy if exists "admin write benefits" on public.benefits;
create policy "admin write benefits" on public.benefits for all using (public.is_admin()) with check (public.is_admin());

-- 子表：公開讀，admin 寫（簡化：明細跟隨公開）
do $$
declare t text;
begin
  foreach t in array array[
    'benefit_life_events','benefit_documents','benefit_forms',
    'benefit_sources','benefit_faq','benefit_eligibility_rules','benefit_related'
  ] loop
    execute format('drop policy if exists "read %1$s" on public.%1$s;', t);
    execute format('create policy "read %1$s" on public.%1$s for select using (true);', t);
    execute format('drop policy if exists "admin write %1$s" on public.%1$s;', t);
    execute format('create policy "admin write %1$s" on public.%1$s for all using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end $$;

-- =============================================================
-- 匯入資料：由 content/benefits/*.json 及 content/taxonomy/*.json
-- 產生 seed（未來可由 scripts/build-benefits.mjs 擴充輸出 SQL）。
-- 現階段 App 直接讀 content（毋須 DB 亦可運作）。
-- =============================================================
