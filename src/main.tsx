import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// === Registro del Service Worker (PWA) ===
// Solo en producción Y fuera del preview de Lovable / iframes,
// para no romper el editor.
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
  // Limpiar SWs previos en preview/iframe para evitar caché obsoleta
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
  }
} else if ("serviceWorker" in navigator && import.meta.env.PROD) {
  // Registro real: import dinámico de virtual:pwa-register para no afectar dev
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        // Revisión periódica de actualizaciones (cada hora)
        if (registration) {
          setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);
        }
      },
      onOfflineReady() {
        console.log("[PWA] App lista para usar offline");
      },
    });
  }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
