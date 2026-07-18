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
  clearOldCaches();
  import("virtual:pwa-register").then(({ registerSW }) => {
    const updateSW = registerSW({
      onOfflineReady() {
        toast("App lista para usar sin conexión", { duration: 4000 });
      },
      onRegisteredSW(_swUrl, registration) {
        if (registration) {
          setTimeout(() => registration.update(), 2000);
          setInterval(() => registration.update().catch(() => {}), 2 * 60 * 1000);
        }
      },
    });
    (window as any).__pwaCheckForUpdates = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
          if (reg.waiting) {
            if (updateSW) updateSW(true);
            toast("Nueva versión instalada. Se aplicará al recargar la página.", { duration: 6000 });
          } else {
            toast("Ya estás en la versión más reciente");
          }
        }
      } catch {
        toast("Error al buscar actualizaciones");
      }
    };
  }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
