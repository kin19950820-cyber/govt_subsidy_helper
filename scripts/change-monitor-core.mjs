// 變更監察核心（純函數，offline，可測）。
// 比對「已記錄的 source contentHash（快照 baseline）」同「目前 canonical 記錄」，
// 標示：新增來源、移除來源、hash 改變。永不自動改動 canonical JSON 或資格規則。
import crypto from "node:crypto";

export function sha256(text) {
  return crypto.createHash("sha256").update(text ?? "", "utf8").digest("hex");
}

// 由 canonical benefits 建立快照：{ [url]: { contentHash, slug, status } }
/**
 * @param {any[]} [benefits]
 * @returns {Record<string, { contentHash: string, slug: string, status: string }>}
 */
export function snapshotFromBenefits(benefits) {
  /** @type {Record<string, { contentHash: string, slug: string, status: string }>} */
  const snap = {};
  for (const b of benefits ?? []) {
    for (const s of b.sources ?? []) {
      if (!s || !s.url) continue;
      snap[s.url] = { contentHash: s.contentHash ?? "", slug: b.slug, status: s.status ?? "" };
    }
  }
  return snap;
}

// diff(baseline, current) → { added[], removed[], changed[] }
// baseline / current 都係 { [url]: { contentHash, ... } }
export function diffSnapshots(baseline = {}, current = {}) {
  const added = [];
  const removed = [];
  const changed = [];
  for (const url of Object.keys(current)) {
    if (!(url in baseline)) {
      added.push({ url, ...current[url] });
    } else if ((baseline[url].contentHash ?? "") !== (current[url].contentHash ?? "")) {
      changed.push({ url, from: baseline[url].contentHash ?? "", to: current[url].contentHash ?? "", slug: current[url].slug });
    }
  }
  for (const url of Object.keys(baseline)) {
    if (!(url in current)) removed.push({ url, ...baseline[url] });
  }
  return { added, removed, changed };
}
