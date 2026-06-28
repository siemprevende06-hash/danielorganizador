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

if (isPreviewHost || isInIframe) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
  }
} else if ("serviceWorker" in navigator) {
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        const autoReload = setTimeout(() => window.location.reload(), 30_000);
        toast("Nueva versión disponible", {
          description: "Actualizando automáticamente en 30 segundos...",
          duration: Infinity,
          action: {
            label: "Actualizar ahora",
            onClick: () => {
              clearTimeout(autoReload);
              window.location.reload();
            },
          },
        });
      },
      onOfflineReady() {
        console.log("[PWA] App lista para usar offline");
      },
      onRegisteredSW(_swUrl, registration) {
        if (registration) {
          setInterval(() => registration.update().catch(() => {}), 5 * 60 * 1000);
        }
      },
    });
  }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
