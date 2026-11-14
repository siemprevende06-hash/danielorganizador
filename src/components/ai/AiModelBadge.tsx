import { Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

/** Motor de IA que respondió de verdad (no la preferencia del usuario). */
export interface AiEngine {
  provider: string;
  model: string;
}

const PROVEEDORES = new Set([
  "gemini",
  "groq",
  "mistral",
  "opencode",
  "openrouter",
  "gateway",
]);

const NOMBRES: Record<string, string> = {
  gemini: "Gemini",
  groq: "Groq",
  mistral: "Mistral",
  opencode: "OpenCode",
  openrouter: "OpenRouter",
  gateway: "Lovable",
};

/** Convierte `"gemini/gemini-3-flash"` en `{ provider, model }`. */
export function engineDesdeModelo(modelo?: string | null): AiEngine | null {
  if (!modelo) return null;
  const [primero, ...resto] = modelo.split("/");
  if (resto.length > 0 && PROVEEDORES.has(primero)) {
    return { provider: primero, model: resto.join("/") };
  }
  // Los ids de OpenRouter no llevan proveedor delante.
  return { provider: "openrouter", model: modelo };
}

/** Reconoce la respuesta de cualquier Edge Function del proyecto. */
export function engineDesdeRespuesta(
  data: { provider?: string | null; model?: string | null; modelo?: string | null } | null | undefined,
): AiEngine | null {
  if (!data) return null;
  if (data.provider) {
    const modelo = data.model || engineDesdeModelo(data.modelo)?.model || data.modelo || "";
    return modelo ? { provider: data.provider, model: modelo } : null;
  }
  return engineDesdeModelo(data.modelo);
}

interface Props {
  engine: AiEngine | null;
  /** Mientras piensa: muestra el motor con un pulso y sin modelo. */
  loading?: boolean;
  className?: string;
}

/**
 * Indicador pequeño con el proveedor y el modelo de IA que están respondiendo.
 * Se apoya en las respuestas de las Edge Functions (`provider`, `model`, `modelo`).
 */
export function AiModelBadge({ engine, loading, className }: Props) {
  if (!engine && !loading) return null;

  const nombre = engine ? NOMBRES[engine.provider] || engine.provider : "IA";
  const titulo = engine ? `${nombre} · ${engine.model}` : "Consultando el modelo…";

  return (
    <span
      title={titulo}
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] leading-none text-muted-foreground",
        className,
      )}
    >
      <Cpu className={cn("h-3 w-3 shrink-0", loading && "animate-pulse")} />
      <span className="font-medium text-foreground/80">{nombre}</span>
      {engine && (
        <span className="max-w-[150px] truncate opacity-75">{engine.model}</span>
      )}
      {loading && <span className="opacity-70">…</span>}
    </span>
  );
}
