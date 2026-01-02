import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Bot, Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface TaskInfo {
  id: string;
  title: string;
  completed: boolean;
  priority?: string;
  goalTitle?: string;
  goalProgress?: number;
  areaId?: string;
}

interface BlockInfo {
  title: string;
  startTime: string;
  endTime: string;
  remainingMinutes: number;
}

interface DayContext {
  currentTime: string;
  currentBlock: BlockInfo | null;
  tasks: TaskInfo[];
  completedTasksCount: number;
  totalTasksCount: number;
  goals: { title: string; progress: number; category: string }[];
  blocksCompleted: number;
  blocksTotal: number;
  nextBlock?: { title: string; startTime: string };
  weekNumber: number;
  daysRemainingInQuarter: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface BlockAIAssistantProps {
  dayContext: DayContext;
}

const QUICK_PROMPTS = [
  { label: "¿Qué hago primero?", icon: "🎯" },
  { label: "¿Cómo voy?", icon: "📊" },
  { label: "Necesito motivación", icon: "💪" },
];

export function BlockAIAssistant({ dayContext }: BlockAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ message: messageText, dayContext }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al conectar con el asistente");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Add empty assistant message to update
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.role === "assistant") {
                  lastMessage.content = assistantContent;
                }
                return newMessages;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("AI Assistant error:", error);
      toast.error(error instanceof Error ? error.message : "Error al conectar con el asistente");
      // Remove the empty assistant message if there was an error
      setMessages(prev => prev.filter(m => m.content !== ""));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        className="w-full gap-2 border-dashed hover:bg-primary/5"
        onClick={() => setIsExpanded(true)}
      >
        <Bot className="w-4 h-4" />
        <span>Abrir Asistente IA</span>
        <Sparkles className="w-3 h-3 text-primary" />
      </Button>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-primary/10">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Asistente de Productividad</h4>
              <p className="text-[10px] text-muted-foreground">
                Te ayudo a priorizar y decidir
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setIsExpanded(false)}
          >
            Minimizar
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="h-48 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              ¿En qué te puedo ayudar?
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_PROMPTS.map((prompt) => (
                <Button
                  key={prompt.label}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => sendMessage(prompt.label)}
                  disabled={isLoading}
                >
                  <span className="mr-1">{prompt.icon}</span>
                  {prompt.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.content || (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts when there are messages */}
      {messages.length > 0 && (
        <div className="px-3 pb-2 flex gap-1 flex-wrap">
          {QUICK_PROMPTS.map((prompt) => (
            <Button
              key={prompt.label}
              variant="ghost"
              size="sm"
              className="text-[10px] h-5 px-2"
              onClick={() => sendMessage(prompt.label)}
              disabled={isLoading}
            >
              {prompt.icon}
            </Button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 pt-0">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            className="text-sm h-9"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="sm"
            className="h-9 px-3"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
