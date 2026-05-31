import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, Lightbulb } from "lucide-react";

interface Props {
  whatWentWell: string;
  whatCouldBeBetter: string;
  tomorrowPlan: string;
  onWhatWentWellChange: (value: string) => void;
  onWhatCouldBeBetterChange: (value: string) => void;
  onTomorrowPlanChange: (value: string) => void;
}

export function ReflectionForm({
  whatWentWell,
  whatCouldBeBetter,
  tomorrowPlan,
  onWhatWentWellChange,
  onWhatCouldBeBetterChange,
  onTomorrowPlanChange
}: Props) {
  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
        Reflexión
      </h3>

      {/* What went well */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ThumbsUp className="w-4 h-4 text-success" />
          ¿Qué salió bien hoy?
        </label>
        <Textarea
          value={whatWentWell}
          onChange={(e) => onWhatWentWellChange(e.target.value)}
          placeholder="Describe tus victorias del día..."
          className="min-h-[80px] resize-none"
        />
      </div>

      {/* What could be better */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ThumbsDown className="w-4 h-4 text-destructive" />
          ¿Qué pudo ser mejor?
        </label>
        <Textarea
          value={whatCouldBeBetter}
          onChange={(e) => onWhatCouldBeBetterChange(e.target.value)}
          placeholder="¿Dónde fallaste o qué podrías mejorar?"
          className="min-h-[80px] resize-none"
        />
      </div>

      {/* Tomorrow plan */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Lightbulb className="w-4 h-4 text-warning" />
          ¿Qué haré diferente mañana?
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
