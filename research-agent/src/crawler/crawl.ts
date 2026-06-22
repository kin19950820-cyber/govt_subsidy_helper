import path from "node:path";
import {
  CRAWL_CONFIG,
  RAW_HTML_DIR,
  EXTRACTED_DIR,
  SEED_URLS,
  PROCESSED_DIR,
} from "../config/sources.js";
import {
  CrawlPageRecord,
  DownloadedFile,
  SourceAuditEntry,
} from "../types.js";
import { politeFetch } from "./fetcher.js";
import { isInternalUrl, parseHtml } from "./htmlExtract.js";
import { isAllowedByRobots } from "./robots.js";
import { downloadDocument } from "./pdfDownload.js";
import { ensureDir, slugifyUrl, writeJson, writeText } from "../util/fs.js";
import { log } from "../util/log.js";

export interface CrawlOutput {
  pages: CrawlPageRecord[];
  downloads: DownloadedFile[];
  audit: SourceAuditEntry[];
}

export async function runCrawl(): Promise<CrawlOutput> {
  ensureDir(RAW_HTML_DIR);
  ensureDir(EXTRACTED_DIR);

  const visited = new Set<string>();
  const queue: { url: string; depth: number }[] = SEED_URLS.map((url) => ({
    url,
    depth: 0,
  }));
  const pages: CrawlPageRecord[] = [];
  const audit: SourceAuditEntry[] = SEED_URLS.map((url) => ({
    url,
    type: "seed",
    status: null,
    fetched_at: null,
    notes: "seed URL",
  }));
  const docTargets = new Map<string, string>(); // docUrl -> foundOnUrl

  while (queue.length > 0 && pages.length < CRAWL_CONFIG.maxPages) {
    const { url, depth } = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    if (!isInternalUrl(url)) continue;
    if (!(await isAllowedByRobots(url))) {
      log.warn("robots.txt 不允許，略過", url);
      audit.push({ url, type: "page", status: null, fetched_at: null, notes: "blocked by robots.txt" });
      continue;
    }

    const res = await politeFetch(url);
    const fetchedAt = new Date().toISOString();
    audit.push({ url, type: "page", status: res.status, fetched_at: fetchedAt, notes: "" });

    if (!res.ok || !res.contentType.includes("html")) {
      pages.push(emptyPage(url, depth, res.status, res.contentType, fetchedAt));
      continue;
    }

    const html = res.buffer.toString("utf8");
    const snapshotPath = path.join(RAW_HTML_DIR, slugifyUrl(url) + ".html");
    writeText(snapshotPath, html);

    const parsed = parseHtml(html, res.url);
    const textPath = path.join(EXTRACTED_DIR, slugifyUrl(url) + ".txt");
    writeText(textPath, parsed.text);

    pages.push({
      url,
      status: res.status,
      content_type: res.contentType,
      title: parsed.title,
      depth,
      fetched_at: fetchedAt,
      html_snapshot_path: path.relative(RAW_HTML_DIR, snapshotPath),
      text_path: path.relative(EXTRACTED_DIR, textPath),
      internal_links: parsed.internalLinks,
      pdf_links: parsed.pdfLinks,
    });

    for (const doc of parsed.pdfLinks) {
      if (!docTargets.has(doc)) docTargets.set(doc, url);
    }

    if (depth < CRAWL_CONFIG.maxDepth) {
      for (const link of parsed.internalLinks) {
        if (!visited.has(link)) queue.push({ url: link, depth: depth + 1 });
      }
    }
  }

  // 下載發現到嘅文件
  const downloads: DownloadedFile[] = [];
  for (const [docUrl, foundOn] of docTargets) {
    if (downloads.length >= CRAWL_CONFIG.maxPages) break;
    if (!(await isAllowedByRobots(docUrl))) continue;
    const meta = await downloadDocument(docUrl, foundOn, null);
    if (meta) {
      downloads.push(meta);
      audit.push({
        url: docUrl,
        type: "pdf",
        status: 200,
        fetched_at: meta.downloaded_at,
        notes: `downloaded (${meta.bytes} bytes)`,
      });
    }
  }

  // 寫低爬蟲產物
  writeJson(path.join(PROCESSED_DIR, "crawl_pages.json"), pages);
  writeJson(path.join(PROCESSED_DIR, "crawl_downloads.json"), downloads);
  writeJson(path.join(PROCESSED_DIR, "crawl_audit.json"), audit);

  log.info(
    `爬蟲完成：${pages.length} 頁、${downloads.length} 份文件、${audit.length} 條審計記錄。`
  );
  return { pages, downloads, audit };
}

function emptyPage(
  url: string,
  depth: number,
  status: number,
  ct: string,
  fetchedAt: string
): CrawlPageRecord {
  return {
    url,
    status,
    content_type: ct,
    title: "",
    depth,
    fetched_at: fetchedAt,
    html_snapshot_path: null,
    text_path: null,
    internal_links: [],
    pdf_links: [],
  };
}
