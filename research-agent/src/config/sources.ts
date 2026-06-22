import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// research-agent/src/config -> repo root
export const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");

export const DATA_DIR = path.join(REPO_ROOT, "data");
export const RAW_DIR = path.join(DATA_DIR, "raw");
export const RAW_HTML_DIR = path.join(RAW_DIR, "html");
export const EXTRACTED_DIR = path.join(DATA_DIR, "extracted");
export const PROCESSED_DIR = path.join(DATA_DIR, "processed");
export const SUPABASE_DIR = path.join(REPO_ROOT, "supabase");

// 只爬官方 WFSFAA 網域（內部連結）。
export const ALLOWED_HOST_SUFFIXES = ["wfsfaa.gov.hk"];

// 官方起始 URL（只用政府官方來源）
export const SEED_URLS = [
  "https://www.wfsfaa.gov.hk/",
  "https://www.wfsfaa.gov.hk/en/sfo/index.htm",
  "https://ess.wfsfaa.gov.hk/",
  "https://www.wfsfaa.gov.hk/en/resources/forms/form.htm",
  "https://www.wfsfaa.gov.hk/en/sfo/primarysecondary/tt/overview.php",
];

// 禮貌爬蟲設定（唔好拖垮政府網站）
export const CRAWL_CONFIG = {
  userAgent:
    "HK-Subsidy-ResearchAgent/0.1 (+non-commercial; official-source crawler; contact: admin@example.com)",
  maxPages: Number(process.env.CRAWL_MAX_PAGES ?? 60),
  maxDepth: Number(process.env.CRAWL_MAX_DEPTH ?? 2),
  // 每個請求之間最少延遲（毫秒），預設 2.5 秒，並發 = 1
  delayMs: Number(process.env.CRAWL_DELAY_MS ?? 2500),
  requestTimeoutMs: 30000,
  maxPdfBytes: 25 * 1024 * 1024,
  respectRobots: process.env.CRAWL_IGNORE_ROBOTS !== "1",
};

// 偵測 scheme 頁面用嘅關鍵字（中英）
export const SCHEME_KEYWORDS = [
  "textbook",
  "travel subsidy",
  "internet access",
  "fee remission",
  "school-related expenses",
  "working family allowance",
  "書簿",
  "車船",
  "上網費",
  "學費減免",
  "就學開支",
  "在職家庭津貼",
  "綜援",
];
