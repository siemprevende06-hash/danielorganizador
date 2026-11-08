import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Layers } from "lucide-react";
import { coverKey, useAreaCovers } from "@/hooks/useAreaCovers";
import { usePlanSystemMetrics } from "@/hooks/usePlanSystemMetrics";
import {
  PlanAreaCard,
  type PlanAreaCardData,
} from "@/components/planificacion/PlanAreaCard";
import {
  PLAN_AREA_BY_ID,
  PLAN_SYSTEM_META,
  type PlanAreaId,
  type PlanificationScope,
} from "@/lib/planSystems";
import type { Timeframe } from "@/contexts/TimeframeContext";
import { cn } from "@/lib/utils";
import { PERIOD_LABEL } from "./PeriodSwitch";
import { SectionHeader } from "./shared";

const SCOPE_BY_TIMEFRAME: Record<Timeframe, PlanificationScope> = {
  today: "day",
  week: "week",
  month: "month",
  quarter: "quarter",
  year: "year",
  sprint: "week",
};

interface SystemGroup {
  areaId: PlanAreaId;
  systemIds: string[];
  note: string;
}

/**
 * Mismos sistemas que se siguen en la pestaña Planificación de Daily:
 * los centrales (Desarrollo, Profesional y Finanzas) más Gym, que se agrupa
 * dentro de Salud. Las tarjetas usan exactamente el mismo componente
 * (`PlanAreaCard`) y las métricas reales del periodo elegido.
 */
const SYSTEM_GROUPS: SystemGroup[] = [
  {
    areaId: "desarrollo",
    systemIds: ["lectura", "musica", "idiomas", "ajedrez", "game"],
    note: "Lectura · Música · Idiomas · Ajedrez · Game",
  },
  {
    areaId: "profesional",
    systemIds: ["universidad", "emprendimiento", "proyectos"],
    note: "Universidad · Emprendimiento · Proyectos",
  },
  {
    areaId: "finanzas",
    systemIds: ["finanzas"],
    note: "Finanzas",
  },
  {
    areaId: "salud",
    systemIds: ["gym"],
    note: "Gym",
  },
];

export function SystemDataCards({ timeframe }: { timeframe: Timeframe }) {
  const scope = SCOPE_BY_TIMEFRAME[timeframe] ?? "week";
  const anchorDate = useMemo(() => new Date(), []);
  const metrics = usePlanSystemMetrics(scope, anchorDate);
  const { covers } = useAreaCovers();
  const periodLabel = PERIOD_LABEL[timeframe] || "este periodo";

  const groups = useMemo(
    () =>
      SYSTEM_GROUPS.flatMap((group) => {
        const area = PLAN_AREA_BY_ID[group.areaId];
        if (!area) return [];

        const cards = group.systemIds.flatMap((id): PlanAreaCardData[] => {
          const meta = PLAN_SYSTEM_META[id];
          const system = metrics.systems[id];
          if (!meta || !system) return [];

          return [{
            id,
            title: meta.name,
            emoji: meta.emoji,
            note: meta.role === "ancla" ? "ancla" : undefined,
            cover:
              covers[coverKey("sub", id)]
              ?? covers[coverKey("area", id)]
              ?? covers[coverKey("area", group.areaId)]
              ?? null,
            system,
            onTargetChange: (pct: number) => metrics.setTarget(id, pct),
            items: [],
          }];
        });

        return cards.length > 0 ? [{ ...group, area, cards }] : [];
      }),
    [covers, metrics],
  );

  return (
    <section className="space-y-4">
      <SectionHeader
        icon={<Layers className="h-4 w-4" />}
        title="Sistemas en detalle"
        subtitle={`Mismas tarjetas de Planificación de Daily · ${periodLabel}`}
        action={
          <Link
            to="/daily"
            className="text-[10px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Ver Daily →
          </Link>
        }
      />

      {metrics.loading ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.areaId} className="space-y-2">
              <div className="flex items-center gap-2 px-0.5">
                <span className="text-sm leading-none">{group.area.icon}</span>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground/70">
                  {group.area.label}
                </h3>
                <span className="hidden truncate text-[10px] text-muted-foreground sm:inline">
                  {group.note}
                </span>
                <span className="h-px flex-1 bg-border/60" />
                <span className="shrink-0 text-[9px] font-semibold tabular-nums text-muted-foreground">
                  {group.cards.length} {group.cards.length === 1 ? "sistema" : "sistemas"}
                </span>
              </div>

              <div className={cn(
                "grid grid-cols-2 gap-2.5 sm:grid-cols-3",
                group.cards.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4",
              )}>
                {group.cards.map((card) => (
                  <PlanAreaCard key={card.id} card={card} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
