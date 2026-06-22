import path from "node:path";
import { PROCESSED_DIR, SEED_URLS } from "../config/sources.js";
import { SCHEMES } from "../extract/knowledgeBase.js";
import { TERMS } from "../extract/terms.js";
import { DownloadedFile, SourceAuditEntry } from "../types.js";
import { readJson, writeJson } from "../util/fs.js";
import { log } from "../util/log.js";

const LAST_CHECKED = process.env.LAST_CHECKED_AT ?? new Date().toISOString();

export function buildProcessed(): void {
  // ---- schemes.json ----
  writeJson(path.join(PROCESSED_DIR, "schemes.json"), SCHEMES);

  // ---- terms.json ----
  writeJson(path.join(PROCESSED_DIR, "terms.json"), TERMS);

  // ---- documents.json （每個 scheme 所需文件，對應 subsidy_documents） ----
  const documents = SCHEMES.flatMap((s) =>
    s.required_documents.value.map((label, i) => ({
      scheme_code: s.scheme_code,
      seq: i + 1,
      document_label: label,
      required: true,
      confidence: s.required_documents.confidence,
      needs_review: s.required_documents.needs_review,
      source_url: s.required_documents.source_url,
      last_checked_at: s.last_checked_at,
    }))
  );
  writeJson(path.join(PROCESSED_DIR, "documents.json"), documents);

  // ---- forms.json （已下載表格 metadata，對應 subsidy_forms） ----
  const downloaded = readJson<DownloadedFile[]>(
    path.join(PROCESSED_DIR, "crawl_downloads.json"),
    []
  );
  const formsFromCrawl = downloaded.map((d) => ({
    scheme_code: matchSchemeCode(d.source_url, d.found_on_url),
    file_name: d.file_name,
    file_type: d.file_type,
    source_url: d.source_url,
    found_on_url: d.found_on_url,
    academic_year: d.academic_year,
    language: d.language,
    checksum: d.checksum,
    bytes: d.bytes,
    downloaded_at: d.downloaded_at,
    confidence: "high" as const,
    needs_review: d.academic_year == null, // 認唔到學年就要人手檢查
  }));

  // 如果未跑過爬蟲（無下載），用每個 scheme 嘅 form_url 作為待下載指引。
  const formsFallback =
    formsFromCrawl.length > 0
      ? []
      : SCHEMES.map((s) => ({
          scheme_code: s.scheme_code,
          file_name: null,
          file_type: "link",
          source_url: s.form_url.value,
          found_on_url: s.official_page_url.value,
          academic_year: null,
          language: "unknown" as const,
          checksum: null,
          bytes: null,
          downloaded_at: null,
          confidence: s.form_url.confidence,
          needs_review: true,
        }));

  writeJson(path.join(PROCESSED_DIR, "forms.json"), [
    ...formsFromCrawl,
    ...formsFallback,
  ]);

  // ---- source_audit.json （合併爬蟲審計 + 種子 + scheme 來源） ----
  const crawlAudit = readJson<SourceAuditEntry[]>(
    path.join(PROCESSED_DIR, "crawl_audit.json"),
    []
  );
  const schemeAudit: SourceAuditEntry[] = SCHEMES.map((s) => ({
    url: s.official_page_url.value,
    type: "page",
    status: null,
    fetched_at: LAST_CHECKED,
    notes: `scheme source: ${s.scheme_code}`,
  }));
  const seedAudit: SourceAuditEntry[] = SEED_URLS.map((url) => ({
    url,
    type: "seed",
    status: null,
    fetched_at: null,
    notes: "official seed URL",
  }));
  const audit = dedupeAudit([...seedAudit, ...schemeAudit, ...crawlAudit]);
  writeJson(path.join(PROCESSED_DIR, "source_audit.json"), audit);

  log.info(
    `已輸出：schemes(${SCHEMES.length})、terms(${TERMS.length})、documents(${documents.length})、forms(${formsFromCrawl.length + formsFallback.length})、audit(${audit.length}) → ${PROCESSED_DIR}`
  );
}

function matchSchemeCode(...urls: string[]): string | null {
  const hay = urls.join(" ").toLowerCase();
  const map: Record<string, string> = {
    textbook: "TA",
    sts: "STS",
    travel: "STS",
    internet: "IA",
    remission: "KCFRS",
    preprimary: "KCFRS",
    wfa: "WFA",
    "working-family": "WFA",
  };
  for (const [k, code] of Object.entries(map)) if (hay.includes(k)) return code;
  return null;
}

function dedupeAudit(entries: SourceAuditEntry[]): SourceAuditEntry[] {
  const seen = new Map<string, SourceAuditEntry>();
  for (const e of entries) {
    const prev = seen.get(e.url);
    // 保留有 status / fetched_at 嘅版本
    if (!prev || (e.status != null && prev.status == null)) seen.set(e.url, e);
  }
  return [...seen.values()];
}
