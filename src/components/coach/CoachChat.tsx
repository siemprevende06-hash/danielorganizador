import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useCoachChat } from "@/hooks/useCoachChat";
import { VisualBlock } from "@/components/coach/VisualCanvas";

export interface PendingPrompt {
  id: number;
  text: string;
}

interface CoachChatProps {
  pendingPrompt?: PendingPrompt | null;
  placeholder?: string;
  emptyText?: string;
}

export function CoachChat({ pendingPrompt, placeholder = "Escribe aquí...", emptyText }: CoachChatProps) {
  const { messages, loading, error, sendMessage } = useCoachChat();
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSentId = useRef<number | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  useEffect(() => {
    if (pendingPrompt && pendingPrompt.id !== lastSentId.current) {
      lastSentId.current = pendingPrompt.id;
      sendMessage(pendingPrompt.text);
    }
  }, [pendingPrompt, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 pr-1">
        <div className="space-y-4">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground pt-1">
              {pendingPrompt
                ? "Enviando tu reflexión al Coach IA..."
                : emptyText || "El Coach IA te da su opinión sobre tu reflexión y conversa contigo."}
            </p>
          )}

          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
              {m.role === "user" ? (
                <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-primary text-primary-foreground whitespace-pre-wrap">
                  {m.content}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  {m.acciones.length > 0 && (
                    <div className="space-y-1">
                      {m.acciones.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>
                            {a.tipo === "tarea_creada" && `Tarea creada: ${a.titulo}`}
                            {a.tipo === "tarea_asignada" && "Tarea asignada a un bloque"}
                            {a.tipo === "tarea_completada" && "Tarea completada"}
                            {a.tipo === "tarea_reabierta" && "Tarea reabierta"}
                            {a.tipo === "memoria_guardada" && "Memoria guardada"}
                            {!["tarea_creada","tarea_asignada","tarea_completada","tarea_reabierta","memoria_guardada"].includes(a.tipo) && a.tipo}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {m.visuals.map((v, i) => (
                    <VisualBlock key={i} visual={v} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Pensando...
            </div>
          )}
          {error && (
            <div className="text-sm text-destructive border border-destructive/30 rounded-md p-2">{error}</div>
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="pt-3 border-t border-border mt-3 flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          className="text-sm"
        />
        <Button type="submit" size="sm" disabled={loading || !input.trim()} className="px-3">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
}