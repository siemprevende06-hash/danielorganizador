import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookText, BookOpen, Headphones, MessageCircle, PenLine, Languages as LangIcon, Sparkles, Check, Clock, Tv, Gamepad2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeekStreakBar } from "./WeekStreakBar";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useAreaCovers, coverKey } from "@/hooks/useAreaCovers";
import { getCoverGradient } from "@/components/areas/AreaCover";
import { SystemChronoBox } from "@/components/today/systems/SystemChronoBox";
import type { ChronoRange } from "@/lib/systemSchedule";

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

type PassiveColumn =
  | "passive_reading_podcast_completed"
  | "passive_tv_completed"
  | "passive_videogames_completed";

interface PassiveActivity {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  /** Columna de language_sessions donde se guarda (solo inglés). */
  column: PassiveColumn;
}

// Idioma pasivo: solo existe para inglés.
const PASSIVE: PassiveActivity[] = [
  { id: "reading_podcast", name: "Lectura o podcast", icon: BookOpen, color: "text-amber-600",  bg: "bg-amber-500/10",  column: "passive_reading_podcast_completed" },
  { id: "tv",             name: "Televisión",         icon: Tv,       color: "text-sky-600",    bg: "bg-sky-500/10",    column: "passive_tv_completed" },
  { id: "videogames",     name: "Videojuegos",        icon: Gamepad2, color: "text-violet-600", bg: "bg-violet-500/10", column: "passive_videogames_completed" },
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
  fixedBlocks?: ChronoRange[];
  extraBlocks?: ChronoRange[];
}

export const LanguageSkillCards = ({ completions, onToggle, italianoTime = 0, inglesTime = 0, onItalianoTimeChange, onInglesTimeChange, skipped, onSkipToggle, fixedBlocks, extraBlocks }: Props) => {
  const { covers } = useAreaCovers();
  const idiomasCover = covers[coverKey("sub", "idiomas")] ?? null;
  const [activeLang, setActiveLang] = useState<'italian' | 'english'>('italian');
  const langPrefix = activeLang === 'italian' ? 'idioma-italiano' : 'idioma-ingles';
  const currentTime = activeLang === 'italian' ? italianoTime : inglesTime;
  const today = format(new Date(), 'yyyy-MM-dd');
  const showPassive = activeLang === 'english';

  const doneCount = SKILLS.filter(s => completions[`${langPrefix}-${s.id}`]).length;
  const pct = Math.round((doneCount / SKILLS.length) * 100);
  const [localTime, setLocalTime] = useState(currentTime);
  const [passive, setPassive] = useState<Record<string, 'done' | 'skip' | 'none'>>({});

  useEffect(() => { setLocalTime(currentTime); }, [currentTime]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('language_sessions')
          .select('passive_reading_podcast_completed, passive_tv_completed, passive_videogames_completed')
          .eq('session_date', today)
          .eq('language', 'english')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!cancelled && data) {
          const row = data as Record<string, boolean | null>;
          const stateOf = (v: boolean | null | undefined): 'done' | 'skip' | 'none' =>
            v === true ? 'done' : v === false ? 'skip' : 'none';
          setPassive({
            reading_podcast: stateOf(row.passive_reading_podcast_completed),
            tv: stateOf(row.passive_tv_completed),
            videogames: stateOf(row.passive_videogames_completed),
          });
        }
      } catch (e) { console.error('Error loading passive language:', e); }
    })();
    return () => { cancelled = true; };
  }, [today]);

  const passiveDone = showPassive ? PASSIVE.filter(p => passive[p.id] === 'done').length : 0;
  const totalItems = SKILLS.length + (showPassive ? PASSIVE.length : 0);
  const totalDone = doneCount + passiveDone;

  const minTime = 15;
  const maxTime = 30;
  const timeRatio = Math.max(0, Math.min(1, (localTime - minTime) / (maxTime - minTime)));
  const timeColor = localTime >= maxTime
    ? "ring-green-500/60"
    : localTime >= minTime
    ? "ring-blue-500/60"
    : "ring-red-500/40";

  const ring = totalDone === 0
    ? "ring-red-500/40"
    : totalDone >= totalItems
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
        block_type: 'morning',
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

  const handlePassiveSet = async (id: string, column: PassiveColumn, target: 'done' | 'skip') => {
    const current = passive[id] ?? 'none';
    const next = current === target ? 'none' : target;
    setPassive(prev => ({ ...prev, [id]: next }));
    const value = next === 'done' ? true : next === 'skip' ? false : null;
    try {
      const { data: existing } = await supabase
        .from('language_sessions')
        .select('id')
        .eq('session_date', today)
        .eq('language', 'english')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabase.from('language_sessions').update({ [column]: value }).eq('id', existing.id);
      } else if (value !== null) {
        await supabase.from('language_sessions').insert({
          session_date: today,
          language: 'english',
          block_type: 'morning',
          [column]: value,
        });
      }
    } catch (e) { console.error('Error saving passive language:', e); }
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
      <div className={cn("relative -m-3 mb-3 h-14 overflow-hidden bg-gradient-to-br", getCoverGradient("idiomas"))}>
        {idiomasCover ? (
          <img src={idiomasCover} alt="Portada de Idiomas" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-2xl drop-shadow-sm">🌐</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/70 to-transparent" />
      </div>
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-emerald-500/20">
          <LangIcon className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">🌐 Idiomas</p>
          <p className="text-[10px] text-muted-foreground">
            {showPassive ? "6 habilidades + 3 pasivas" : "6 habilidades"} · Marca lo que practicaste hoy
          </p>
        </div>
        <span className="text-xs font-bold text-emerald-600">{totalDone}/{totalItems}</span>
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

      {(fixedBlocks || extraBlocks) && (
        <SystemChronoBox fixed={fixedBlocks ?? []} extra={extraBlocks ?? []} />
      )}

      {showPassive && (
        <div className="space-y-1.5 border-t border-border/40 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-extrabold uppercase tracking-wide text-foreground">🌐 Idioma pasivo</span>
            <span className={cn("text-[10px] font-bold tabular-nums", passiveDone === PASSIVE.length ? "text-emerald-500" : "text-muted-foreground")}>
              {passiveDone}/{PASSIVE.length}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {PASSIVE.map((p) => {
              const Icon = p.icon;
              const state = passive[p.id] ?? 'none';
              const done = state === 'done';
              const skip = state === 'skip';
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border-2 p-1.5 transition-all",
                    done
                      ? "bg-indigo-500/15 border-indigo-500/50"
                      : skip
                      ? "bg-red-500/10 border-red-500/50"
                      : `${p.bg} border-transparent`,
                  )}
                >
                  <button
                    onClick={() => handlePassiveSet(p.id, p.column, 'done')}
                    title="Marcar como hecho"
                    className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
                  >
                    <div className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0",
                      done ? "bg-indigo-500 border-indigo-500" : "border-muted-foreground/40"
                    )}>
                      {done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                    </div>
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", p.color)} />
                    <span className="text-[11px] font-medium truncate flex-1">{p.name}</span>
                  </button>
                  <button
                    onClick={() => handlePassiveSet(p.id, p.column, 'skip')}
                    title="Marcar como no hecho"
                    className={cn(
                      "h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-colors",
                      skip ? "bg-red-500 text-white" : "text-muted-foreground/50 hover:bg-red-500/15 hover:text-red-500"
                    )}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <WeekStreakBar habitId="idiomas" todayValue={totalDone} todayCompleted={totalDone > 0} minThreshold={1} maxThreshold={totalItems} compact />
    </Card>
  );
};