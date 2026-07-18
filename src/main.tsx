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
  // Keep all workbox-* caches (precache + runtime) and our named runtime caches.
  const keep = new Set(["supabase-api", "supabase-storage", "images", "static-assets-v2", "data-files"]);
  const names = await caches.keys();
  await Promise.all(
    names.map(n => {
      if (n.startsWith("workbox-")) return;
      if (keep.has(n)) return;
      return caches.delete(n);
    })
  );
}

if (isPreviewHost || isInIframe) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
  }
} else if ("serviceWorker" in navigator) {
  clearOldCaches();

  async function registerSW() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      console.log("[PWA] Service Worker registrado");

      if (registration.active) {
        toast("App lista para usar sin conexión", { duration: 4000 });
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "activated") {
              toast("App lista para usar sin conexión", { duration: 4000 });
            }
          });
        }
      });

      setTimeout(() => registration.update(), 2000);
      setInterval(() => registration.update().catch(() => {}), 2 * 60 * 1000);
    } catch (err) {
      console.error("[PWA] Error al registrar SW:", err);
    }
  }

  registerSW();

  (window as any).__pwaCheckForUpdates = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
          toast("Nueva versión instalada. Se aplicará al recargar.", { duration: 6000 });
        } else {
          toast("Ya estás en la versión más reciente");
        }
      }
    } catch {
      toast("Error al buscar actualizaciones");
    }
  };
}

createRoot(document.getElementById("root")!).render(<App />);
