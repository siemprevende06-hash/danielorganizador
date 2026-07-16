const CACHE_NAME = "supabase-storage";
const CONCURRENCY = 5;

async function cacheSingleImage(url: string): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url);
    if (cached) return;
    const response = await fetch(url, { mode: "cors", cache: "force-cache" });
    if (response.ok) {
      await cache.put(url, response);
    }
  } catch {
    // Silently fail — the SW CacheFirst strategy will still try on next load
  }
}

export async function cacheImageNow(url: string): Promise<void> {
  if (!url) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url);
    if (cached) return;
    const response = await fetch(url, { mode: "cors" });
    if (response.ok) {
      await cache.put(url, response);
    }
  } catch {
    // Silently fail
  }
}

export async function precacheImages(urls: string[]): Promise<void> {
  const valid = urls.filter(Boolean);
  if (valid.length === 0) return;

  const runWhenIdle =
    typeof requestIdleCallback === "function"
      ? requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 0);

  runWhenIdle(async () => {
    for (let i = 0; i < valid.length; i += CONCURRENCY) {
      const batch = valid.slice(i, i + CONCURRENCY);
      await Promise.allSettled(batch.map(cacheSingleImage));
    }
  });
}
