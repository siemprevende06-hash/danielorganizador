import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookText, Headphones, MessageCircle, PenLine, Languages as LangIcon, Sparkles, Check, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeekStreakBar } from "./WeekStreakBar";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Skill {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

const SKILLS: Skill[] = [
  { id: "gramatica",   name: "Gramática",   icon: BookText,      color: "text-purple-600",  bg: "bg-purple-500/10" },
  { id: "vocabulario", name: "Vocabulario", icon: Sparkles,      color: "text-pink-600",    bg: "bg-pink-500/10" },
  { id: "lectura-l",   name: "Lectura",     icon: BookText,      color: "text-amber-600",   bg: "bg-amber-500/10" },
  { id: "listening",   name: "Listening",   icon: Headphones,    color: "text-blue-600",    bg: "bg-blue-500/10" },
  { id: "speaking",    name: "Speaking",    icon: MessageCircle, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  { id: "escritura",   name: "Escritura",   icon: PenLine,       color: "text-rose-600",    bg: "bg-rose-500/10" },
];

interface Props {
  completions: Record<string, boolean>;
  onToggle: (id: string) => void;
  italianoTime?: number;
  inglesTime?: number;
  onItalianoTimeChange?: (minutes: number) => void;
  onInglesTimeChange?: (minutes: number) => void;
  skipped?: Record<string, boolean>;
  onSkipToggle?: (id: string) => void;
}

export const LanguageSkillCards = ({ completions, onToggle, italianoTime = 0, inglesTime = 0, onItalianoTimeChange, onInglesTimeChange, skipped, onSkipToggle }: Props) => {
  const [activeLang, setActiveLang] = useState<'italian' | 'english'>('italian');
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

      const updateData: any = {
        session_date: today,
        language: activeLang,
        total_duration: localTime,
      };

      if (existing) {
        await supabase.from('language_sessions').update(updateData).eq('id', existing.id);
      } else {
        await supabase.from('language_sessions').insert(updateData);
      }
    } catch (e) { console.error('Error saving language session:', e); }
  };

  const handleToggle = (skillId: string) => {
    const key = `${langPrefix}-${skillId}`;
    onToggle(key);
    upsertLanguageSession();
  };

  const handleTimeSave = () => {
    if (activeLang === 'italian' && onItalianoTimeChange && localTime !== italianoTime) {
      onItalianoTimeChange(localTime);
    } else if (activeLang === 'english' && onInglesTimeChange && localTime !== inglesTime) {
      onInglesTimeChange(localTime);
    }
    if (localTime > 0) upsertLanguageSession();
  };

  const switchLang = (lang: 'italian' | 'english') => {
    setLocalTime(lang === 'italian' ? italianoTime : inglesTime);
    setActiveLang(lang);
  };

  return (
    <Card className={cn("p-3 ring-2 transition-all space-y-3", ring, "bg-emerald-500/5")}>
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-emerald-500/20">
          <LangIcon className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">🌐 Idiomas</p>
          <p className="text-[10px] text-muted-foreground">
            6 habilidades · Marca lo que practicaste hoy
          </p>
        </div>
        <span className="text-xs font-bold text-emerald-600">{doneCount}/{SKILLS.length}</span>
      </div>

      {/* ITA / ING switch */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 w-fit mx-auto">
        <button onClick={() => switchLang('italian')}
          className={cn("px-3 py-1 rounded-md text-xs font-semibold transition-all", activeLang === 'italian' ? "bg-green-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          ITA
        </button>
        <button onClick={() => switchLang('english')}
          className={cn("px-3 py-1 rounded-md text-xs font-semibold transition-all", activeLang === 'english' ? "bg-blue-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          ING
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
        {SKILLS.map((s) => {
          const Icon = s.icon;
          const id = `${langPrefix}-${s.id}`;
          const done = !!completions[id];
          return (
            <button
              key={`${activeLang}-${s.id}`}
              onClick={() => handleToggle(s.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border-2 p-2 transition-all text-left",
                done
                  ? "bg-green-500/15 border-green-500/50"
                  : `${s.bg} border-transparent hover:border-muted-foreground/30`,
              )}
            >
              <div className={cn(
                "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0",
                done ? "bg-green-500 border-green-500" : "border-muted-foreground/40"
              )}>
                {done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
              </div>
              <Icon className={cn("h-3.5 w-3.5 shrink-0", s.color)} />
              <span className="text-[11px] font-medium truncate flex-1">{s.name}</span>
            </button>
          );
        })}
      </div>

      {/* Time input */}
      <div className={cn("flex items-center gap-2 p-2 rounded-lg ring-2 transition-all", timeColor)}>
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-[11px] font-medium text-muted-foreground shrink-0">Tiempo</span>
        <Input
          type="number"
          min={0}
          max={120}
          value={localTime || ""}
          onChange={e => { const v = parseInt(e.target.value) || 0; setLocalTime(v); }}
          className="h-7 w-14 text-xs text-center font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[10px] text-muted-foreground">min</span>
        <button
          onClick={() => {
            const langKey = activeLang === 'italian' ? 'italiano' : 'ingles';
            const timeChange = activeLang === 'italian' ? onItalianoTimeChange : onInglesTimeChange;
            timeChange?.(0);
            onSkipToggle?.(langKey);
          }}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors",
            skipped?.[activeLang === 'italian' ? 'italiano' : 'ingles'] ? "bg-red-500/20 text-red-500" : "bg-muted text-muted-foreground hover:bg-red-500/10"
          )}
        >
          <XCircle className="h-3 w-3" />
          {skipped?.[activeLang === 'italian' ? 'italiano' : 'ingles'] ? "Saltado" : "No hice"}
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <span className={cn("text-[9px] font-medium", localTime >= maxTime ? "text-green-600" : localTime >= minTime ? "text-blue-600" : "text-red-500")}>
            {localTime >= maxTime ? "Máx ✓" : localTime >= minTime ? "Mín ✓" : "—"}
          </span>
          <div className={cn("w-2 h-2 rounded-full", localTime >= maxTime ? "bg-green-500" : localTime >= minTime ? "bg-blue-500" : "bg-red-500")} />
        </div>
      </div>

      <button onClick={handleTimeSave}
        className="w-full py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors">
        Guardar tiempo
      </button>

      <WeekStreakBar habitId="idiomas" todayValue={doneCount} todayCompleted={doneCount > 0} minThreshold={1} maxThreshold={SKILLS.length} compact />
    </Card>
  );
};