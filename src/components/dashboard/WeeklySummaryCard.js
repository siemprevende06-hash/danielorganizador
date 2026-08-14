import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useWeekComparison } from "@/hooks/useWeekComparison";
export function WeeklySummaryCard() {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const { thisWeek, lastWeek } = useWeekComparison();
    const generateSummary = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-assistant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                },
                body: JSON.stringify({
                    message: `Hazme un resumen semanal breve (máx 4 oraciones). Esta semana: ${thisWeek.tasksCompleted} tareas, ${thisWeek.focusMinutes} min focus, ${thisWeek.blocksCompleted} bloques. Semana pasada: ${lastWeek.tasksCompleted} tareas, ${lastWeek.focusMinutes} min focus, ${lastWeek.blocksCompleted} bloques. Dame feedback directo y motivación.`,
                    dayContext: {
                        currentTime: new Date().toTimeString().slice(0, 5),
                        currentBlock: null,
                        tasks: [],
                        completedTasksCount: thisWeek.tasksCompleted,
                        totalTasksCount: thisWeek.tasksCompleted,
                        goals: [],
                        blocksCompleted: thisWeek.blocksCompleted,
                        blocksTotal: thisWeek.blocksCompleted,
                        weekNumber: Math.ceil((new Date().getTime() - new Date(2026, 0, 1).getTime()) / 604800000),
                        daysRemainingInQuarter: 90 - (Math.floor((new Date().getTime() - new Date(2026, Math.floor(new Date().getMonth() / 3) * 3, 1).getTime()) / 86400000)),
                    },
                }),
            });
            if (!response.ok || !response.body)
                throw new Error('Error');
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let text = '';
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                let idx;
                while ((idx = buffer.indexOf('\n')) !== -1) {
                    let line = buffer.slice(0, idx);
                    buffer = buffer.slice(idx + 1);
                    if (line.endsWith('\r'))
                        line = line.slice(0, -1);
                    if (!line.startsWith('data: '))
                        continue;
                    const json = line.slice(6).trim();
                    if (json === '[DONE]')
                        break;
                    try {
                        const p = JSON.parse(json);
                        const c = p.choices?.[0]?.delta?.content;
                        if (c) {
                            text += c;
                            setSummary(text);
                        }
                    }
                    catch { }
                }
            }
        }
        catch {
            setSummary('No se pudo generar el resumen. Intenta de nuevo.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [_jsx(Sparkles, { className: "w-4 h-4 text-primary" }), "Resumen Semanal IA"] }), _jsx(Button, { size: "sm", variant: "outline", className: "h-6 text-xs", onClick: generateSummary, disabled: loading, children: loading ? _jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : 'Generar' })] }) }), _jsx(CardContent, { children: summary ? (_jsx("p", { className: "text-xs text-muted-foreground leading-relaxed", children: summary })) : (_jsx("p", { className: "text-xs text-muted-foreground italic", children: "Presiona \"Generar\" para obtener tu resumen semanal con IA" })) })] }));
}
