import { precacheAndRoute, cleanupOutdatedCaches, matchPrecache } from 'workbox-precaching';
import { registerRoute, NavigationRoute, setCatchHandler } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

setCatchHandler(async ({ event }) => {
  if (event.request.mode === 'navigate') {
    const cached = (await matchPrecache('/index.html')) || (await matchPrecache('/'));
    if (cached) return cached;
    return new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
  return Response.error();
});

registerRoute(
  new NavigationRoute(
    new NetworkFirst({ cacheName: 'pages' })
  )
);

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || self.registration.scope || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus().catch(() => null);
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'PRECACHE_PHOTOS') {
    const urls = event.data.urls || [];
    event.waitUntil(
      (async () => {
        const cache = await caches.open('supabase-storage');
        await Promise.allSettled(
          urls.map(async (url) => {
            try {
              let response = await fetch(url, { mode: 'cors' });
              if (!response.ok && response.type === 'opaque') {
                response = await fetch(url, { mode: 'no-cors' });
              }
              if (response.ok || response.type === 'opaque') {
                await cache.put(url, response.clone());
              }
            } catch {
              try {
                const response = await fetch(url, { mode: 'no-cors' });
                await cache.put(url, response.clone());
              } catch {}
            }
          })
        );
      })()
    );
  }
});

registerRoute(
  /^https:\/\/fuqmrtenzlslkeqgdjwy\.supabase\.co\/rest\/v1\/.*/i,
  new NetworkFirst({
    cacheName: 'supabase-api',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 7 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new BackgroundSyncPlugin('supabase-sync', { maxRetentionTime: 24 * 60 }),
    ],
  }),
  'GET'
);

registerRoute(
  /^https:\/\/fuqmrtenzlslkeqgdjwy\.supabase\.co\/storage\/v1\/.*/i,
  new CacheFirst({
    cacheName: 'supabase-storage',
    plugins: [
      new ExpirationPlugin({ maxEntries: 5000, maxAgeSeconds: 365 * 10 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
  'GET'
);

registerRoute(
  /^https:\/\/fuqmrtenzlslkeqgdjwy\.supabase\.co\/auth\/.*/i,
  new NetworkOnly(),
  'GET'
);

registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico|avif)$/i,
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 90 * 24 * 60 * 60 }),
    ],
  }),
  'GET'
);

registerRoute(
  /\.(?:js|css|woff2?|ttf|otf|eot)$/i,
  new StaleWhileRevalidate({
    cacheName: 'static-assets-v2',
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  }),
  'GET'
);

registerRoute(
  /\.(?:json|xml)$/i,
  new StaleWhileRevalidate({
    cacheName: 'data-files',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  }),
  'GET'
);
