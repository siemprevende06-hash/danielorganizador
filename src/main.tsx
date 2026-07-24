import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { toast } from "sonner";

const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.includes("lovableproject-dev.com");

if (!isPreviewHost && !isInIframe && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => {
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              toast("Nueva versión disponible. Recarga para actualizar.", {
                action: {
                  label: "Recargar",
                  onClick: () => window.location.reload(),
                },
                duration: Infinity,
              });
            }
          });
        }
      });
    }).catch(() => {});
  });
}

(window as any).__pwaCheckForUpdates = async () => {
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        toast("Buscando actualizaciones…", { duration: 2000 });
      }
    }
  } catch {
    window.location.reload();
  }
};

createRoot(document.getElementById("root")!).render(<App />);
