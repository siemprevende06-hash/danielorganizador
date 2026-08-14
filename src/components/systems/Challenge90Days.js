import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays, addDays, eachDayOfInterval, isBefore, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Flame, Play } from "lucide-react";
import { cn } from "@/lib/utils";
export function Challenge90Days() {
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from("challenge_90_days")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            setChallenge(data);
            setLoading(false);
        };
        load();
    }, []);
    const allDays = useMemo(() => {
        if (!challenge)
            return [];
        const s = new Date(challenge.start_date + "T00:00:00");
        const e = new Date(challenge.end_date + "T00:00:00");
        return eachDayOfInterval({ start: s, end: e });
    }, [challenge?.start_date, challenge?.end_date]);
    const startChallenge = async () => {
        const today = new Date();
        const end = addDays(today, 90);
        const { data } = await supabase
            .from("challenge_90_days")
            .insert({
            start_date: format(today, "yyyy-MM-dd"),
            end_date: format(end, "yyyy-MM-dd"),
            title: "Reto de 90 Días",
            is_active: true,
        })
            .select()
            .single();
        setChallenge(data);
    };
    if (loading)
        return null;
    if (!challenge) {
        return (_jsxs(Card, { className: "p-6 text-center space-y-3", children: [_jsx(Flame, { className: "h-8 w-8 text-orange-500 mx-auto" }), _jsx("h3", { className: "font-bold text-lg", children: "Reto de 90 D\u00EDas" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Inicia tu reto de transformaci\u00F3n" }), _jsxs(Button, { onClick: startChallenge, className: "gap-2", children: [_jsx(Play, { className: "h-4 w-4" }), " Iniciar Reto"] })] }));
    }
    const startDate = new Date(challenge.start_date + "T00:00:00");
    const endDate = new Date(challenge.end_date + "T00:00:00");
    const today = new Date();
    const daysPassed = Math.max(0, differenceInDays(today, startDate));
    const daysRemaining = Math.max(0, differenceInDays(endDate, today));
    const totalDays = differenceInDays(endDate, startDate);
    const progressPct = Math.min(100, (daysPassed / totalDays) * 100);
    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) {
        weeks.push(allDays.slice(i, i + 7));
    }
    return (_jsxs(Card, { className: "p-4 md:p-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(Flame, { className: "h-5 w-5 text-orange-500" }), _jsx("h3", { className: "text-lg font-bold", children: "Reto de 90 D\u00EDas" })] }), _jsxs("p", { className: "text-xs text-muted-foreground mb-3", children: [format(startDate, "d MMM", { locale: es }), " \u2014 ", format(endDate, "d MMM yyyy", { locale: es })] }), _jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "flex-1", children: _jsx("div", { className: "relative h-3 rounded-full bg-secondary overflow-hidden", children: _jsx("div", { className: "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all", style: { width: `${progressPct}%` } }) }) }), _jsxs("span", { className: "text-sm font-bold text-orange-500", children: [Math.round(progressPct), "%"] })] }), _jsxs("div", { className: "flex gap-4 mb-4", children: [_jsxs(Badge, { className: "bg-green-500/20 text-green-600 border-green-500/30", children: ["D\u00EDa ", daysPassed, " de ", totalDays] }), _jsxs(Badge, { variant: "secondary", children: [daysRemaining, " d\u00EDas restantes"] })] }), _jsx("div", { className: "space-y-1", children: weeks.map((week, wi) => (_jsx("div", { className: "flex gap-1", children: week.map(day => {
                        const isPast = isBefore(day, today) && !isToday(day);
                        const isT = isToday(day);
                        return (_jsx("div", { className: cn("h-5 w-5 rounded-sm text-[8px] flex items-center justify-center font-mono", isPast && "bg-green-500/30 text-green-700 dark:text-green-300", isT && "bg-primary text-primary-foreground ring-2 ring-primary/50", !isPast && !isT && "bg-muted text-muted-foreground"), children: format(day, "d") }, day.toISOString()));
                    }) }, wi))) })] }));
}
