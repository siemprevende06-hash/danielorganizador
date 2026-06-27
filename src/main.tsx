import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// === Registro del Service Worker (PWA) ===
// Se registra en producción y desarrollo, excepto en preview de Lovable / iframes.
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
  window.location.hostname.includes("lovable.app") && window.location.hostname.startsWith("id-preview");

if (isPreviewHost || isInIframe) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
  }
} else if ("serviceWorker" in navigator) {
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        if (confirm("Nueva versión disponible. ¿Actualizar?")) {
          window.location.reload();
        }
      },
      onOfflineReady() {
        console.log("[PWA] App lista para usar offline");
      },
      onRegisteredSW(_swUrl, registration) {
        if (registration) {
          setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);
        }
      },
    });
  }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
