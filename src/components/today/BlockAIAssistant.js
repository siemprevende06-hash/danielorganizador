import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Bot, Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
const QUICK_PROMPTS = [
    { label: "¿Qué hago primero?", icon: "🎯" },
    { label: "¿Cómo voy?", icon: "📊" },
    { label: "Necesito motivación", icon: "💪" },
];
export function BlockAIAssistant({ dayContext }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const messagesEndRef = useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    const sendMessage = async (messageText) => {
        if (!messageText.trim() || isLoading)
            return;
        const userMessage = { role: "user", content: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        let assistantContent = "";
        try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-assistant`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                },
                body: JSON.stringify({ message: messageText, dayContext }),
            });
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
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                let newlineIndex;
                while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
                    let line = buffer.slice(0, newlineIndex);
                    buffer = buffer.slice(newlineIndex + 1);
                    if (line.endsWith("\r"))
                        line = line.slice(0, -1);
                    if (line.startsWith(":") || line.trim() === "")
                        continue;
                    if (!line.startsWith("data: "))
                        continue;
                    const jsonStr = line.slice(6).trim();
                    if (jsonStr === "[DONE]")
                        break;
                    try {
                        const parsed = JSON.parse(jsonStr);
                        const content = parsed.choices?.[0]?.delta?.content;
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
                    }
                    catch {
                        buffer = line + "\n" + buffer;
                        break;
                    }
                }
            }
        }
        catch (error) {
            console.error("AI Assistant error:", error);
            toast.error(error instanceof Error ? error.message : "Error al conectar con el asistente");
            // Remove the empty assistant message if there was an error
            setMessages(prev => prev.filter(m => m.content !== ""));
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };
    if (!isExpanded) {
        return (_jsxs(Button, { variant: "outline", className: "w-full gap-2 border-dashed hover:bg-primary/5", onClick: () => setIsExpanded(true), children: [_jsx(Bot, { className: "w-4 h-4" }), _jsx("span", { children: "Abrir Asistente IA" }), _jsx(Sparkles, { className: "w-3 h-3 text-primary" })] }));
    }
    return (_jsxs(Card, { className: "border-primary/20 bg-gradient-to-br from-background to-primary/5", children: [_jsx("div", { className: "p-3 border-b border-border/50", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "p-1.5 rounded-full bg-primary/10", children: _jsx(Bot, { className: "w-4 h-4 text-primary" }) }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium", children: "Asistente de Productividad" }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Te ayudo a priorizar y decidir" })] })] }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-6 text-xs", onClick: () => setIsExpanded(false), children: "Minimizar" })] }) }), _jsxs("div", { className: "h-48 overflow-y-auto p-3 space-y-3", children: [messages.length === 0 ? (_jsxs("div", { className: "text-center py-4", children: [_jsx("p", { className: "text-sm text-muted-foreground mb-3", children: "\u00BFEn qu\u00E9 te puedo ayudar?" }), _jsx("div", { className: "flex flex-wrap gap-2 justify-center", children: QUICK_PROMPTS.map((prompt) => (_jsxs(Button, { variant: "outline", size: "sm", className: "text-xs h-7", onClick: () => sendMessage(prompt.label), disabled: isLoading, children: [_jsx("span", { className: "mr-1", children: prompt.icon }), prompt.label] }, prompt.label))) })] })) : (messages.map((msg, i) => (_jsx("div", { className: `flex ${msg.role === "user" ? "justify-end" : "justify-start"}`, children: _jsx("div", { className: `max-w-[85%] rounded-lg px-3 py-2 text-sm ${msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"}`, children: msg.content || (_jsx(Loader2, { className: "w-4 h-4 animate-spin" })) }) }, i)))), _jsx("div", { ref: messagesEndRef })] }), messages.length > 0 && (_jsx("div", { className: "px-3 pb-2 flex gap-1 flex-wrap", children: QUICK_PROMPTS.map((prompt) => (_jsx(Button, { variant: "ghost", size: "sm", className: "text-[10px] h-5 px-2", onClick: () => sendMessage(prompt.label), disabled: isLoading, children: prompt.icon }, prompt.label))) })), _jsx("form", { onSubmit: handleSubmit, className: "p-3 pt-0", children: _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { value: input, onChange: (e) => setInput(e.target.value), placeholder: "Escribe tu pregunta...", className: "text-sm h-9", disabled: isLoading }), _jsx(Button, { type: "submit", size: "sm", className: "h-9 px-3", disabled: isLoading || !input.trim(), children: isLoading ? (_jsx(Loader2, { className: "w-4 h-4 animate-spin" })) : (_jsx(Send, { className: "w-4 h-4" })) })] }) })] }));
}
