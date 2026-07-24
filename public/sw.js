import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
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

registerRoute(
  new NavigationRoute(
    new NetworkFirst({ cacheName: 'pages' })
  )
);

registerRoute(
  /^https:\/\/qqskvbfofqrruqeyjbuy\.supabase\.co\/rest\/v1\/.*/i,
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
  /^https:\/\/qqskvbfofqrruqeyjbuy\.supabase\.co\/storage\/v1\/.*/i,
  new CacheFirst({
    cacheName: 'supabase-storage',
    plugins: [
      new ExpirationPlugin({ maxEntries: 2000, maxAgeSeconds: 90 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
  'GET'
);

registerRoute(
  /^https:\/\/qqskvbfofqrruqeyjbuy\.supabase\.co\/auth\/.*/i,
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
