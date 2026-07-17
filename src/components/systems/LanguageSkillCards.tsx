import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookText, Headphones, MessageCircle, PenLine, Languages as LangIcon, Sparkles, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeekStreakBar } from "./WeekStreakBar";

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
  timeMinutes?: number;
  onTimeChange?: (minutes: number) => void;
  onSaveTime?: (minutes: number) => void;
}

export const LanguageSkillCards = ({ completions, onToggle, timeMinutes = 0, onTimeChange, onSaveTime }: Props) => {
  const doneCount = SKILLS.filter(s => completions[`idioma-${s.id}`]).length;
  const pct = Math.round((doneCount / SKILLS.length) * 100);
  const [localTime, setLocalTime] = useState(timeMinutes);

  useEffect(() => { setLocalTime(timeMinutes); }, [timeMinutes]);

  const minTime = 30;
  const maxTime = 90;
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

  const handleSave = () => {
    if (onSaveTime && localTime !== timeMinutes) {
      onSaveTime(localTime);
    }
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

      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
        {SKILLS.map((s) => {
          const Icon = s.icon;
          const id = `idioma-${s.id}`;
          const done = !!completions[id];
          return (
            <button
              key={s.id}
              onClick={() => onToggle(id)}
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
          onChange={e => { const v = parseInt(e.target.value) || 0; setLocalTime(v); if (onTimeChange) onTimeChange(v); }}
          className="h-7 w-14 text-xs text-center font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[10px] text-muted-foreground">min</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <span className={cn("text-[9px] font-medium", localTime >= maxTime ? "text-green-600" : localTime >= minTime ? "text-blue-600" : "text-red-500")}>
            {localTime >= maxTime ? "Máx ✓" : localTime >= minTime ? "Mín ✓" : "—"}
          </span>
          <div className={cn("w-2 h-2 rounded-full", localTime >= maxTime ? "bg-green-500" : localTime >= minTime ? "bg-blue-500" : "bg-red-500")} />
        </div>
      </div>

      <WeekStreakBar habitId="idiomas" todayValue={doneCount} todayCompleted={doneCount > 0} minThreshold={1} maxThreshold={SKILLS.length} compact />
    </Card>
  );
};