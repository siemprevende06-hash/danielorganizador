import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, Lightbulb, Plus, Trophy } from "lucide-react";

interface Props {
  whatWentWell: string;
  whatCouldBeBetter: string;
  tomorrowPlan: string;
  onWhatWentWellChange: (value: string) => void;
  onWhatCouldBeBetterChange: (value: string) => void;
  onTomorrowPlanChange: (value: string) => void;
}

const WIN_PLACEHOLDERS = [
  "Logro 1: ¿Qué victoria conseguiste hoy?",
  "Logro 2: ¿Qué salió bien?",
  "Logro 3: ¿De qué te sientes orgulloso?",
];

export function ReflectionForm({
  whatWentWell,
  whatCouldBeBetter,
  tomorrowPlan,
  onWhatWentWellChange,
  onWhatCouldBeBetterChange,
  onTomorrowPlanChange
}: Props) {
  const wins = [0, 1, 2].map(i => (whatWentWell.split("\n")[i] || "").trim());

  const updateWin = (index: number, value: string) => {
    const next = [...wins];
    next[index] = value;
    onWhatWentWellChange(next.filter(Boolean).join("\n"));
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Trophy className="w-4 h-4 text-success" />
          Cierre del día
        </h3>
        <span className="text-[10px] text-muted-foreground">Reflexión nocturna</span>
      </div>

      {/* 3 wins */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ThumbsUp className="w-4 h-4 text-success" />
          3 Triunfos del día
          <Plus className="w-3.5 h-3.5 text-muted-foreground" />
        </label>
        {[0, 1, 2].map(i => (
          <Textarea
            key={i}
            value={wins[i]}
            onChange={(e) => updateWin(i, e.target.value)}
            placeholder={WIN_PLACEHOLDERS[i]}
            className="min-h-[58px] resize-none"
          />
        ))}
      </div>

      {/* 1 thing to improve */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ThumbsDown className="w-4 h-4 text-destructive" />
          1 cosa a mejorar
        </label>
        <Textarea
          value={whatCouldBeBetter}
          onChange={(e) => onWhatCouldBeBetterChange(e.target.value)}
          placeholder="¿Qué no funcionó y cómo lo harás diferente?"
          className="min-h-[58px] resize-none"
        />
      </div>

      {/* Tomorrow plan */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Lightbulb className="w-4 h-4 text-warning" />
          Plan de mañana
        </label>
        <Textarea
          value={tomorrowPlan}
          onChange={(e) => onTomorrowPlanChange(e.target.value)}
          placeholder="Acciones concretas para mañana..."
          className="min-h-[80px] resize-none"
        />
      </div>
    </div>
  );
}