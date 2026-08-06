import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { toast } from "sonner";

let swRegistration: ServiceWorkerRegistration | null = null;
let updateNotified = false;
let lastUpdateCheck = 0;
let alreadyHandlingController = false;

const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.includes("lovableproject-dev.com");

function showUpdateNotification() {
  if (updateNotified) return;
  updateNotified = true;
  toast("Nueva versión disponible. Recarga para actualizar.", {
    action: {
      label: "Recargar",
      onClick: () => window.location.reload(),
    },
    duration: Infinity,
  });
}

if (!isPreviewHost && !isInIframe && "serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (alreadyHandlingController) return;
    alreadyHandlingController = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => {
      swRegistration = registration;

      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        }
      });
    }).catch(() => {});

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && swRegistration && Date.now() - lastUpdateCheck > 60000) {
        lastUpdateCheck = Date.now();
        swRegistration.update().catch(() => {});
      }
    });
  });
}

(window as any).__pwaCheckForUpdates = async () => {
  try {
    const reg = swRegistration || ("serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null);
    if (!reg) {
      toast("No hay service worker registrado.", { duration: 2000 });
      return;
    }
    if (!navigator.onLine) {
      toast("Sin conexión a internet. Conéctate para buscar actualizaciones.", { duration: 3000 });
      return;
    }
    updateNotified = false;
    lastUpdateCheck = Date.now();
    await reg.update();
    if (!updateNotified) {
      toast("La app está actualizada.", { duration: 2000 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    toast(`Error al buscar actualizaciones: ${msg}`, { duration: 5000 });
  }
};

createRoot(document.getElementById("root")!).render(<App />);
