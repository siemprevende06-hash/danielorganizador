import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ChevronDown, Gauge } from "lucide-react";
import { DAY_SYSTEMS } from "@/lib/daySystems";
import { ActivityTagBadge } from "@/components/systems/ActivityTagBadge";
import {
  doseLabel,
  summarizeSpeedPlan,
  type SpeedBlockLike,
  type SpeedPlan,
  type SpeedState,
} from "@/lib/speedPlan";

const STATE_CLS: Record<SpeedState, string> = {
  "sin-plan": "border-border/50 text-muted-foreground",
  "sin-dosis": "border-red-400/50 text-red-500",
  racha: "border-rose-400/50 bg-rose-500/10 text-rose-500",
  minimo: "border-blue-400/50 bg-blue-500/10 text-blue-500",
  maximo: "border-green-500/50 bg-green-500/10 text-green-600",
  extra: "border-amber-500/50 bg-amber-500/10 text-amber-600",
};

const BAR_CLS: Record<SpeedState, string> = {
  "sin-plan": "bg-muted-foreground/30",
  "sin-dosis": "bg-red-400",
  racha: "bg-rose-400",
  minimo: "bg-blue-500",
  maximo: "bg-green-500",
  extra: "bg-amber-500",
};

interface Props {
  speedPlan?: SpeedPlan | null;
  blocks?: SpeedBlockLike[];
  /** Permite plegar el desglose y dejar solo el resumen en la cabecera. */
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function DaySpeedSection({
  speedPlan,
  blocks,
  collapsible = false,
  defaultOpen = true,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const expanded = !collapsible || open;
  const summary = useMemo(
    () => summarizeSpeedPlan(speedPlan, blocks ?? []),
    [speedPlan, blocks],
  );

  const centralAreas = DAY_SYSTEMS.filter(area => area.kind === "central" && area.id !== "finanzas");
  const centralSystemIds = new Set(centralAreas.flatMap(area => area.systems.map(system => system.id)));
  const centralTotal = summary.doses
    .filter(dose => centralSystemIds.has(dose.systemId))
    .reduce((total, dose) => total + dose.plannedMinutes, 0);
  const activeSystems = summary.doses.filter(
    dose => centralSystemIds.has(dose.systemId) && dose.plannedMinutes > 0,
  ).length;

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold">Velocidad del día</h2>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary" className="text-[9px] tabular-nums">
              {centralTotal} min planificados
            </Badge>
            {collapsible && (
              <button
                type="button"
                onClick={() => setOpen(value => !value)}
                aria-expanded={open}
                aria-label={open ? 'Ocultar desglose de velocidad' : 'Mostrar desglose de velocidad'}
                className="grid h-6 w-6 place-items-center rounded-full border border-border/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronDown
                  className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
                />
              </button>
            )}
          </div>
        </div>

        {expanded && (
          <>
            <p className="text-[10px] text-muted-foreground">
              Se calcula con los minutos de los bloques y fragmentos del plan. Racha también cuenta como dosis.
            </p>

            <div className="space-y-4">
              {centralAreas.map(area => (
                <div key={area.id} className="space-y-2">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {area.name}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {area.systems.map(system => {
                      const dose = summary.bySystem[system.id];
                      const planned = dose?.plannedMinutes ?? 0;
                      const max = dose?.maxMinutes ?? 0;
                      const pct = max > 0 ? Math.min(100, Math.round((planned / max) * 100)) : 0;
                      const state = dose?.state ?? "sin-plan";

                      return (
                        <div
                          key={system.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-border/40 bg-muted/30 p-2.5"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-1">
                                <p className="truncate text-xs font-medium">{system.name}</p>
                                <ActivityTagBadge systemId={system.id} className="shrink-0" />
                              </div>
                              <span className="shrink-0 text-[10px] font-semibold tabular-nums">
                                {planned > 0 ? `${planned}′` : "—"}
                              </span>
                            </div>
                            <Progress value={pct} className="h-1" />
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[8px] text-muted-foreground">
                                {max > 0 ? `Meta máx. ${max}′` : "Sin meta"}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn("h-4 px-1 text-[8px] font-medium", STATE_CLS[state])}
                              >
                                {dose ? doseLabel(dose) : "Sin planificar"}
                              </Badge>
                            </div>
                          </div>
                          <span className={cn("h-6 w-1 shrink-0 rounded-full", BAR_CLS[state])} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-2 text-[9px] text-muted-foreground">
              <span>{activeSystems} sistemas con dosis</span>
              <span>·</span>
              <span>Máx + X extra = todo lo que supera el máximo.</span>
            </div>

            {centralTotal === 0 && (
              <p className="rounded-lg bg-muted/40 p-2 text-[10px] text-muted-foreground">
                Aún no hay minutos planificados. Asigna sistemas a los bloques o fragmenta un Deep Work.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
