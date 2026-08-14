import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookText, Headphones, MessageCircle, PenLine, Languages as LangIcon, Sparkles, Check, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeekStreakBar } from "./WeekStreakBar";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
const SKILLS = [
    { id: "gramatica", name: "Gramática", icon: BookText, color: "text-purple-600", bg: "bg-purple-500/10" },
    { id: "vocabulario", name: "Vocabulario", icon: Sparkles, color: "text-pink-600", bg: "bg-pink-500/10" },
    { id: "lectura-l", name: "Lectura", icon: BookText, color: "text-amber-600", bg: "bg-amber-500/10" },
    { id: "listening", name: "Listening", icon: Headphones, color: "text-blue-600", bg: "bg-blue-500/10" },
    { id: "speaking", name: "Speaking", icon: MessageCircle, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { id: "escritura", name: "Escritura", icon: PenLine, color: "text-rose-600", bg: "bg-rose-500/10" },
];
export const LanguageSkillCards = ({ completions, onToggle, italianoTime = 0, inglesTime = 0, onItalianoTimeChange, onInglesTimeChange, skipped, onSkipToggle }) => {
    const [activeLang, setActiveLang] = useState('italian');
    const langPrefix = activeLang === 'italian' ? 'idioma-italiano' : 'idioma-ingles';
    const currentTime = activeLang === 'italian' ? italianoTime : inglesTime;
    const today = format(new Date(), 'yyyy-MM-dd');
    const doneCount = SKILLS.filter(s => completions[`${langPrefix}-${s.id}`]).length;
    const pct = Math.round((doneCount / SKILLS.length) * 100);
    const [localTime, setLocalTime] = useState(currentTime);
    useEffect(() => { setLocalTime(currentTime); }, [currentTime]);
    const minTime = 15;
    const maxTime = 60;
    const timeRatio = Math.max(0, Math.min(1, (localTime - minTime) / (maxTime - minTime)));
    const timeColor = localTime >= maxTime
        ? "ring-green-500/60"
        : localTime >= minTime
            ? "ring-blue-500/60"
            : "ring-red-500/40";
    const ring = doneCount === 0
        ? "ring-red-500/40"
        : doneCount >= SKILLS.length
            ? "ring-green-500/60"
            : "ring-blue-500/60";
    const upsertLanguageSession = async () => {
        try {
            const { data: existing } = await supabase
                .from('language_sessions')
                .select('id')
                .eq('session_date', today)
                .eq('language', activeLang)
                .maybeSingle();
            const updateData = {
                session_date: today,
                language: activeLang,
                total_duration: localTime,
            };
            if (existing) {
                await supabase.from('language_sessions').update(updateData).eq('id', existing.id);
            }
            else {
                await supabase.from('language_sessions').insert(updateData);
            }
        }
        catch (e) {
            console.error('Error saving language session:', e);
        }
    };
    const handleToggle = (skillId) => {
        const key = `${langPrefix}-${skillId}`;
        onToggle(key);
        upsertLanguageSession();
    };
    const handleTimeSave = () => {
        if (activeLang === 'italian' && onItalianoTimeChange && localTime !== italianoTime) {
            onItalianoTimeChange(localTime);
        }
        else if (activeLang === 'english' && onInglesTimeChange && localTime !== inglesTime) {
            onInglesTimeChange(localTime);
        }
        if (localTime > 0)
            upsertLanguageSession();
    };
    const switchLang = (lang) => {
        setLocalTime(lang === 'italian' ? italianoTime : inglesTime);
        setActiveLang(lang);
    };
    return (_jsxs(Card, { className: cn("p-3 ring-2 transition-all space-y-3", ring, "bg-emerald-500/5"), children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "p-1.5 rounded-lg bg-emerald-500/20", children: _jsx(LangIcon, { className: "h-4 w-4 text-emerald-600" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-semibold", children: "\uD83C\uDF10 Idiomas" }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "6 habilidades \u00B7 Marca lo que practicaste hoy" })] }), _jsxs("span", { className: "text-xs font-bold text-emerald-600", children: [doneCount, "/", SKILLS.length] })] }), _jsxs("div", { className: "flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 w-fit mx-auto", children: [_jsx("button", { onClick: () => switchLang('italian'), className: cn("px-3 py-1 rounded-md text-xs font-semibold transition-all", activeLang === 'italian' ? "bg-green-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"), children: "ITA" }), _jsx("button", { onClick: () => switchLang('english'), className: cn("px-3 py-1 rounded-md text-xs font-semibold transition-all", activeLang === 'english' ? "bg-blue-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"), children: "ING" })] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-1.5", children: SKILLS.map((s) => {
                    const Icon = s.icon;
                    const id = `${langPrefix}-${s.id}`;
                    const done = !!completions[id];
                    return (_jsxs("button", { onClick: () => handleToggle(s.id), className: cn("flex items-center gap-1.5 rounded-lg border-2 p-2 transition-all text-left", done
                            ? "bg-green-500/15 border-green-500/50"
                            : `${s.bg} border-transparent hover:border-muted-foreground/30`), children: [_jsx("div", { className: cn("h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0", done ? "bg-green-500 border-green-500" : "border-muted-foreground/40"), children: done && _jsx(Check, { className: "h-2.5 w-2.5 text-white", strokeWidth: 3 }) }), _jsx(Icon, { className: cn("h-3.5 w-3.5 shrink-0", s.color) }), _jsx("span", { className: "text-[11px] font-medium truncate flex-1", children: s.name })] }, `${activeLang}-${s.id}`));
                }) }), _jsxs("div", { className: cn("flex items-center gap-2 p-2 rounded-lg ring-2 transition-all", timeColor), children: [_jsx(Clock, { className: "h-4 w-4 shrink-0 text-muted-foreground" }), _jsx("span", { className: "text-[11px] font-medium text-muted-foreground shrink-0", children: "Tiempo" }), _jsx(Input, { type: "number", min: 0, max: 120, value: localTime || "", onChange: e => { const v = parseInt(e.target.value) || 0; setLocalTime(v); }, className: "h-7 w-14 text-xs text-center font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: "min" }), _jsxs("button", { onClick: () => {
                            const langKey = activeLang === 'italian' ? 'italiano' : 'ingles';
                            const timeChange = activeLang === 'italian' ? onItalianoTimeChange : onInglesTimeChange;
                            timeChange?.(0);
                            onSkipToggle?.(langKey);
                        }, className: cn("flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors", skipped?.[activeLang === 'italian' ? 'italiano' : 'ingles'] ? "bg-red-500/20 text-red-500" : "bg-muted text-muted-foreground hover:bg-red-500/10"), children: [_jsx(XCircle, { className: "h-3 w-3" }), skipped?.[activeLang === 'italian' ? 'italiano' : 'ingles'] ? "Saltado" : "No hice"] }), _jsx("div", { className: "flex-1" }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: cn("text-[9px] font-medium", localTime >= maxTime ? "text-green-600" : localTime >= minTime ? "text-blue-600" : "text-red-500"), children: localTime >= maxTime ? "Máx ✓" : localTime >= minTime ? "Mín ✓" : "—" }), _jsx("div", { className: cn("w-2 h-2 rounded-full", localTime >= maxTime ? "bg-green-500" : localTime >= minTime ? "bg-blue-500" : "bg-red-500") })] })] }), _jsx("button", { onClick: handleTimeSave, className: "w-full py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors", children: "Guardar tiempo" }), _jsx(WeekStreakBar, { habitId: "idiomas", todayValue: doneCount, todayCompleted: doneCount > 0, minThreshold: 1, maxThreshold: SKILLS.length, compact: true })] }));
};
