import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bot, Loader2, Mic, MicOff, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

interface AITransaction {
  description: string;
  amount: number;
  currency: "USD" | "CUP";
  date?: string;
  walletId: string;
  categoryId: string;
  type: "income" | "expense";
}

interface Props {
  wallets: { id: string; name: string }[];
  categories: { id: string; name: string; type: string }[];
  exchangeRate: number;
  onCreateTransaction: (t: {
    description: string;
    amount: number;
    date: Date;
    walletId: string;
    categoryId: string;
    type: "income" | "expense";
  }) => Promise<void> | void;
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finance-ai`;

const QUICK_PROMPTS = [
  "Compré café por 5 USD en Efectivo",
  "Recibí 200 USD de freelance en Digital 1",
  "Pagué 50 CUP de transporte",
  "Me pagaron el salario",
];

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export function FinanceAIAssistant({ wallets, categories, exchangeRate, onCreateTransaction }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const stopRecognition = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* noop */ }
    setListening(false);
  }, []);

  useEffect(() => stopRecognition, [stopRecognition]);

  const toggleMic = () => {
    if (listening) { stopRecognition(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    recRef.current = rec;
    rec.lang = "es-ES";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const t = e.results?.[0]?.[0]?.transcript || "";
      setInput(t);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true);
  };

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setLoading(true);
    const history = messages;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ message: trimmed, history, wallets, categories }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.error) {
        throw new Error(data?.error || `Error del servidor (${res.status})`);
      }
      if (data.completado && data.transaccion) {
        const t: AITransaction = data.transaccion;
        const rate = exchangeRate && exchangeRate > 0 ? exchangeRate : 24;
        const amountUSD = t.currency === "CUP" ? t.amount / rate : t.amount;
        const date = typeof t.date === "string" ? new Date(`${t.date}T12:00:00`) : new Date();
        await onCreateTransaction({
          description: t.description,
          amount: Number(amountUSD) || 0,
          date,
          walletId: t.walletId,
          categoryId: t.categoryId,
          type: t.type,
        });
        const tipo = t.type === "expense" ? "gasto" : "ingreso";
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `✅ Registrado: ${tipo} "${t.description}" de ${t.amount} ${t.currency}. ¿Registramos otro?`,
        }]);
      } else if (data.completado === false && data.pregunta) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.pregunta }]);
      } else {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: "No entendí. Dime por ejemplo: \"Compré café por 5 USD en Efectivo\".",
        }]);
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${(e as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, wallets, categories, exchangeRate, onCreateTransaction]);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30"
        aria-label="Asistente IA de Finanzas"
      >
        <Bot className="h-6 w-6" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[380px] max-w-[94vw] p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-blue-600" />
              Asistente de Finanzas IA
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4 py-3">
            {messages.length === 0 && !loading && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Dime qué gastaste o recibiste (texto o voz) y lo registro. Si falta algún dato, te lo pido.
                </p>
                {QUICK_PROMPTS.map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    onClick={() => send(q)}
                    className="whitespace-normal h-auto text-left px-3 py-2 rounded-xl text-xs w-full justify-start"
                  >
                    {q}
                  </Button>
                ))}
              </div>
            )}
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                    m.role === "user"
                      ? "ml-auto bg-blue-600 text-white rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md",
                  )}
                >
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="bg-muted text-muted-foreground rounded-2xl rounded-bl-md px-3 py-2 text-sm w-fit">
                  <Loader2 className="h-3.5 w-3.5 inline animate-spin mr-1" />Pensando...
                </div>
              )}
              <div ref={endRef} />
            </div>
          </ScrollArea>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="p-3 border-t flex items-center gap-2"
          >
            <Button
              type="button"
              variant={listening ? "destructive" : "outline"}
              size="icon"
              className="rounded-full shrink-0"
              onClick={toggleMic}
              aria-label="Hablar"
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ej: Compré café por 5 USD en Efectivo"
              className="rounded-full"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shrink-0"
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}