// 簡單全域節流：保證每次請求之間最少等 minDelayMs，並發 = 1。
let lastAt = 0;
let chain: Promise<void> = Promise.resolve();

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// 串行化所有請求，並喺請求之間插入延遲。
export function throttle<T>(minDelayMs: number, fn: () => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const wait = lastAt + minDelayMs - Date.now();
    if (wait > 0) await sleep(wait);
    lastAt = Date.now();
  });
  chain = run.catch(() => undefined);
  return run.then(fn);
}
