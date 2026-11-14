import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Dumbbell,
  History,
  Loader2,
  Plus,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useGym } from "../store";
import { useGymCoach } from "@/hooks/useGymCoach";
import { AiModelBadge } from "@/components/ai/AiModelBadge";
import { lastBW, streakDays } from "../lib/history";
import { fmtNum, todayISO, weekKey } from "../lib/format";
import { cn } from "@/lib/utils";

const md: Components = {
  h2: ({ children }) => (
    <h2 className="mt-4 mb-1.5 text-base font-bold first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 mb-1 text-sm font-semibold first:mt-0">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-2 text-sm leading-relaxed last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  a: ({ children, ...props }) => (
    <a className="text-primary underline underline-offset-2" {...props}>
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b bg-muted/50 px-2 py-1 font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border-b px-2 py-1">{children}</td>,
};

const PROMPTS: { label: string; text: string }[] = [
  {
    label: "Prepara mi próximo entrenamiento",
    text: "Prepara mi próximo entrenamiento con los pesos que me tocan según mi historial real. Dame cada ejercicio con series, repeticiones, peso y descanso.",
  },
  {
    label: "¿Cómo voy? (datos reales)",
    text: "Revisa mi historial y mi progresión real. Dime en qué ejercicios estoy subiendo, cuáles están estancados y qué peso debo mover esta semana.",
  },
  {
    label: "Ajusta series, reps y descansos",
    text: "Revisa mis rutinas actuales y ajusta series, repeticiones y descansos para hipertrofia, respetando mi tope cardíaco. Aplica los cambios.",
  },
  {
    label: "Organiza mi semana",
    text: "Organiza mi semana de entrenamiento con mis rutinas actuales. Asigna cada día, deja los descansos y guárdalo en el plan.",
  },
  {
    label: "Registra peso y medidas",
    text: "Pregúntame mi peso corporal de hoy y mis medidas, y regístralos en Gym 2.0.",
  },
  {
    label: "Crea una rutina nueva",
    text: "Créame una rutina nueva de 4 días para ganar masa muscular. Usa ejercicios de mi biblioteca y guárdala con series, reps y descansos.",
  },
];

export default function AiCoach({ onGo }: { onGo?: (tab: string) => void }) {
  const { S } = useGym();
  const { meta, convId, messages, loading, error, engine, sendMessage, openConversation, newConversation, clearError } =
    useGymCoach({ onNavigate: onGo });
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const submit = (text: string) => {
    if (!text.trim() || loading) return;
    sendMessage(text);
    setInput("");
  };

  const planned = Object.keys(S.week).filter((k) => S.week[Number(k)]).length;
  const thisWeek = S.workouts.filter((w) => weekKey(w.d) === weekKey(todayISO())).length;
  const bw = lastBW(S);
  const streak = streakDays(S);

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-32 lg:max-w-2xl lg:px-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Coach GYM</h1>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Solo Gym 2.0
            </span>
            <AiModelBadge engine={engine} loading={loading} />
          </div>
          <div className="text-sm text-muted-foreground">
            Entrenador de fuerza e hipertrofia con acceso real a tus rutinas, plan, historial y pesos.
          </div>
        </div>
        <Button size="icon" variant="outline" onClick={newConversation} aria-label="Nueva conversación">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-3 grid grid-cols-4 gap-1.5 text-center">
        <div className="rounded-xl border bg-card px-1 py-1.5">
          <div className="text-[10px] uppercase text-muted-foreground">Rutinas</div>
          <div className="text-sm font-bold">{S.routines.length}</div>
        </div>
        <div className="rounded-xl border bg-card px-1 py-1.5">
          <div className="text-[10px] uppercase text-muted-foreground">Semana</div>
          <div className="text-sm font-bold">
            {thisWeek}
            {planned ? `/${planned}` : ""}
          </div>
        </div>
        <div className="rounded-xl border bg-card px-1 py-1.5">
          <div className="text-[10px] uppercase text-muted-foreground">Racha</div>
          <div className="text-sm font-bold">{streak}d</div>
        </div>
        <div className="rounded-xl border bg-card px-1 py-1.5">
          <div className="text-[10px] uppercase text-muted-foreground">Peso</div>
          <div className="text-sm font-bold">
            {bw ? fmtNum(bw.w) : "—"}
            {bw ? <span className="text-[10px] font-normal"> {S.bwUnit}</span> : null}
          </div>
        </div>
      </div>

      {!convId && meta.length > 0 && (
        <div className="mb-3">
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Conversaciones del Coach Gym
          </h4>
          <div className="max-h-40 overflow-y-auto divide-y divide-border rounded-2xl border bg-card">
            {meta.map((c) => (
              <button
                key={c.id}
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-accent/60"
                onClick={() => openConversation(c.id)}
              >
                <History className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 grow">
                  <div className="truncate text-sm font-medium">{c.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(c.updated_at).toLocaleString("es-ES")}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <ScrollArea className="h-[calc(100dvh-23rem)] min-h-[16rem] rounded-2xl border bg-card p-3">
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Dumbbell className="h-4 w-4 text-primary" />
                Puedo leer tus datos y también cambiarlos:
              </div>
              <ul className="ml-6 list-disc space-y-0.5 text-xs text-muted-foreground">
                <li>Crear y editar rutinas, ejercicios y el plan semanal.</li>
                <li>Ajustar pesos, series, reps y descansos.</li>
                <li>Registrar entrenamientos, peso corporal y medidas.</li>
                <li>Analizar tu progreso real y decirte qué subir o descargar.</li>
              </ul>
              <div className="grid gap-2 pt-1 sm:grid-cols-2">
                {PROMPTS.map((p) => (
                  <Button
                    key={p.label}
                    variant="outline"
                    className="h-auto min-h-9 justify-start whitespace-normal text-left text-xs leading-snug"
                    onClick={() => submit(p.text)}
                    disabled={loading}
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[92%] rounded-2xl px-3 py-2 text-sm",
                m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
              )}
            >
              {m.role === "user" ? (
                <span className="whitespace-pre-wrap">{m.content}</span>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
                  {m.content}
                </ReactMarkdown>
              )}

              {!!m.actions?.length && (
                <div className="mt-2 space-y-1 border-t border-border/60 pt-2">
                  {m.actions.map((a, i) => (
                    <div
                      key={`${a.tipo}-${i}`}
                      className={cn(
                        "flex items-start gap-1.5 text-[11px] leading-snug",
                        a.ok ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {a.ok ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      )}
                      <span>{a.mensaje}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Leyendo tus datos y preparando la respuesta…
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 p-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="grow">{error}</div>
              <button
                type="button"
                className="shrink-0 rounded p-0.5 hover:bg-destructive/10"
                onClick={clearError}
                aria-label="Cerrar error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pídele algo al Coach Gym…"
          disabled={loading}
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>

      <div className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
        <Bot className="h-3 w-3" />
        Solo responde sobre entrenamiento, ejercicios, rutinas, progresión y recuperación muscular.
      </div>
    </div>
  );
}
