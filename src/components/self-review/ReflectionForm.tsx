import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, Lightbulb, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  whatWentWell: string;
  whatCouldBeBetter: string;
  tomorrowPlan: string;
  onWhatWentWellChange: (value: string) => void;
  onWhatCouldBeBetterChange: (value: string) => void;
  onTomorrowPlanChange: (value: string) => void;
  /** Quita la tarjeta exterior cuando el formulario vive dentro de otra tarjeta. */
  embedded?: boolean;
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
  onTomorrowPlanChange,
  embedded = false,
}: Props) {
  const lines = whatWentWell.split("\n");
  const wins = [0, 1, 2].map(i => (lines[i] || "").trim());

  const updateWin = (index: number, value: string) => {
    // Se conservan las líneas posteriores a la tercera (texto antiguo o notas
    // extra) y la posición de cada triunfo; antes se borraba todo lo demás.
    const next = [...lines];
    while (next.length < 3) next.push("");
    next[index] = value;
    while (next.length > 0 && next[next.length - 1] === "") next.pop();
    onWhatWentWellChange(next.join("\n"));
  };

  return (
    <div className={cn("space-y-5", !embedded && "bg-card rounded-xl border border-border p-6")}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Trophy className="h-4 w-4 text-success" />
          Cierre del día
        </h3>
        <span className="text-[10px] text-muted-foreground">Reflexión nocturna</span>
      </div>

      {/* 3 wins */}
      <div className="space-y-2.5">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ThumbsUp className="h-4 w-4 text-success" />
          3 Triunfos del día
        </label>
        {[0, 1, 2].map(i => (
          <Textarea
            key={i}
            value={wins[i]}
            onChange={(e) => updateWin(i, e.target.value)}
            placeholder={WIN_PLACEHOLDERS[i]}
            aria-label={`Triunfo ${i + 1} del día`}
            className="min-h-[64px] resize-y bg-background text-sm"
          />
        ))}
      </div>

      {/* 1 thing to improve */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ThumbsDown className="h-4 w-4 text-destructive" />
          1 cosa a mejorar
        </label>
        <Textarea
          value={whatCouldBeBetter}
          onChange={(e) => onWhatCouldBeBetterChange(e.target.value)}
          placeholder="¿Qué no funcionó y cómo lo harás diferente?"
          aria-label="Una cosa a mejorar"
          className="min-h-[80px] resize-y bg-background text-sm"
        />
      </div>

      {/* Tomorrow plan */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Lightbulb className="h-4 w-4 text-warning" />
          Plan de mañana
        </label>
        <Textarea
          value={tomorrowPlan}
          onChange={(e) => onTomorrowPlanChange(e.target.value)}
          placeholder="Acciones concretas para mañana..."
          aria-label="Plan de mañana"
          className="min-h-[96px] resize-y bg-background text-sm"
        />
      </div>
    </div>
  );
}
