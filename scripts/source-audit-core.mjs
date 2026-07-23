// 確定性（offline）來源審計核心，供 source-audit 腳本同 tests 共用。
export const ERROR_ISSUES = ["non_https", "malformed_url", "unexpected_domain", "duplicate_source"];

export function domainOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function isAllowedDomain(host, allow) {
  if (!host) return false;
  return allow.some((d) => host === d || host.endsWith(`.${d}`));
}

function collectUrls(b) {
  const out = [];
  if (b.officialUrl) out.push({ url: b.officialUrl, where: "officialUrl" });
  if (b.formUrl) out.push({ url: b.formUrl, where: "formUrl" });
  for (const s of b.sources ?? []) if (s && s.url) out.push({ url: s.url, where: "sources" });
  for (const f of b.forms ?? []) if (f && f.url) out.push({ url: f.url, where: "forms" });
  return out;
}

// 回傳 issues：{ type, severity, url?, where?, detail }
/**
 * @param {any} b
 * @param {{ allow?: string[], staleDays?: number, now?: number }} [opts]
 */
export function auditSources(b, { allow = [], staleDays = 365, now = Date.now() } = {}) {
  const issues = [];
  const seen = new Set();
  for (const { url, where } of collectUrls(b)) {
    if (!/^https:\/\//i.test(url)) issues.push({ type: "non_https", severity: "error", url, where });
    const host = domainOf(url);
    if (!host) issues.push({ type: "malformed_url", severity: "error", url, where });
    else if (!isAllowedDomain(host, allow))
      issues.push({ type: "unexpected_domain", severity: "error", url, where, detail: host });
    if (seen.has(url)) issues.push({ type: "duplicate_source", severity: "warn", url, where });
    seen.add(url);
  }
  const staleMs = staleDays * 86400000;
  if (b.lastUpdated && now - Date.parse(b.lastUpdated) > staleMs)
    issues.push({ type: "stale_verification", severity: "warn", detail: b.lastUpdated });
  for (const s of b.sources ?? []) {
    if (s && s.lastCheckedAt && now - Date.parse(s.lastCheckedAt) > staleMs)
      issues.push({ type: "stale_source", severity: "warn", url: s.url });
    if (s && s.url && !s.sourceType)
      issues.push({ type: "missing_source_type", severity: "warn", url: s.url });
  }
  return issues;
}
