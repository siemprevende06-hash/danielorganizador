import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { toast } from "sonner";

let swRegistration: ServiceWorkerRegistration | null = null;
let updateNotified = false;
let lastUpdateCheck = 0;

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
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => {
      swRegistration = registration;

      if (registration.waiting) {
        showUpdateNotification();
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              showUpdateNotification();
            }
          });
        }
      });
    }).catch(() => {});

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && swRegistration && Date.now() - lastUpdateCheck > 600000) {
        lastUpdateCheck = Date.now();
        swRegistration.update().catch(() => {});
      }
    });
  });
}

(window as any).__pwaCheckForUpdates = async () => {
  try {
    if (!swRegistration && "serviceWorker" in navigator) {
      swRegistration = await navigator.serviceWorker.getRegistration();
    }
    if (swRegistration) {
      updateNotified = false;
      lastUpdateCheck = Date.now();
      await swRegistration.update();
      if (!updateNotified) {
        toast("La app está actualizada.", { duration: 2000 });
      }
    } else {
      toast("No hay service worker registrado.", { duration: 2000 });
    }
  } catch {
    toast("Error al buscar actualizaciones.", { duration: 2000 });
  }
};

createRoot(document.getElementById("root")!).render(<App />);
