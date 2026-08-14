import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { GraduationCap, Briefcase, Rocket, Dumbbell, Globe, Music, BookOpen, Gamepad2, Tv, X, Plus, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
export function InteractiveConsistencyTracker() {
    const { getActivity, getActivityStatus, getTotalMinutes, markComplete, addBonusTime, unmarkActivity, isLoading: activitiesLoading } = useActivityTracking();
    const [pillarMetrics, setPillarMetrics] = useState({
        university: { tasks: 0, hours: 0 },
        entrepreneurship: { tasks: 0 },
        project: { tasks: 0 },
    });
    const [isLoading, setIsLoading] = useState(true);
    const [bonusDialogOpen, setBonusDialogOpen] = useState(false);
    const [bonusActivity, setBonusActivity] = useState(null);
    const [bonusMinutes, setBonusMinutes] = useState('15');
    const loadPillarMetrics = useCallback(async () => {
        const today = new Date().toISOString().split('T')[0];
        // University tasks
        const { data: uniTasks } = await supabase
            .from('tasks')
            .select('id, completed')
            .eq('area_id', 'universidad')
            .gte('due_date', `${today}T00:00:00`)
            .lte('due_date', `${today}T23:59:59`);
        // Entrepreneurship tasks
        const { data: entTasks } = await supabase
            .from('entrepreneurship_tasks')
            .select('id, completed')
            .eq('due_date', today);
        // Project tasks
        const { data: projTasks } = await supabase
            .from('tasks')
            .select('id, completed')
            .eq('area_id', 'proyectos-personales')
            .gte('due_date', `${today}T00:00:00`)
            .lte('due_date', `${today}T23:59:59`);
        // Language sessions
        const { data: langSession } = await supabase
            .from('language_sessions')
            .select('total_duration')
            .eq('session_date', today)
            .maybeSingle();
        setPillarMetrics({
            university: {
                tasks: (uniTasks || []).filter(t => t.completed).length,
                hours: 0, // Would need block completion tracking
            },
            entrepreneurship: {
                tasks: (entTasks || []).filter(t => t.completed).length,
            },
            project: {
                tasks: (projTasks || []).filter(t => t.completed).length,
            },
        });
        setIsLoading(false);
    }, []);
    useEffect(() => {
        loadPillarMetrics();
    }, [loadPillarMetrics]);
    const handleActivityTap = (activityType) => {
        const status = getActivityStatus(activityType);
        if (status === 'incomplete') {
            markComplete(activityType);
        }
        else {
            // Open bonus dialog
            setBonusActivity(activityType);
            setBonusDialogOpen(true);
        }
    };
    const handleAddBonus = () => {
        if (bonusActivity && bonusMinutes) {
            addBonusTime(bonusActivity, parseInt(bonusMinutes));
            setBonusDialogOpen(false);
            setBonusActivity(null);
            setBonusMinutes('15');
        }
    };
    const handleUnmark = (activityType, e) => {
        e.stopPropagation();
        unmarkActivity(activityType);
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'complete': return 'bg-success/20 border-success text-success';
            case 'bonus': return 'bg-success/20 border-amber-500 text-success ring-2 ring-amber-500/50';
            case 'partial': return 'bg-warning/20 border-warning text-warning';
            default: return 'bg-muted border-muted-foreground/20 text-muted-foreground';
        }
    };
    const getPillarColor = (hasActivity) => {
        return hasActivity ? 'bg-success/20 border-success' : 'bg-muted border-muted-foreground/20';
    };
    // Calculate overall score
    const calculateScore = () => {
        let score = 0;
        const maxScore = 100;
        // Pillars (50 points max)
        if (pillarMetrics.university.tasks > 0)
            score += 10;
        if (pillarMetrics.entrepreneurship.tasks > 0)
            score += 10;
        if (pillarMetrics.project.tasks > 0)
            score += 10;
        if (getActivityStatus('gym') !== 'incomplete')
            score += 10;
        if (getActivityStatus('idiomas') !== 'incomplete')
            score += 10;
        // Secondary (50 points max)
        const pianoStatus = getActivityStatus('piano');
        const guitarStatus = getActivityStatus('guitarra');
        if (pianoStatus !== 'incomplete' || guitarStatus !== 'incomplete')
            score += 12.5;
        if (getActivityStatus('ajedrez') !== 'incomplete')
            score += 12.5;
        if (getActivityStatus('lectura') !== 'incomplete')
            score += 12.5;
        if (getActivityStatus('got') !== 'incomplete')
            score += 12.5;
        return Math.round(score);
    };
    if (isLoading || activitiesLoading) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "animate-pulse h-8 w-48 bg-muted rounded" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: [1, 2, 3, 4].map(i => (_jsx("div", { className: "animate-pulse h-20 bg-muted rounded" }, i))) })] }));
    }
    const score = calculateScore();
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Flame, { className: "w-5 h-5 text-orange-500" }), _jsx("h3", { className: "font-semibold", children: "Mi Constancia Hoy" })] }), _jsxs(Badge, { variant: "outline", className: cn("text-lg font-bold px-3 py-1", score >= 80 ? "border-success text-success" :
                            score >= 50 ? "border-warning text-warning" :
                                "border-muted-foreground"), children: [score, "/100"] })] }), _jsx(Progress, { value: score, className: "h-2" }), _jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-xs text-muted-foreground uppercase tracking-wider", children: "Pilares Principales" }), _jsxs("div", { className: "grid grid-cols-1 gap-2", children: [_jsxs("div", { className: cn("flex items-center justify-between p-3 rounded-lg border transition-all", getPillarColor(pillarMetrics.university.tasks > 0)), children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(GraduationCap, { className: "w-5 h-5" }), _jsxs("div", { children: [_jsx("span", { className: "font-medium text-sm", children: "Universidad" }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [pillarMetrics.university.tasks, " tareas"] })] })] }), pillarMetrics.university.tasks > 0 && (_jsx(Badge, { variant: "outline", className: "bg-success/20 border-success text-success", children: "\u2713" }))] }), _jsxs("div", { className: cn("flex items-center justify-between p-3 rounded-lg border transition-all", getPillarColor(pillarMetrics.entrepreneurship.tasks > 0)), children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Briefcase, { className: "w-5 h-5" }), _jsxs("div", { children: [_jsx("span", { className: "font-medium text-sm", children: "Emprendimiento" }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [pillarMetrics.entrepreneurship.tasks, " tareas"] })] })] }), pillarMetrics.entrepreneurship.tasks > 0 && (_jsx(Badge, { variant: "outline", className: "bg-success/20 border-success text-success", children: "\u2713" }))] }), _jsxs("div", { className: cn("flex items-center justify-between p-3 rounded-lg border transition-all", getPillarColor(pillarMetrics.project.tasks > 0)), children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Rocket, { className: "w-5 h-5" }), _jsxs("div", { children: [_jsx("span", { className: "font-medium text-sm", children: "Proyecto" }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [pillarMetrics.project.tasks, " tareas"] })] })] }), pillarMetrics.project.tasks > 0 && (_jsx(Badge, { variant: "outline", className: "bg-success/20 border-success text-success", children: "\u2713" }))] }), _jsxs("button", { onClick: () => handleActivityTap('gym'), className: cn("flex items-center justify-between p-3 rounded-lg border transition-all text-left", getStatusColor(getActivityStatus('gym'))), children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Dumbbell, { className: "w-5 h-5" }), _jsxs("div", { children: [_jsx("span", { className: "font-medium text-sm", children: "Gym" }), _jsx("p", { className: "text-xs opacity-70", children: getTotalMinutes('gym') > 0 ? `${getTotalMinutes('gym')} min` : '60 min objetivo' })] })] }), _jsx("div", { className: "flex items-center gap-1", children: getActivityStatus('gym') !== 'incomplete' && (_jsx(Button, { variant: "ghost", size: "sm", className: "h-6 w-6 p-0", onClick: (e) => handleUnmark('gym', e), children: _jsx(X, { className: "w-3 h-3" }) })) })] }), _jsxs("button", { onClick: () => handleActivityTap('idiomas'), className: cn("flex items-center justify-between p-3 rounded-lg border transition-all text-left", getStatusColor(getActivityStatus('idiomas'))), children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Globe, { className: "w-5 h-5" }), _jsxs("div", { children: [_jsx("span", { className: "font-medium text-sm", children: "Idiomas" }), _jsx("p", { className: "text-xs opacity-70", children: getTotalMinutes('idiomas') > 0 ? `${getTotalMinutes('idiomas')} min` : '30-90 min' })] })] }), _jsx("div", { className: "flex items-center gap-1", children: getActivityStatus('idiomas') !== 'incomplete' && (_jsx(Button, { variant: "ghost", size: "sm", className: "h-6 w-6 p-0", onClick: (e) => handleUnmark('idiomas', e), children: _jsx(X, { className: "w-3 h-3" }) })) })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-xs text-muted-foreground uppercase tracking-wider", children: "Metas Secundarias" }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("button", { onClick: () => {
                                    const pianoStatus = getActivityStatus('piano');
                                    if (pianoStatus === 'incomplete') {
                                        markComplete('piano');
                                    }
                                    else {
                                        handleActivityTap('piano');
                                    }
                                }, className: cn("flex flex-col items-center justify-center p-3 rounded-lg border transition-all min-h-[80px]", getStatusColor(getActivityStatus('piano') !== 'incomplete' || getActivityStatus('guitarra') !== 'incomplete'
                                    ? 'complete'
                                    : 'incomplete')), children: [_jsx(Music, { className: "w-5 h-5 mb-1" }), _jsx("span", { className: "text-xs font-medium", children: "\uD83C\uDFB9/\uD83C\uDFB8 M\u00FAsica" }), _jsx("span", { className: "text-[10px] opacity-70", children: "30 min" }), (getActivityStatus('piano') !== 'incomplete' || getActivityStatus('guitarra') !== 'incomplete') && (_jsx(Button, { variant: "ghost", size: "sm", className: "h-5 w-5 p-0 mt-1", onClick: (e) => {
                                            e.stopPropagation();
                                            unmarkActivity('piano');
                                            unmarkActivity('guitarra');
                                        }, children: _jsx(X, { className: "w-3 h-3" }) }))] }), _jsxs("button", { onClick: () => handleActivityTap('ajedrez'), className: cn("flex flex-col items-center justify-center p-3 rounded-lg border transition-all min-h-[80px]", getStatusColor(getActivityStatus('ajedrez'))), children: [_jsx(Gamepad2, { className: "w-5 h-5 mb-1" }), _jsx("span", { className: "text-xs font-medium", children: "\u265F\uFE0F Ajedrez" }), _jsx("span", { className: "text-[10px] opacity-70", children: "1 partida" }), getActivityStatus('ajedrez') !== 'incomplete' && (_jsx(Button, { variant: "ghost", size: "sm", className: "h-5 w-5 p-0 mt-1", onClick: (e) => handleUnmark('ajedrez', e), children: _jsx(X, { className: "w-3 h-3" }) }))] }), _jsxs("button", { onClick: () => handleActivityTap('lectura'), className: cn("flex flex-col items-center justify-center p-3 rounded-lg border transition-all min-h-[80px]", getStatusColor(getActivityStatus('lectura'))), children: [_jsx(BookOpen, { className: "w-5 h-5 mb-1" }), _jsx("span", { className: "text-xs font-medium", children: "\uD83D\uDCD6 Lectura" }), _jsx("span", { className: "text-[10px] opacity-70", children: getTotalMinutes('lectura') > 0 ? `${getTotalMinutes('lectura')} min` : '30 min' }), getActivityStatus('lectura') !== 'incomplete' && (_jsx(Button, { variant: "ghost", size: "sm", className: "h-5 w-5 p-0 mt-1", onClick: (e) => handleUnmark('lectura', e), children: _jsx(X, { className: "w-3 h-3" }) }))] }), _jsxs("button", { onClick: () => handleActivityTap('got'), className: cn("flex flex-col items-center justify-center p-3 rounded-lg border transition-all min-h-[80px]", getStatusColor(getActivityStatus('got'))), children: [_jsx(Tv, { className: "w-5 h-5 mb-1" }), _jsx("span", { className: "text-xs font-medium", children: "\uD83C\uDFAC GoT" }), _jsx("span", { className: "text-[10px] opacity-70", children: "1 cap\u00EDtulo" }), getActivityStatus('got') !== 'incomplete' && (_jsx(Button, { variant: "ghost", size: "sm", className: "h-5 w-5 p-0 mt-1", onClick: (e) => handleUnmark('got', e), children: _jsx(X, { className: "w-3 h-3" }) }))] })] })] }), _jsx(Dialog, { open: bonusDialogOpen, onOpenChange: setBonusDialogOpen, children: _jsxs(DialogContent, { className: "sm:max-w-[300px]", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "A\u00F1adir tiempo bonus" }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { type: "number", value: bonusMinutes, onChange: (e) => setBonusMinutes(e.target.value), placeholder: "15", className: "w-20" }), _jsx("span", { className: "text-sm text-muted-foreground", children: "minutos extra" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setBonusDialogOpen(false), className: "flex-1", children: "Cancelar" }), _jsxs(Button, { onClick: handleAddBonus, className: "flex-1", children: [_jsx(Plus, { className: "w-4 h-4 mr-1" }), "A\u00F1adir"] })] })] })] }) })] }));
}
