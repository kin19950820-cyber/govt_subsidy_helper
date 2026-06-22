import * as cheerio from "cheerio";
import { ALLOWED_HOST_SUFFIXES } from "../config/sources.js";

export interface ParsedHtml {
  title: string;
  text: string;
  internalLinks: string[];
  pdfLinks: string[];
}

export function isInternalUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return ALLOWED_HOST_SUFFIXES.some(
      (suf) => host === suf || host.endsWith(`.${suf}`)
    );
  } catch {
    return false;
  }
}

const DOC_EXT = /\.(pdf|docx?|xlsx?)(\?|#|$)/i;

export function parseHtml(html: string, baseUrl: string): ParsedHtml {
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim();

  // 抽純文字（去 script/style/nav noise）
  $("script, style, noscript").remove();
  const text = $("body")
    .text()
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();

  const internal = new Set<string>();
  const pdfs = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    let abs: string;
    try {
      abs = new URL(href, baseUrl).toString().split("#")[0];
    } catch {
      return;
    }
    if (!isInternalUrl(abs)) return;
    if (DOC_EXT.test(abs)) pdfs.add(abs);
    else internal.add(abs);
  });

  return {
    title,
    text,
    internalLinks: [...internal],
    pdfLinks: [...pdfs],
  };
}
