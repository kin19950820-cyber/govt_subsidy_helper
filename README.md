# 學生津貼小助手 · HK Student Subsidy Helper

幫香港低收入家庭快速搵到學生相關津貼、了解資格、準備文件，並整理預填申請草稿。

> ⚠️ 本應用只供參考及整理資料，**並非政府官方網站**，亦**不代表政府已批准任何申請**。最終批核以相關政府部門為準。

## 技術架構

- **Next.js (App Router)** + **TypeScript**
- **Tailwind CSS**（行動優先、長者 / 家長友善 UI）
- **Supabase**（Postgres + Auth + Row Level Security）
- 部署：**Vercel**

主要語言為**繁體中文**，用字淺白，適合家長、照顧者及長者。

## 功能

1. **津貼配對問卷** `/finder` → `/results`：答幾條問題，按信心分為「很可能適合 / 可能適合 / 未必適合 / 建議查詢社工」。
2. **津貼詳情頁** `/schemes`、`/schemes/[id]`：說明、適合 / 不適合、資格、文件、步驟、官方連結、查詢電話、最後更新日期、免責聲明。
3. **兒童友善申請步驟**：每個津貼用最簡單嘅句子拆解步驟。
4. **文件清單產生器** `/checklist`：按所揀津貼合併成一張清單，並顯示每份文件對應邊個津貼。
5. **個人資料** `/profile`：用 Supabase Auth + RLS 安全儲存；未登入 / 未設定時暫存於本機裝置。身份證預設只存部分。
6. **預填申請助手** `/drafts`、`/drafts/[id]`：將個人資料對應到表格欄位 → 檢查頁 → 可編輯 → 匯出 JSON（PDF 架構已預留）。**不會自動提交、不會代簽**。
7. **管理後台 CMS** `/admin/schemes`、`/admin/schemes/[id]`：新增 / 編輯 / 刪除津貼、規則、連結、文件、步驟、啟用狀態、最後核實日期。

## 本機啟動

```bash
npm install
cp .env.local.example .env.local   # 填入 Supabase 資料（可先留空試玩）
npm run dev
```

開啟 http://localhost:3000 。

> 未設定 Supabase 時，App 會自動使用內建靜態津貼資料（同 `supabase/seed.sql` 一致），個人資料及草稿則暫存於瀏覽器，方便即時試用。

## 設定 Supabase

1. 喺 [supabase.com](https://supabase.com) 建立新 Project（**請勿覆蓋現有正式專案**）。
2. 喺 **SQL Editor** 依次執行：
   1. `supabase/schema.sql`（建表 + 觸發器）
   2. `supabase/rls.sql`（Row Level Security 政策）
   3. `supabase/seed.sql`（6 個津貼種子資料）
3. 喺 **Project Settings → API** 取得：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`（**只限伺服器、切勿外洩**）
4. 將以上值填入 `.env.local`。
5. （可選）啟用 **Email** 登入（Auth → Providers → Email，開啟 magic link）。

### 設定管理員

1. 先用 App `/profile` 嘅電郵登入流程登入一次。
2. 喺 Supabase **Auth → Users** 搵返你嘅 `User UID`。
3. 喺 SQL Editor 執行：
   ```sql
   insert into public.admin_users (user_id, email)
   values ('你的-user-uuid', 'you@example.com');
   ```
4. 之後 `/admin/schemes` 即可新增 / 編輯津貼。

## 部署到 Vercel

1. 將 repo push 上 GitHub。
2. 喺 [vercel.com](https://vercel.com) **Import Project**，揀呢個 repo。
3. 喺 **Environment Variables** 加入：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy。Next.js 會自動偵測，無需額外設定。

## 資料安全

- 所有使用者資料（profile / 學生 / 家庭成員 / 草稿）受 **RLS** 保護，**用戶只可存取自己嘅資料**。
- 公眾只可讀 `active` 嘅津貼；**只有 admin** 可修改津貼。
- 身份證號碼預設只儲存遮蔽後嘅部分（後 4 位）。
- `service_role` key 只喺伺服器端（admin API route）使用，永不外露俾瀏覽器。

## 專案結構

```
src/
  app/
    page.tsx                 首頁
    finder/                  津貼配對問卷
    results/                 配對結果
    schemes/ schemes/[id]/   津貼列表 / 詳情
    checklist/               文件清單
    profile/                 個人資料（Auth + RLS）
    drafts/ drafts/[id]/     申請草稿 / 預填
    admin/schemes/...        管理後台 CMS
    api/schemes/             公開津貼 API
    api/admin/schemes/...    admin CRUD API（service role + 權限檢查）
  components/                共用 UI
  lib/
    types.ts                 共用型別
    matching.ts              配對邏輯
    schemes-data.ts          靜態種子（fallback）
    schemes.ts               津貼讀取（Supabase / fallback）
    prefill.ts               預填欄位對應
    profile-store.ts         個人資料存取（Supabase / local）
    drafts-store.ts          草稿存取（Supabase / local）
    supabase/                client / server / admin / config
supabase/
  schema.sql  rls.sql  seed.sql
```

## 重要原則

- 唔會聲稱保證合資格 —— 配對結果只係參考。
- 唔會自動提交申請，亦唔會代用戶簽名。
- 每個津貼都清楚顯示**官方連結**，鼓勵用戶以官方最新資料為準。
