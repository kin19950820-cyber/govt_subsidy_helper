import { CRAWL_CONFIG } from "../config/sources.js";
import { log } from "../util/log.js";

// 極簡 robots.txt 解析：抽取適用於 * / 我哋 UA 嘅 Disallow 規則。
interface RobotsRules {
  disallow: string[];
  crawlDelaySec: number | null;
}

const cache = new Map<string, RobotsRules>();

async function loadRobots(origin: string): Promise<RobotsRules> {
  if (cache.has(origin)) return cache.get(origin)!;
  const rules: RobotsRules = { disallow: [], crawlDelaySec: null };
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { "User-Agent": CRAWL_CONFIG.userAgent },
      signal: AbortSignal.timeout(CRAWL_CONFIG.requestTimeoutMs),
    });
    if (res.ok) {
      const text = await res.text();
      parseRobots(text, rules);
    }
  } catch (e) {
    log.warn(`robots.txt 讀取失敗 ${origin}:`, (e as Error).message);
  }
  cache.set(origin, rules);
  return rules;
}

function parseRobots(text: string, rules: RobotsRules): void {
  let applies = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const [keyRaw, ...rest] = line.split(":");
    const key = keyRaw.trim().toLowerCase();
    const val = rest.join(":").trim();
    if (key === "user-agent") {
      applies = val === "*" || CRAWL_CONFIG.userAgent.toLowerCase().includes(val.toLowerCase());
    } else if (applies && key === "disallow" && val) {
      rules.disallow.push(val);
    } else if (applies && key === "crawl-delay" && val) {
      const n = Number(val);
      if (!Number.isNaN(n)) rules.crawlDelaySec = n;
    }
  }
}

export async function isAllowedByRobots(url: string): Promise<boolean> {
  if (!CRAWL_CONFIG.respectRobots) return true;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  const rules = await loadRobots(u.origin);
  return !rules.disallow.some((p) => p !== "/" && u.pathname.startsWith(p));
}

export async function robotsCrawlDelayMs(origin: string): Promise<number | null> {
  const rules = await loadRobots(origin);
  return rules.crawlDelaySec != null ? rules.crawlDelaySec * 1000 : null;
}
