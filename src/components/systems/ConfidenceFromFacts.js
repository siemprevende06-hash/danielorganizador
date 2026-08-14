import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { Shield, Zap, AlertTriangle, Heart, Brain, Award, Activity } from "lucide-react";
const POSITIVE_TRAITS = [
    { id: "disciplina", label: "Disciplinado/a", icon: Shield },
    { id: "constancia", label: "Constante", icon: Activity },
    { id: "atletico", label: "Atlético/a", icon: Zap },
    { id: "estudioso", label: "Estudioso/a", icon: Brain },
    { id: "saludable", label: "Saludable", icon: Heart },
    { id: "ambicioso", label: "Ambicioso/a", icon: Award },
];
const NEGATIVE_TRAITS = [
    { id: "vago", label: "Vago/a", icon: AlertTriangle },
    { id: "inconsistente", label: "Inconsistente", icon: AlertTriangle },
    { id: "desordenado", label: "Desordenado/a", icon: AlertTriangle },
];
export function ConfidenceFromFacts({ totalHabits }) {
    const [patterns, setPatterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [overallScore, setOverallScore] = useState(0);
    useEffect(() => {
        const load = async () => {
            const start = format(subDays(new Date(), 30), "yyyy-MM-dd");
            const end = format(new Date(), "yyyy-MM-dd");
            const { data } = await supabase
                .from("daily_systems_tracking")
                .select("*")
                .gte("tracking_date", start)
                .lte("tracking_date", end);
            const rows = data || [];
            const days = rows.length || 1;
            // Aggregate facts
            let totalCompletions = 0;
            let workoutDays = 0;
            let totalWorkoutMin = 0;
            let totalWaterCups = 0;
            let totalLearningMin = 0;
            let perfectDays = 0;
            let zeroDays = 0;
            let blockDays = 0;
            let totalBlocks = 0;
            let workoutStreak = 0;
            let currentStreak = 0;
            let longestStreak = 0;
            const sortedRows = [...rows].sort((a, b) => a.tracking_date.localeCompare(b.tracking_date));
            sortedRows.forEach(r => {
                const completions = r.completions || {};
                const completed = Object.values(completions).filter(Boolean).length;
                const dayPct = totalHabits > 0 ? (completed / totalHabits) * 100 : 0;
                totalCompletions += completed;
                if (r.workout_duration > 0) {
                    workoutDays++;
                    totalWorkoutMin += r.workout_duration;
                }
                totalWaterCups += Object.values(r.water_data || {}).filter(Boolean).length;
                totalLearningMin += Object.values(r.time_data || {}).reduce((a, b) => a + (Number(b) || 0), 0);
                if (dayPct >= 80) {
                    perfectDays++;
                    currentStreak++;
                    longestStreak = Math.max(longestStreak, currentStreak);
                }
                else {
                    currentStreak = 0;
                }
                if (dayPct === 0)
                    zeroDays++;
                const blocks = Object.values(r.block_completions || {}).filter(Boolean).length;
                if (blocks > 0)
                    blockDays++;
                totalBlocks += blocks;
            });
            const avgCompletion = days > 0 ? Math.round((totalCompletions / (days * Math.max(totalHabits, 1))) * 100) : 0;
            const workoutFreq = days > 0 ? Math.round((workoutDays / days) * 100) : 0;
            const avgWaterPerDay = days > 0 ? Math.round(totalWaterCups / days) : 0;
            const avgLearningPerDay = days > 0 ? Math.round(totalLearningMin / days) : 0;
            const perfectRate = days > 0 ? Math.round((perfectDays / days) * 100) : 0;
            const zeroRate = days > 0 ? Math.round((zeroDays / days) * 100) : 0;
            const newPatterns = [];
            // POSITIVE
            if (avgCompletion >= 70) {
                newPatterns.push({
                    id: "disciplina",
                    type: "positive",
                    trait: "Disciplinado/a",
                    evidence: `Promedias ${avgCompletion}% de cumplimiento durante ${days} días seguidos.`,
                    icon: Shield,
                    strength: avgCompletion,
                });
            }
            if (workoutFreq >= 50) {
                newPatterns.push({
                    id: "atletico",
                    type: "positive",
                    trait: "Atlético/a",
                    evidence: `Entrenaste ${workoutDays} de ${days} días (${workoutFreq}%) acumulando ${Math.round(totalWorkoutMin / 60)}h de ejercicio.`,
                    icon: Zap,
                    strength: workoutFreq,
                });
            }
            if (longestStreak >= 5) {
                newPatterns.push({
                    id: "constancia",
                    type: "positive",
                    trait: "Constante",
                    evidence: `Racha de ${longestStreak} días seguidos cumpliendo +80% de tus hábitos.`,
                    icon: Activity,
                    strength: Math.min(100, longestStreak * 10),
                });
            }
            if (avgLearningPerDay >= 60) {
                newPatterns.push({
                    id: "estudioso",
                    type: "positive",
                    trait: "Estudioso/a",
                    evidence: `Dedicas ${avgLearningPerDay} min/día en promedio a aprender (lectura, idiomas, hobbys).`,
                    icon: Brain,
                    strength: Math.min(100, avgLearningPerDay),
                });
            }
            if (avgWaterPerDay >= 5) {
                newPatterns.push({
                    id: "saludable",
                    type: "positive",
                    trait: "Saludable",
                    evidence: `Tomas ${avgWaterPerDay} vasos de agua al día y mantienes tu nutrición.`,
                    icon: Heart,
                    strength: Math.min(100, avgWaterPerDay * 12),
                });
            }
            if (perfectRate >= 30) {
                newPatterns.push({
                    id: "ambicioso",
                    type: "positive",
                    trait: "Ambicioso/a",
                    evidence: `${perfectDays} de ${days} días fueron casi perfectos (+80%).`,
                    icon: Award,
                    strength: perfectRate,
                });
            }
            // NEGATIVE — solo si la evidencia es contundente
            if (avgCompletion < 30 && days >= 7) {
                newPatterns.push({
                    id: "vago",
                    type: "negative",
                    trait: "Vago/a",
                    evidence: `Solo cumples ${avgCompletion}% de tus hábitos. Hay margen para mejorar.`,
                    icon: AlertTriangle,
                    strength: 100 - avgCompletion,
                });
            }
            if (zeroRate >= 30 && days >= 7) {
                newPatterns.push({
                    id: "inconsistente",
                    type: "negative",
                    trait: "Inconsistente",
                    evidence: `${zeroDays} días sin marcar nada (${zeroRate}% del periodo).`,
                    icon: AlertTriangle,
                    strength: zeroRate,
                });
            }
            // Overall confidence score = (positive evidence - negative evidence)
            const positiveSum = newPatterns.filter(p => p.type === "positive").reduce((s, p) => s + p.strength, 0);
            const negativeSum = newPatterns.filter(p => p.type === "negative").reduce((s, p) => s + p.strength, 0);
            const score = Math.max(0, Math.min(100, Math.round(positiveSum / Math.max(1, newPatterns.length) - negativeSum / 5)));
            setOverallScore(score);
            setPatterns(newPatterns);
            setLoading(false);
        };
        load();
    }, [totalHabits]);
    if (loading) {
        return _jsx(Card, { className: "p-4 animate-pulse h-48 bg-muted/20" });
    }
    return (_jsxs(Card, { className: "p-4 border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-background to-transparent", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "h-5 w-5 text-amber-500" }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold", children: "Confianza Basada en Hechos" }), _jsx("p", { className: "text-[11px] text-muted-foreground", children: "Tu identidad construida con datos reales \u00B7 30 d\u00EDas" })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-2xl font-bold text-amber-500", children: overallScore }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "de confianza" })] })] }), patterns.length === 0 ? (_jsx("div", { className: "text-center py-6 text-sm text-muted-foreground", children: "Sigue marcando tus h\u00E1bitos para construir tu identidad con hechos." })) : (_jsx("div", { className: "space-y-2", children: patterns.map(p => {
                    const Icon = p.icon;
                    const isPositive = p.type === "positive";
                    return (_jsx("div", { className: `p-3 rounded-lg border ${isPositive
                            ? "bg-success/5 border-success/20"
                            : "bg-destructive/5 border-destructive/20"}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: `p-2 rounded-lg flex-shrink-0 ${isPositive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`, children: _jsx(Icon, { className: "h-4 w-4" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "font-semibold text-sm", children: p.trait }), _jsxs(Badge, { variant: isPositive ? "default" : "destructive", className: "text-[10px] h-4", children: [p.strength, "%"] })] }), _jsx("p", { className: "text-xs text-muted-foreground leading-relaxed", children: p.evidence })] })] }) }, p.id));
                }) })), _jsx("p", { className: "text-[10px] text-muted-foreground mt-3 text-center italic", children: "\"Eres lo que haces repetidamente.\" \u2014 Arist\u00F3teles" })] }));
}
