-- =============================================================
-- Row Level Security (RLS) 政策
-- 原則：
--   * 使用者只可存取自己嘅 profile / 學生 / 家庭成員 / 草稿
--   * 公眾可讀 active 嘅津貼計劃
--   * 只有 admin（admin_users 內）可以改津貼資料
-- 喺 schema.sql 之後執行。
-- =============================================================

-- 啟用 RLS
alter table public.profiles                 enable row level security;
alter table public.household_members        enable row level security;
alter table public.students                 enable row level security;
alter table public.subsidy_schemes          enable row level security;
alter table public.subsidy_eligibility_rules enable row level security;
alter table public.subsidy_documents        enable row level security;
alter table public.application_drafts       enable row level security;
alter table public.application_draft_fields enable row level security;
alter table public.admin_users              enable row level security;

-- 判斷目前用戶是否 admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = auth.uid()
  );
$$;

-- ---------- profiles ----------
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "own profile upsert" on public.profiles;
create policy "own profile upsert" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own profile delete" on public.profiles;
create policy "own profile delete" on public.profiles
  for delete using (auth.uid() = id);

-- ---------- household_members ----------
drop policy if exists "own members all" on public.household_members;
create policy "own members all" on public.household_members
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- students ----------
drop policy if exists "own students all" on public.students;
create policy "own students all" on public.students
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- application_drafts ----------
drop policy if exists "own drafts all" on public.application_drafts;
create policy "own drafts all" on public.application_drafts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- application_draft_fields（透過 draft 擁有權判斷） ----------
drop policy if exists "own draft fields all" on public.application_draft_fields;
create policy "own draft fields all" on public.application_draft_fields
  for all
  using (
    exists (
      select 1 from public.application_drafts d
      where d.id = draft_id and d.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.application_drafts d
      where d.id = draft_id and d.user_id = auth.uid()
    )
  );

-- ---------- subsidy_schemes ----------
-- 公眾可讀 active；admin 可讀全部
drop policy if exists "public read active schemes" on public.subsidy_schemes;
create policy "public read active schemes" on public.subsidy_schemes
  for select using (active = true or public.is_admin());

-- 只有 admin 可改
drop policy if exists "admin write schemes" on public.subsidy_schemes;
create policy "admin write schemes" on public.subsidy_schemes
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- subsidy_eligibility_rules / subsidy_documents ----------
drop policy if exists "public read rules" on public.subsidy_eligibility_rules;
create policy "public read rules" on public.subsidy_eligibility_rules
  for select using (true);
drop policy if exists "admin write rules" on public.subsidy_eligibility_rules;
create policy "admin write rules" on public.subsidy_eligibility_rules
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read docs" on public.subsidy_documents;
create policy "public read docs" on public.subsidy_documents
  for select using (true);
drop policy if exists "admin write docs" on public.subsidy_documents;
create policy "admin write docs" on public.subsidy_documents
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- admin_users ----------
-- 只有 admin 自己可讀；寫入靠 service role（繞過 RLS）
drop policy if exists "admin read admins" on public.admin_users;
create policy "admin read admins" on public.admin_users
  for select using (public.is_admin());
