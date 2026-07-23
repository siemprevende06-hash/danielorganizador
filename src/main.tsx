import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { toast } from "sonner";

// === Kill-switch: desregistrar cualquier SW previo y limpiar cachés ===
// Esto obliga a que las PWAs instaladas y navegadores con SW antiguo
// obtengan la versión fresca en la próxima carga.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}
if ("caches" in window) {
  caches.keys().then((names) => {
    names.forEach((n) => caches.delete(n));
  });
}

// Registro del SW kill-switch (se auto-desinstala tras limpiar cachés)
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.includes("lovableproject-dev.com");

if (!isPreviewHost && !isInIframe && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  });
}

// Botón "forzar actualización" expuesto globalmente
(window as any).__pwaCheckForUpdates = async () => {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
    toast("Actualizando…", { duration: 1500 });
    setTimeout(() => window.location.reload(), 400);
  } catch {
    window.location.reload();
  }
};

createRoot(document.getElementById("root")!).render(<App />);
