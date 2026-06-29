import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, GraduationCap, Briefcase, Code2, Clock, Target, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCombinedFocusTime } from "@/hooks/useCombinedFocusTime";
import { useSystemsTracking } from "@/hooks/useSystemsTracking";

function semaphore(progress: number) {
  if (progress >= 80) return { ring: "ring-green-500/60", bg: "bg-green-500/10", text: "text-green-600", label: "Completado" };
  if (progress >= 50) return { ring: "ring-blue-500/60", bg: "bg-blue-500/10", text: "text-blue-600", label: "En progreso" };
  if (progress > 0) return { ring: "ring-red-500/60", bg: "bg-red-500/5", text: "text-red-500", label: "Pendiente" };
  return { ring: "ring-muted/40", bg: "bg-muted/5", text: "text-muted-foreground", label: "Sin empezar" };
}

export function FocusIndicatorsSection() {
  const { areas, loading, setManualTime } = useCombinedFocusTime();
  const { data: systemsData, loading: systemsLoading } = useSystemsTracking();

  if (loading || systemsLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </Card>
    );
  }

  const SOSTEN_IDS = [
    "rutina-activacion", "alistamiento-desayuno", "horario-regular", "rutina-desactivacion",
    "skincare-manana", "skincare-noche", "banarme-vestirme",
    "pre-entreno", "desayuno", "merienda-1", "almuerzo", "merienda-2", "comida", "antes-dormir",
  ];
  const sostenCount = SOSTEN_IDS.filter((id) => systemsData.completions[id]).length;
  const sostenTotal = SOSTEN_IDS.length;
  const sostenPct = Math.round((sostenCount / sostenTotal) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold uppercase tracking-wide">FOCUS · HOY</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {areas.map((area) => {
          const sem = semaphore(area.progress);
          const Icon = area.id === "universidad" ? GraduationCap : area.id === "emprendimiento" ? Briefcase : Code2;
          const colorMap: Record<string, string> = {
            universidad: "text-purple-500 bg-purple-500/10 ring-purple-500/20",
            emprendimiento: "text-amber-500 bg-amber-500/10 ring-amber-500/20",
            proyectos: "text-cyan-500 bg-cyan-500/10 ring-cyan-500/20",
          };

          return (
            <Card key={area.id} className={cn("p-3 ring-2 transition-all", sem.ring, sem.bg, "flex flex-col gap-2")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg", colorMap[area.id])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-sm">{area.name}</span>
                </div>
                <span className={cn("text-[10px] font-semibold", sem.text)}>{sem.label}</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] text-muted-foreground shrink-0">Manual:</span>
                <Input
                  type="number"
                  min={0}
                  value={area.manualMinutes || ""}
                  onChange={(e) => setManualTime(area.id, parseInt(e.target.value) || 0)}
                  placeholder="min"
                  className="w-16 h-7 text-xs text-center"
                />
                <span className="text-[11px] text-muted-foreground">min</span>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Target className="h-3 w-3 text-primary" />
                <span>Focus: <strong>{area.focusMinutes}</strong> min</span>
                <span className="mx-1">·</span>
                <span>Total: <strong className="text-foreground">{area.totalMinutes}</strong> / {area.goalMinutes} min</span>
              </div>

              <Progress value={area.progress} className="h-1.5" />
            </Card>
          );
        })}
      </div>

      <Card className="p-3 bg-muted/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-[10px] font-semibold text-muted-foreground">Sostén</span>
            <span className={cn("text-xs font-bold", sostenPct >= 70 ? "text-green-500" : sostenPct >= 40 ? "text-amber-500" : "text-red-500")}>
              {sostenCount}/{sostenTotal}
            </span>
          </div>
          <Progress value={sostenPct} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground tabular-nums">{sostenPct}%</span>
        </div>
      </Card>
    </div>
  );
}
