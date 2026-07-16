import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { toast } from "sonner";

// === Registro del Service Worker (PWA) ===
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  (window.location.hostname.includes("lovable.app") && window.location.hostname.startsWith("id-preview"));

async function clearOldCaches() {
  if (!("caches" in window)) return;
  const expectedCaches = ["supabase-api", "supabase-storage", "images", "static-assets-v2", "data-files", "workbox-precache-v2"];
  const names = await caches.keys();
  await Promise.all(names.map(n => { if (!expectedCaches.includes(n)) return caches.delete(n); }));
}

if (isPreviewHost || isInIframe) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
  }
} else if ("serviceWorker" in navigator) {
  // If there's a waiting service worker, activate it via reload (once per session)
  if (!sessionStorage.getItem('pwa_updated')) {
    navigator.serviceWorker.getRegistrations().then(rs => {
      if (rs.some(r => r.waiting)) {
        sessionStorage.setItem('pwa_updated', '1');
        window.location.reload();
      }
    });
  }
  clearOldCaches();
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onNeedRefresh(updateSW) {
        const reloadNow = () => {
          if (updateSW) updateSW(true);
          setTimeout(() => window.location.reload(), 300);
        };
        toast("Nueva versión disponible", {
          description: "Actualizando...",
          duration: 3000,
          action: { label: "Ok", onClick: reloadNow },
        });
        reloadNow();
      },
      onOfflineReady() {
        console.log("[PWA] App lista para usar offline");
      },
      onRegisteredSW(_swUrl, registration) {
        if (registration) {
          setTimeout(() => registration.update(), 2000);
          setInterval(() => registration.update().catch(() => {}), 2 * 60 * 1000);
        }
      },
    });
  }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
