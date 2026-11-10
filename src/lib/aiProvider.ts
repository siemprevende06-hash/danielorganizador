import { useEffect, useState } from "react";

/**
 * Proveedor de IA preferido por el usuario.
 *
 * `openrouter` es el comportamiento histórico (modelos gratuitos de OpenRouter
 * y pasarela de Lovable). `deepseek` intenta primero OpenCode Console y, si no
 * está disponible, las Edge Functions caen solas al proveedor anterior.
 */
export type AIProvider = "openrouter" | "deepseek";

export const AI_PROVIDER_LABEL: Record<AIProvider, string> = {
  openrouter: "OpenRouter",
  deepseek: "DeepSeek",
};

const STORAGE_KEY = "ai-provider:v1";
const EVENT = "ai-provider-change";

export function getAIProvider(): AIProvider {
  try {
    return localStorage.getItem(STORAGE_KEY) === "deepseek" ? "deepseek" : "openrouter";
  } catch {
    return "openrouter";
  }
}

export function setAIProvider(provider: AIProvider) {
  try {
    localStorage.setItem(STORAGE_KEY, provider);
  } catch {
    /* almacenamiento no disponible */
  }
  try {
    window.dispatchEvent(new CustomEvent<AIProvider>(EVENT, { detail: provider }));
  } catch {
    /* noop */
  }
}

/** Estado reactivo del proveedor, sincronizado entre pestañas y componentes. */
export function useAIProvider(): [AIProvider, (provider: AIProvider) => void] {
  const [provider, setProvider] = useState<AIProvider>(() => getAIProvider());

  useEffect(() => {
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<AIProvider>).detail;
      if (detail === "deepseek" || detail === "openrouter") {
        setProvider(detail);
        return;
      }
      setProvider(getAIProvider());
    };
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return [provider, setAIProvider];
}
