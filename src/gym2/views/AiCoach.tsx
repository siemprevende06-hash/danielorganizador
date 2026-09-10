import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Plus, History, Dumbbell } from "lucide-react";
import { useGym } from "../store";
import { useGymCoach } from "@/hooks/useGymCoach";
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
    label: "Plan del próximo entrenamiento",
    text: "Prepara mi próximo entrenamiento según mi plan y progresión. Dame cada ejercicio con series, repeticiones y el peso sugerido.",
  },
  {
    label: "¿Cómo voy progresando?",
    text: "Revisa mi historial y progresión real. Señala si estoy progresando en peso/reps, qué estancado está y qué ajustar esta semana.",
  },
  {
    label: "Recomiéndame descansos",
    text: "Según mi tope cardíaco (FC máx 148) y mi rutina, sugiero cuántos minutos descansar entre series de cada ejercicio hoy.",
  },
];

export default function AiCoach() {
  const { S } = useGym();
  const { meta, convId, messages, loading, error, sendMessage, openConversation, newConversation } =
    useGymCoach();
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const submit = (text: string) => {
    if (!text.trim() || loading) return;
    sendMessage(text, S);
    setInput("");
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-32 lg:max-w-2xl lg:px-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coach IA</h1>
          <div className="text-sm text-muted-foreground">
            Entrenador personal con acceso a tu historial y pesos
          </div>
        </div>
        <Button size="icon" variant="outline" onClick={newConversation} aria-label="Nueva conversación">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {!convId && meta.length > 0 && (
        <div className="mb-3">
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Conversaciones anteriores
          </h4>
          <div className="divide-y divide-border rounded-2xl border bg-card">
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

      <ScrollArea className="h-[calc(100dvh-17rem)] min-h-[16rem] rounded-2xl border bg-card p-3">
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Dumbbell className="h-4 w-4 text-primary" />
                Cuéntale al Coach IA tu sesión o pídele el próximo entrenamiento.
              </div>
              {PROMPTS.map((p) => (
                <Button
                  key={p.label}
                  variant="outline"
                  className="w-full justify-start text-left text-xs"
                  onClick={() => submit(p.text)}
                  disabled={loading}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[92%] rounded-2xl px-3 py-2 text-sm",
                m.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {m.role === "user" ? (
                <span className="whitespace-pre-wrap">{m.content}</span>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
                  {m.content}
                </ReactMarkdown>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Preparando tu plan…
            </div>
          )}
          {error && (
            <div className="border border-destructive/30 rounded-md p-2 text-sm text-destructive">
              {error}
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
          placeholder="Pregúntale al Coach IA…"
          disabled={loading}
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}