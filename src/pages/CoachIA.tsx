import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Brain, CheckCircle2, History, Loader2, Plus, Send, Trash2 } from "lucide-react";
import { useCoachChat } from "@/hooks/useCoachChat";
import { VisualCanvas, VisualBlock } from "@/components/coach/VisualCanvas";

const QUICK = [
  "Evalúa mi semana",
  "¿Qué hago ahora?",
  "Planifica mi día",
  "Me siento mal",
  "Revisa mi dirección",
];

export default function CoachIA() {
  const {
    conversations, conversationId, messages, memories, loading, error,
    sendMessage, openConversation, newConversation, deleteMemory,
  } = useCoachChat();
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading, conversationId]);

  const allVisuals = messages.flatMap((m) => m.visuals);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-foreground text-background">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-semibold leading-tight">Coach IA</h1>
            <p className="text-xs text-muted-foreground">Conoce tu vida, te aconseja y actúa</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={newConversation}>
            <Plus className="w-4 h-4 mr-1" /> Nuevo
          </Button>
          <Sheet>
            <SheetTrigger asChild><Button variant="outline" size="sm"><History className="w-4 h-4" /></Button></SheetTrigger>
            <SheetContent side="right" className="w-80">
              <Tabs defaultValue="hilos" className="mt-6">
                <TabsList className="w-full">
                  <TabsTrigger value="hilos" className="flex-1">Historial</TabsTrigger>
                  <TabsTrigger value="memoria" className="flex-1">Memoria</TabsTrigger>
                </TabsList>
                <TabsContent value="hilos">
                  <ScrollArea className="h-[70vh] pr-2">
                    <div className="space-y-1">
                      {conversations.length === 0 && (
                        <p className="text-xs text-muted-foreground p-2">Sin conversaciones aún.</p>
                      )}
                      {conversations.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => openConversation(c.id)}
                          className={`w-full text-left text-sm px-2 py-2 rounded-md hover:bg-muted transition-colors ${
                            c.id === conversationId ? "bg-muted font-medium" : ""
                          }`}
                        >
                          <span className="line-clamp-2">{c.title || "Conversación"}</span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="memoria">
                  <ScrollArea className="h-[70vh] pr-2">
                    <div className="space-y-2">
                      {memories.length === 0 && (
                        <p className="text-xs text-muted-foreground p-2">Todavía no recuerda nada de ti.</p>
                      )}
                      {memories.map((m) => (
                        <div key={m.id} className="border border-border rounded-md p-2 flex gap-2 items-start">
                          <div className="flex-1">
                            {m.kind && <p className="text-[10px] uppercase text-muted-foreground">{m.kind}</p>}
                            <p className="text-xs">{m.content}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deleteMemory(m.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_380px] gap-4">
        {/* Chat */}
        <Card className="flex flex-col h-[65vh] lg:h-[72vh]">
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="py-8 text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Pregúntame lo que quieras: puedo evaluar tus áreas, planificar tu día y crear tareas en tus bloques.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK.map((q) => (
                      <Button key={q} variant="outline" size="sm" className="text-xs" onClick={() => sendMessage(q)} disabled={loading}>
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
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
                      <div className="lg:hidden space-y-2">
                        {m.visuals.map((v, i) => <VisualBlock key={i} visual={v} />)}
                      </div>
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

          {messages.length > 0 && (
            <div className="px-3 pb-1 flex gap-1 flex-wrap">
              {QUICK.map((q) => (
                <Button key={q} variant="ghost" size="sm" className="text-[10px] h-6 px-2" onClick={() => sendMessage(q)} disabled={loading}>
                  {q}
                </Button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-3 pt-2 border-t border-border flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe aquí..."
              disabled={loading}
              className="text-sm"
            />
            <Button type="submit" size="sm" disabled={loading || !input.trim()} className="px-3">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </Card>

        {/* Lienzo visual */}
        <Card className="hidden lg:block h-[72vh] overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <h2 className="text-sm font-medium">Lienzo</h2>
          </div>
          <ScrollArea className="h-[calc(72vh-37px)]">
            <VisualCanvas visuals={allVisuals} />
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
