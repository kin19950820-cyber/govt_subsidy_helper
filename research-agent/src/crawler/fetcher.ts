import { CRAWL_CONFIG } from "../config/sources.js";
import { throttle } from "./rateLimiter.js";
import { log } from "../util/log.js";

export interface FetchResult {
  ok: boolean;
  status: number;
  contentType: string;
  buffer: Buffer;
  url: string; // 最終 URL（跟過 redirect）
}

// 經節流器 + 重試嘅 fetch。記錄所有下載 URL。
export async function politeFetch(
  url: string,
  attempt = 1
): Promise<FetchResult> {
  return throttle(CRAWL_CONFIG.delayMs, async () => {
    log.url("GET", url);
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": CRAWL_CONFIG.userAgent,
          Accept: "text/html,application/pdf,*/*",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(CRAWL_CONFIG.requestTimeoutMs),
      });
      const arrayBuf = await res.arrayBuffer();
      return {
        ok: res.ok,
        status: res.status,
        contentType: res.headers.get("content-type") ?? "",
        buffer: Buffer.from(arrayBuf),
        url: res.url || url,
      };
    } catch (e) {
      if (attempt < 3) {
        const backoff = 1000 * 2 ** attempt;
        log.warn(`fetch 失敗 (試 ${attempt})，${backoff}ms 後重試：`, (e as Error).message);
        await new Promise((r) => setTimeout(r, backoff));
        return politeFetch(url, attempt + 1);
      }
      log.error(`fetch 放棄 ${url}:`, (e as Error).message);
      return { ok: false, status: 0, contentType: "", buffer: Buffer.alloc(0), url };
    }
  });
}
