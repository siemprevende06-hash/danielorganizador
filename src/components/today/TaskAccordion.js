import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Briefcase, GraduationCap, FolderKanban, Book, Music, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
export function TaskAccordion() {
    const navigate = useNavigate();
    const today = format(new Date(), 'yyyy-MM-dd');
    const [loading, setLoading] = useState(true);
    const [universityTasks, setUniversityTasks] = useState([]);
    const [entrepreneurshipTasks, setEntrepreneurshipTasks] = useState([]);
    const [projectTasks, setProjectTasks] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [pianoSongs, setPianoSongs] = useState([]);
    const [guitarSongs, setGuitarSongs] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [expandedSections, setExpandedSections] = useState(['tasks', 'finances']);
    useEffect(() => {
        loadAllData();
    }, []);
    const loadAllData = async () => {
        try {
            const [uniTasksRes, entTasksRes, projTasksRes, subjectsRes, pianoRes, guitarRes, transRes, walletsRes,] = await Promise.all([
                supabase.from('tasks').select('*')
                    .or(`source.eq.university,area_id.eq.universidad`)
                    .gte('due_date', `${today}T00:00:00`)
                    .lte('due_date', `${today}T23:59:59`),
                supabase.from('entrepreneurship_tasks').select('*')
                    .eq('due_date', today),
                supabase.from('tasks').select('*')
                    .or(`source.eq.project,area_id.eq.proyectos,area_id.eq.proyectos-personales`)
                    .gte('due_date', `${today}T00:00:00`)
                    .lte('due_date', `${today}T23:59:59`),
                supabase.from('university_subjects').select('*'),
                supabase.from('music_repertoire').select('*').eq('instrument', 'piano').eq('status', 'learning'),
                supabase.from('music_repertoire').select('*').eq('instrument', 'guitar').eq('status', 'learning'),
                supabase.from('transactions').select('id, description, amount, transaction_type, wallet_id')
                    .gte('transaction_date', `${today}T00:00:00`)
                    .lte('transaction_date', `${today}T23:59:59`)
                    .order('created_at', { ascending: false }),
                supabase.from('wallets').select('id, name'),
            ]);
            const subjectMap = new Map((subjectsRes.data || []).map(s => [s.id, s.name]));
            setUniversityTasks((uniTasksRes.data || []).map((t) => ({
                id: t.id,
                title: t.title,
                completed: t.completed || false,
                source: 'university',
                subject_name: t.source_id ? subjectMap.get(t.source_id) : undefined,
                routine_block_id: t.routine_block_id,
            })));
            setEntrepreneurshipTasks((entTasksRes.data || []).map((t) => ({
                id: t.id,
                title: t.title,
                completed: t.completed || false,
                source: 'entrepreneurship',
                routine_block_id: t.routine_block_id,
            })));
            setProjectTasks((projTasksRes.data || []).map((t) => ({
                id: t.id,
                title: t.title,
                completed: t.completed || false,
                source: 'projects',
                routine_block_id: t.routine_block_id,
            })));
            setSubjects(subjectsRes.data || []);
            setPianoSongs(pianoRes.data || []);
            setGuitarSongs(guitarRes.data || []);
            const walletMap = new Map((walletsRes.data || []).map((w) => [w.id, w.name]));
            setTransactions((transRes.data || []).map((t) => ({
                id: t.id,
                description: t.description,
                amount: Number(t.amount),
                type: t.transaction_type,
                wallet_name: walletMap.get(t.wallet_id),
            })));
        }
        catch (error) {
            console.error('Error loading task data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const toggleTask = async (taskId, source, currentCompleted) => {
        const table = source === 'entrepreneurship' ? 'entrepreneurship_tasks' : 'tasks';
        await supabase.from(table).update({ completed: !currentCompleted }).eq('id', taskId);
        if (source === 'university') {
            setUniversityTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentCompleted } : t));
        }
        else if (source === 'projects') {
            setProjectTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentCompleted } : t));
        }
        else if (source === 'entrepreneurship') {
            setEntrepreneurshipTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentCompleted } : t));
        }
    };
    const renderTaskItem = (task) => (_jsxs("div", { className: cn("flex items-center gap-3 p-2 rounded-md transition-all", task.completed ? 'bg-green-500/10 opacity-60' : 'hover:bg-muted/50'), children: [_jsx(Checkbox, { checked: task.completed, onCheckedChange: () => toggleTask(task.id, task.source, task.completed) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("span", { className: cn("text-sm block truncate", task.completed && "line-through text-muted-foreground"), children: task.title }), task.subject_name && (_jsx("span", { className: "text-xs text-muted-foreground", children: task.subject_name }))] })] }, task.id));
    if (loading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "py-8", children: _jsx("div", { className: "animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" }) }) }));
    }
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const netFlow = totalIncome - totalExpense;
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs(CardTitle, { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(Book, { className: "h-4 w-4" }), "Detalles del D\u00EDa"] }) }), _jsx(CardContent, { children: _jsxs(Accordion, { type: "multiple", value: expandedSections, onValueChange: setExpandedSections, children: [_jsxs(AccordionItem, { value: "tasks", className: "border rounded-lg mb-3 overflow-hidden", children: [_jsx(AccordionTrigger, { className: "px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Briefcase, { className: "h-5 w-5 text-blue-600" }), _jsx("span", { className: "font-semibold", children: "Tareas del D\u00EDa" }), _jsxs(Badge, { variant: "secondary", className: "ml-2", children: [universityTasks.filter(t => t.completed).length + entrepreneurshipTasks.filter(t => t.completed).length + projectTasks.filter(t => t.completed).length, "/", universityTasks.length + entrepreneurshipTasks.length + projectTasks.length] })] }) }), _jsxs(AccordionContent, { className: "px-4 py-3 space-y-4", children: [subjects.length > 0 && (_jsxs("div", { className: "mb-2", children: [_jsx("p", { className: "text-xs text-muted-foreground mb-2", children: "\uD83D\uDCDA Asignaturas:" }), _jsx("div", { className: "flex flex-wrap gap-1", children: subjects.map(sub => (_jsx(Badge, { variant: "outline", className: "text-xs cursor-pointer hover:bg-muted", style: { borderColor: sub.color || undefined }, onClick: () => navigate(`/university?subject=${sub.id}`), children: sub.name }, sub.id))) })] })), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(GraduationCap, { className: "h-4 w-4 text-blue-600" }), _jsx("span", { className: "text-sm font-semibold", children: "Universidad" })] }), _jsx("div", { className: "space-y-1", children: universityTasks.length > 0 ? (universityTasks.map(task => renderTaskItem(task))) : (_jsx("p", { className: "text-sm text-muted-foreground py-2", children: "No hay tareas para hoy" })) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Briefcase, { className: "h-4 w-4 text-purple-600" }), _jsx("span", { className: "text-sm font-semibold", children: "Emprendimiento" })] }), _jsx("div", { className: "space-y-1", children: entrepreneurshipTasks.length > 0 ? (entrepreneurshipTasks.map(task => renderTaskItem(task))) : (_jsx("p", { className: "text-sm text-muted-foreground py-2", children: "No hay tareas para hoy" })) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(FolderKanban, { className: "h-4 w-4 text-orange-600" }), _jsx("span", { className: "text-sm font-semibold", children: "Proyectos Personales" })] }), _jsx("div", { className: "space-y-1", children: projectTasks.length > 0 ? (projectTasks.map(task => renderTaskItem(task))) : (_jsx("p", { className: "text-sm text-muted-foreground py-2", children: "No hay tareas para hoy" })) })] })] })] }), (pianoSongs.length > 0 || guitarSongs.length > 0) && (_jsxs(AccordionItem, { value: "music", className: "border rounded-lg mb-3 overflow-hidden", children: [_jsx(AccordionTrigger, { className: "px-4 py-3 bg-pink-500/10 hover:bg-pink-500/20", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Music, { className: "h-5 w-5 text-pink-600" }), _jsx("span", { className: "font-semibold", children: "M\u00FAsica en Aprendizaje" })] }) }), _jsxs(AccordionContent, { className: "px-4 py-3 space-y-3", children: [pianoSongs.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold text-muted-foreground mb-2", children: "\uD83C\uDFB9 Piano" }), pianoSongs.map(song => (_jsxs("div", { className: "flex items-center justify-between p-2 rounded bg-muted/30 mb-1", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: song.title }), song.artist && _jsx("p", { className: "text-xs text-muted-foreground", children: song.artist })] }), song.difficulty && _jsx(Badge, { variant: "outline", className: "text-xs", children: song.difficulty })] }, song.id)))] })), guitarSongs.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold text-muted-foreground mb-2", children: "\uD83C\uDFB8 Guitarra" }), guitarSongs.map(song => (_jsxs("div", { className: "flex items-center justify-between p-2 rounded bg-muted/30 mb-1", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: song.title }), song.artist && _jsx("p", { className: "text-xs text-muted-foreground", children: song.artist })] }), song.difficulty && _jsx(Badge, { variant: "outline", className: "text-xs", children: song.difficulty })] }, song.id)))] }))] })] })), _jsxs(AccordionItem, { value: "finances", className: "border rounded-lg overflow-hidden", children: [_jsx(AccordionTrigger, { className: "px-4 py-3 bg-green-500/10 hover:bg-green-500/20", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Wallet, { className: "h-5 w-5 text-green-600" }), _jsx("span", { className: "font-semibold", children: "Finanzas del D\u00EDa" }), _jsxs(Badge, { variant: netFlow >= 0 ? "default" : "destructive", className: "text-xs", children: [netFlow >= 0 ? '+' : '', "$", Math.abs(netFlow).toLocaleString()] })] }) }), _jsxs(AccordionContent, { className: "px-4 py-3 space-y-3", children: [_jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsxs("div", { className: "p-3 rounded-lg bg-green-500/10 text-center", children: [_jsx(TrendingUp, { className: "w-4 h-4 text-green-500 mx-auto mb-1" }), _jsxs("p", { className: "text-lg font-bold text-green-600", children: [totalIncome === 0 ? '- ' : '+', "$", totalIncome.toLocaleString()] }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Ingresos" })] }), _jsxs("div", { className: "p-3 rounded-lg bg-red-500/10 text-center", children: [_jsx(TrendingDown, { className: "w-4 h-4 text-red-500 mx-auto mb-1" }), _jsxs("p", { className: "text-lg font-bold text-red-600", children: [totalExpense === 0 ? '- ' : '-', "$", totalExpense.toLocaleString()] }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Gastos" })] }), _jsxs("div", { className: "p-3 rounded-lg bg-primary/10 text-center", children: [_jsx(Wallet, { className: "w-4 h-4 text-primary mx-auto mb-1" }), _jsxs("p", { className: cn("text-lg font-bold", netFlow >= 0 ? 'text-green-600' : 'text-red-600'), children: [netFlow >= 0 ? '+' : '', "$", netFlow.toLocaleString()] }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Neto" })] })] }), transactions.length > 0 ? (_jsx("div", { className: "space-y-1 max-h-48 overflow-y-auto", children: transactions.slice(0, 10).map(t => (_jsxs("div", { className: "flex items-center justify-between p-2 rounded-md bg-muted/30", children: [_jsxs("div", { className: "flex items-center gap-2", children: [t.type === 'income' ? (_jsx(ArrowUpRight, { className: "w-4 h-4 text-green-500" })) : (_jsx(ArrowDownRight, { className: "w-4 h-4 text-red-500" })), _jsx("span", { className: "text-sm truncate max-w-[200px]", children: t.description })] }), _jsxs("span", { className: cn("text-sm font-medium", t.type === 'income' ? 'text-green-600' : 'text-red-600'), children: [t.type === 'income' ? '+' : '-', "$", t.amount.toLocaleString()] })] }, t.id))) })) : (_jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "No hay movimientos hoy" })), _jsxs(Button, { variant: "outline", className: "w-full", onClick: () => navigate('/finance'), children: [_jsx(Wallet, { className: "h-4 w-4 mr-2" }), "Ver todas las finanzas"] })] })] })] }) })] }));
}
