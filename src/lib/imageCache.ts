const CACHE_NAME = "supabase-storage";
const CONCURRENCY = 5;

async function fetchAndCache(url: string): Promise<boolean> {
  try {
    const cache = await caches.open(CACHE_NAME);
    let response = await fetch(url, { mode: "cors" });
    if (!response.ok && response.type === "opaque") {
      response = await fetch(url, { mode: "no-cors" });
    }
    if (response.ok || response.type === "opaque") {
      await cache.put(url, response.clone());
      return true;
    }
  } catch {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await fetch(url, { mode: "no-cors" });
      await cache.put(url, response.clone());
      return true;
    } catch {}
  }
  return false;
}

export async function cacheImageNow(url: string): Promise<void> {
  if (!url) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url);
    if (cached) return;
    await fetchAndCache(url);
  } catch {
    // Silently fail
  }
}

export async function precacheImages(urls: string[]): Promise<void> {
  const valid = urls.filter(Boolean);
  if (valid.length === 0) return;

  for (let i = 0; i < valid.length; i += CONCURRENCY) {
    const batch = valid.slice(i, i + CONCURRENCY);
    await Promise.allSettled(batch.map(fetchAndCache));
  }
}
