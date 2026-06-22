# HK Subsidy Research Agent · 官方來源研究代理

獨立於主 webapp 嘅研究模組。由香港政府**官方來源**（WFSFAA / 學生資助處 / 社署綜援頁）讀取資料、下載表格 PDF、抽取申請要求，並轉成結構化資料供 webapp 使用。

## 重要原則

- **只用政府官方來源**（WFSFAA、SFO、SFO E-link、社署綜援）。**不使用** blog、討論區或非官方摘要。
- 每個抽取出嚟嘅事實都帶 `source_url` + `last_checked_at`。
- 唔確定嘅資料標記 `needs_review: true`，並附 `confidence`（high / medium / low）。
- **唔會聲稱保證合資格** —— 配對規則只係參考。
- 禮貌爬蟲：遵守 `robots.txt`、請求之間有延遲、串行（並發 = 1），唔好拖垮政府網站。

## 設計（誠實說明）

爬蟲會即時下載官方頁面同表格 PDF 作為**證據**（存 `/data/raw`、`/data/extracted`，並寫 `crawl_audit.json` 記錄每條 URL）。

至於每個計劃嘅**結構化要求**（資格、文件、申請方法等），則由 `src/extract/knowledgeBase.ts` 內**根據官方來源整理**嘅知識庫提供，並逐欄標上 `confidence` / `needs_review` / `source_url`：

- 結構性、長期穩定嘅事實（計劃名稱、教育階段、是否需入息審查）→ `high`
- 每年會變嘅數字（入息上限、津貼金額、申請日期）→ **唔寫死**，標 `needs_review: true`，留待人手核實

咁樣可以避免由政府 HTML 自動抽取造成嘅錯誤，同時保留官方表格 PDF 作為可追溯證據。

## 安裝

```bash
cd research-agent
npm install
```

需要 Node 18+（用到全域 `fetch`）。

## 點樣執行爬蟲

```bash
# 1) 爬官方頁面 + 下載表格 PDF（禮貌、限量）
npm run crawl

# 2) 由知識庫 + 爬蟲結果產生結構化資料同 SQL
npm run build

# 或者一次過
npm run all
```

可用環境變數控制爬蟲（預設已經好保守）：

| 變數 | 預設 | 說明 |
| --- | --- | --- |
| `CRAWL_MAX_PAGES` | 60 | 最多爬幾多頁 / 下載幾多份文件 |
| `CRAWL_MAX_DEPTH` | 2 | 由起始 URL 起最大連結深度 |
| `CRAWL_DELAY_MS` | 2500 | 每個請求之間最少延遲（毫秒） |
| `CRAWL_IGNORE_ROBOTS` | （未設） | 設 `1` 先會忽略 robots.txt（不建議） |
| `LAST_CHECKED_AT` | 當前時間 | 覆寫 `last_checked_at`，方便產生可重現嘅輸出 |

例：`CRAWL_MAX_PAGES=10 CRAWL_MAX_DEPTH=1 npm run crawl`

## 輸出檔案

```
data/
  raw/                 原始下載（HTML 快照 + PDF；git 忽略，可重新產生）
  raw/html/            HTML 快照
  extracted/           抽取出嚟嘅純文字（HTML 文字 + PDF 文字；git 忽略）
  processed/
    schemes.json       7 個計劃，逐欄帶 confidence/needs_review/source_url
    documents.json     每個計劃所需文件（→ subsidy_documents）
    terms.json         詞彙表（→ subsidy_terms）
    forms.json         已下載表格 metadata（→ subsidy_forms）
    source_audit.json  來源審計（→ subsidy_source_audit）
    crawl_pages.json   爬過嘅頁面記錄
    crawl_downloads.json 下載檔案 metadata（含 checksum）
    crawl_audit.json   每條 URL 嘅抓取記錄
supabase/
  research_agent_schema.sql   research schema 6 張表
  seed_subsidy_schemes.sql    研究代理產生嘅 seed（insert ... on conflict do nothing）
```

## 資料庫匯入 Supabase

研究代理嘅資料放喺獨立嘅 **`research` schema**，**唔會覆蓋** webapp 嘅 `public.*` 表。

喺 Supabase **SQL Editor** 依次執行：

1. `supabase/research_agent_schema.sql` — 建立 `research` schema 及 6 張表：
   - `research.subsidy_schemes`
   - `research.subsidy_eligibility_rules`
   - `research.subsidy_documents`
   - `research.subsidy_terms`
   - `research.subsidy_forms`
   - `research.subsidy_source_audit`
2. `supabase/seed_subsidy_schemes.sql` — 匯入資料。

每張表都保留 `source_url`、`last_checked_at`、`confidence`、`needs_review`（schemes 表用 `field_meta` jsonb 逐欄記錄）方便審核。

## 點樣加入新官方 URL

編輯 `src/config/sources.ts`：

- `SEED_URLS` — 加入新嘅官方起始 URL。
- `ALLOWED_HOST_SUFFIXES` — 只會跟內部連結；如需新官方網域（例如 `swd.gov.hk`）喺度加。
- `SCHEME_KEYWORDS` — 偵測計劃頁面用嘅關鍵字。

新計劃嘅結構化資料喺 `src/extract/knowledgeBase.ts` 加一個 `ExtractedScheme`，記得逐欄用 `f(value, confidence, source_url)` 標來源，規則用 `rule(...)`。

## 點樣刷新官方資料

```bash
npm run all              # 重新爬 + 重新產生
```

然後將 `supabase/seed_subsidy_schemes.sql` 再匯入（`on conflict do nothing`，唔會覆蓋已有列；要更新可先 `truncate research.subsidy_schemes cascade` 再匯入）。每次刷新都會更新 `last_checked_at`。

## 點樣審核低信心欄位（needs_review）

所有 `confidence` 為 `medium` / `low` 嘅欄位都自動 `needs_review: true`。快速找出要核實嘅項目：

```bash
# 列出所有 needs_review 嘅 scheme 欄位
node -e "const s=require('../data/processed/schemes.json'); for(const x of s){for(const[k,v]of Object.entries(x)){if(v&&v.needs_review)console.log(x.scheme_code,k,'→',v.source_url)}}"
```

匯入 Supabase 後亦可用 SQL：

```sql
select scheme_code, key, value->>'source_url' as source_url
from research.subsidy_schemes,
     lateral jsonb_each(field_meta) as t(key, value)
where (value->>'needs_review')::boolean = true;
```

核實後，將正確數字填返 `knowledgeBase.ts`、把 `confidence` 升做 `high`，再 `npm run build`。

## 與主 webapp 嘅關係

主 webapp（repo 根目錄）用自己嘅 `public.*` 表運作。研究代理係**獨立**模組，產出官方來源資料；webapp 可選擇由 `research.*` 表讀取，或由 admin 將已核實資料複製過去 `public.subsidy_schemes`。兩者刻意分開，避免覆蓋正式資料。
