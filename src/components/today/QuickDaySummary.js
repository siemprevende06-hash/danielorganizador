import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, CheckCircle2, Clock, Target, Zap } from 'lucide-react';
import { useRoutineBlocksDB } from '@/hooks/useRoutineBlocksDB';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { getLocalTasksForDate, getLocalBlockCompletions } from '@/lib/dataSync';
export function QuickDaySummary() {
    const { blocks, getCurrentBlock, getBlockProgress } = useRoutineBlocksDB();
    const [summary, setSummary] = useState({
        tasksCompleted: 0,
        tasksTotal: 0,
        blocksCompleted: 0,
        blocksTotal: 0,
        dayScore: 0,
    });
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        loadDaySummary();
    }, [blocks]);
    const loadDaySummary = async () => {
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            let tasksCompleted = 0;
            let tasksTotal = 0;
            let blocksCompleted = 0;
            const blocksTotal = blocks.length;
            // Try Supabase first
            try {
                const { data: tasksData } = await supabase
                    .from('tasks')
                    .select('id, completed')
                    .eq('due_date', today);
                const { data: entTasks } = await supabase
                    .from('entrepreneurship_tasks')
                    .select('id, completed')
                    .eq('due_date', today);
                const allTasks = [...(tasksData || []), ...(entTasks || [])];
                if (allTasks.length > 0) {
                    tasksCompleted = allTasks.filter(t => t.completed).length;
                    tasksTotal = allTasks.length;
                }
            }
            catch {
                // Supabase failed, will use localStorage fallback
            }
            // If Supabase returned no tasks, fall back to localStorage
            if (tasksTotal === 0) {
                const localData = getLocalTasksForDate(today);
                tasksCompleted = localData.completed;
                tasksTotal = localData.total;
            }
            // Block completions from Supabase
            try {
                const { data: completionsData } = await supabase
                    .from('block_completions')
                    .select('block_id')
                    .eq('completion_date', today)
                    .eq('completed', true);
                if ((completionsData || []).length > 0) {
                    blocksCompleted = completionsData.length;
                }
            }
            catch {
                // Supabase failed
            }
            // If Supabase returned no block completions, try localStorage
            if (blocksCompleted === 0) {
                const localBlocks = getLocalBlockCompletions(blocks);
                blocksCompleted = localBlocks.completedCount;
            }
            const taskScore = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 50 : 0;
            const blockScore = blocksTotal > 0 ? (blocksCompleted / blocksTotal) * 50 : 0;
            const dayScore = Math.round(taskScore + blockScore);
            setSummary({
                tasksCompleted,
                tasksTotal,
                blocksCompleted,
                blocksTotal,
                dayScore,
            });
        }
        catch (error) {
            console.error('Error loading day summary:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const currentBlock = getCurrentBlock();
    const currentProgress = currentBlock ? getBlockProgress(currentBlock) : 0;
    const getScoreColor = (score) => {
        if (score >= 80)
            return 'text-green-500';
        if (score >= 60)
            return 'text-yellow-500';
        if (score >= 40)
            return 'text-orange-500';
        return 'text-red-500';
    };
    const getScoreEmoji = (score) => {
        if (score >= 80)
            return '🔥';
        if (score >= 60)
            return '💪';
        if (score >= 40)
            return '📈';
        return '⚡';
    };
    if (loading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "py-6", children: _jsx("div", { className: "flex items-center justify-center", children: _jsx("div", { className: "animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" }) }) }) }));
    }
    return (_jsx(Card, { className: "overflow-hidden", children: _jsx(CardContent, { className: "p-0", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border", children: [_jsxs("div", { className: "p-4 flex flex-col items-center justify-center text-center", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(Target, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-xs text-muted-foreground uppercase tracking-wide", children: "Score" })] }), _jsxs("div", { className: `text-3xl font-bold ${getScoreColor(summary.dayScore)}`, children: [summary.dayScore, _jsx("span", { className: "text-lg ml-1", children: getScoreEmoji(summary.dayScore) })] })] }), _jsxs("div", { className: "p-4 flex flex-col items-center justify-center text-center", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(CheckCircle2, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-xs text-muted-foreground uppercase tracking-wide", children: "Tareas" })] }), _jsxs("div", { className: "text-2xl font-bold", children: [summary.tasksCompleted, "/", summary.tasksTotal] }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [summary.tasksTotal - summary.tasksCompleted, " pendientes"] })] }), _jsxs("div", { className: "p-4 flex flex-col items-center justify-center text-center", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(Clock, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-xs text-muted-foreground uppercase tracking-wide", children: "Ahora" })] }), currentBlock ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "text-sm font-semibold truncate max-w-[150px]", children: currentBlock.title }), _jsx("div", { className: "w-full mt-1", children: _jsx(Progress, { value: currentProgress, className: "h-1.5" }) })] })) : (_jsx("span", { className: "text-sm text-muted-foreground", children: "Sin bloque activo" }))] }), _jsx("div", { className: "p-4 flex items-center justify-center", children: _jsx(Link, { to: "/daily", className: "w-full", children: _jsxs(Button, { className: "w-full gap-2", size: "lg", children: [_jsx(Zap, { className: "h-4 w-4" }), "Ver mi d\u00EDa completo", _jsx(ArrowRight, { className: "h-4 w-4" })] }) }) })] }) }) }));
}
