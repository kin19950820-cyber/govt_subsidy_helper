import fs from "node:fs";
import path from "node:path";
import { EXTRACTED_DIR, RAW_DIR, CRAWL_CONFIG } from "../config/sources.js";
import { DownloadedFile, Language } from "../types.js";
import { politeFetch } from "./fetcher.js";
import { sha256 } from "../util/hash.js";
import { ensureDir, slugifyUrl, writeText } from "../util/fs.js";
import { log } from "../util/log.js";

function extOf(url: string): string {
  const m = url.toLowerCase().match(/\.(pdf|docx?|xlsx?)(\?|#|$)/);
  return m ? m[1].replace(/x?$/, (s) => s) : "unknown";
}

function guessAcademicYear(text: string, url: string): string | null {
  const m = (text + " " + url).match(/(20\d{2})\s*[\/\-–]\s*(20)?(\d{2})/);
  if (!m) return null;
  const start = m[1];
  const end = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${start}/${end}`;
}

function guessLanguage(text: string): Language {
  const hasZh = /[一-鿿]/.test(text);
  const hasEn = /[a-zA-Z]{4,}/.test(text);
  if (hasZh && hasEn) return "bilingual";
  if (hasZh) return "zh";
  if (hasEn) return "en";
  return "unknown";
}

let pdfParseFn: ((b: Buffer) => Promise<{ text: string }>) | null = null;
async function getPdfParse() {
  if (pdfParseFn) return pdfParseFn;
  // 直接 import lib 檔，避免 pdf-parse index.js 嘅 debug 自動讀檔行為。
  const mod: any = await import("pdf-parse/lib/pdf-parse.js");
  pdfParseFn = (mod.default ?? mod) as (b: Buffer) => Promise<{ text: string }>;
  return pdfParseFn;
}

export async function downloadDocument(
  url: string,
  foundOnUrl: string,
  schemeName: string | null
): Promise<DownloadedFile | null> {
  const res = await politeFetch(url);
  if (!res.ok || res.buffer.length === 0) {
    log.warn(`下載失敗 ${url} status=${res.status}`);
    return null;
  }
  if (res.buffer.length > CRAWL_CONFIG.maxPdfBytes) {
    log.warn(`檔案過大，略過 ${url}`);
    return null;
  }

  const ext = extOf(url);
  const fileName = slugifyUrl(url).replace(/__/g, "_");
  const savedPath = path.join(RAW_DIR, fileName);
  ensureDir(path.dirname(savedPath));
  fs.writeFileSync(savedPath, res.buffer);

  let textForGuess = "";
  if (ext === "pdf") {
    try {
      const parse = await getPdfParse();
      const parsed = await parse(res.buffer);
      textForGuess = parsed.text ?? "";
      const textPath = path.join(EXTRACTED_DIR, fileName + ".txt");
      writeText(textPath, textForGuess);
    } catch (e) {
      log.warn(`PDF 文字抽取失敗 ${url}:`, (e as Error).message);
    }
  }

  return {
    file_name: fileName,
    file_type: ext,
    source_url: url,
    found_on_url: foundOnUrl,
    downloaded_at: new Date().toISOString(),
    scheme_name: schemeName,
    academic_year: guessAcademicYear(textForGuess, url),
    language: guessLanguage(textForGuess || url),
    checksum: sha256(res.buffer),
    bytes: res.buffer.length,
    saved_path: path.relative(RAW_DIR, savedPath),
  };
}
