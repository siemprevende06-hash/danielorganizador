import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookText, Headphones, MessageCircle, PenLine, Languages as LangIcon, Sparkles, Pause, Play, RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeekStreakBar } from "./WeekStreakBar";
import { toast } from "sonner";

interface Skill {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

const SKILLS: Skill[] = [
  { id: "gramatica",   name: "Gramática",  icon: BookText,      color: "text-purple-600", bg: "bg-purple-500/10" },
  { id: "vocabulario", name: "Vocabulario", icon: Sparkles,     color: "text-pink-600",   bg: "bg-pink-500/10" },
  { id: "lectura-l",   name: "Lectura",     icon: BookText,     color: "text-amber-600",  bg: "bg-amber-500/10" },
  { id: "listening",   name: "Listening",   icon: Headphones,   color: "text-blue-600",   bg: "bg-blue-500/10" },
  { id: "speaking",    name: "Speaking",    icon: MessageCircle,color: "text-emerald-600",bg: "bg-emerald-500/10" },
  { id: "escritura",   name: "Escritura",   icon: PenLine,      color: "text-rose-600",   bg: "bg-rose-500/10" },
];

const GOAL_MIN = 30;

interface Props {
  /** times per skillId in minutes */
  times: Record<string, number>;
  onTimeChange: (id: string, v: number) => void;
}

export const LanguageSkillCards = ({ times, onTimeChange }: Props) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <div className="p-1.5 rounded-lg bg-emerald-500/20">
          <LangIcon className="h-4 w-4 text-emerald-600" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Idiomas · 6 habilidades · 30 min c/u
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {SKILLS.map((s) => (
          <SkillCard key={s.id} skill={s} value={times[`idioma-${s.id}`] || 0} onChange={(v) => onTimeChange(`idioma-${s.id}`, v)} />
        ))}
      </div>
    </div>
  );
};

const SkillCard = ({ skill, value, onChange }: { skill: Skill; value: number; onChange: (v: number) => void }) => {
  const Icon = skill.icon;
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const pct = Math.min(100, Math.round((value / GOAL_MIN) * 100));
  const done = value >= GOAL_MIN;
  const partial = value > 0 && value < GOAL_MIN;

  const ringColor = done
    ? "ring-green-500/60"
    : partial
    ? "ring-blue-500/60"
    : "ring-red-500/40";

  const handleSave = () => {
    const mins = Math.round(seconds / 60);
    if (mins > 0) {
      onChange(value + mins);
      setSeconds(0);
      setRunning(false);
      toast.success(`+${mins} min en ${skill.name}`);
    }
  };

  const handleQuickAdd = (m: number) => {
    onChange(value + m);
    toast.success(`+${m} min en ${skill.name}`);
  };

  return (
    <Card className={cn("overflow-hidden p-2.5 ring-2 transition-all space-y-1.5", ringColor, skill.bg)}>
      <div className="flex items-center gap-1.5">
        <Icon className={cn("h-3.5 w-3.5", skill.color)} />
        <span className="text-[11px] font-semibold flex-1 truncate">{skill.name}</span>
        {done && <Check className="h-3 w-3 text-green-600" strokeWidth={3} />}
      </div>

      <div className="flex items-baseline justify-between">
        <span className={cn("text-base font-bold tabular-nums", skill.color)}>
          {value}
          <span className="text-[10px] text-muted-foreground font-normal">/{GOAL_MIN}m</span>
        </span>
        {seconds > 0 && (
          <span className="text-[10px] font-mono text-muted-foreground">
            +{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </span>
        )}
      </div>

      <Progress value={pct} className="h-1.5" />

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={running ? "destructive" : "default"}
          className="h-6 px-1.5 text-[10px] flex-1"
          onClick={() => setRunning(!running)}
        >
          {running ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
        </Button>
        {seconds > 0 && (
          <>
            <Button size="sm" variant="outline" className="h-6 px-1.5 text-[10px]" onClick={handleSave}>
              <Check className="h-2.5 w-2.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => setSeconds(0)}>
              <RotateCcw className="h-2.5 w-2.5" />
            </Button>
          </>
        )}
        {seconds === 0 && (
          <Button size="sm" variant="outline" className="h-6 px-1 text-[10px]" onClick={() => handleQuickAdd(15)}>+15</Button>
        )}
      </div>

      <WeekStreakBar habitId={`idioma-${skill.id}`} todayValue={value} minThreshold={15} maxThreshold={GOAL_MIN} compact />
    </Card>
  );
};
