import { Calendar, CalendarClock, CalendarDays, CalendarRange, ChevronLeft, ChevronRight, RotateCcw, Sun } from "lucide-react";
import type { Timeframe } from "@/contexts/TimeframeContext";
import type { PlanificationScope } from "@/lib/planSystems";
import { goalPeriodLabel, goalPeriodRange, shiftGoalPeriod } from "@/lib/metasSistemas";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Timeframe; label: string; icon: typeof Sun }[] = [
  { value: "today", label: "Día", icon: Sun },
  { value: "week", label: "Semana", icon: CalendarDays },
  { value: "month", label: "Mes", icon: CalendarRange },
  { value: "quarter", label: "Trimestre", icon: CalendarClock },
  { value: "year", label: "Año", icon: Calendar },
];

export function PeriodSwitch({
  value,
  onChange,
}: {
  value: Timeframe;
  onChange: (value: Timeframe) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Periodo del resumen"
      className="inline-flex w-full max-w-full items-center gap-1 overflow-x-auto rounded-xl border bg-muted/40 p-1 sm:w-auto"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all sm:flex-none",
              active
                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function PeriodNavigator({
  scope,
  anchor,
  onChange,
}: {
  scope: PlanificationScope;
  anchor: Date;
  onChange: (date: Date) => void;
}) {
  const anchorStartKey = goalPeriodRange(scope, anchor).startKey;
  const currentStartKey = goalPeriodRange(scope, new Date()).startKey;
  const isCurrent = anchorStartKey === currentStartKey;
  const isFuture = anchorStartKey > currentStartKey;
  const rawLabel = goalPeriodLabel(scope, anchor);
  const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

  const buttonClass =
    "grid h-6 w-6 shrink-0 place-items-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="inline-flex max-w-full items-center gap-1 rounded-xl border bg-muted/40 p-1">
      <button
        type="button"
        onClick={() => onChange(shiftGoalPeriod(scope, anchor, -1))}
        aria-label="Periodo anterior"
        title="Periodo anterior"
        className={buttonClass}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[112px] max-w-[190px] truncate px-1 text-center text-[10px] font-semibold leading-tight text-foreground">
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(shiftGoalPeriod(scope, anchor, 1))}
        disabled={isCurrent || isFuture}
        aria-label="Periodo siguiente"
        title={isCurrent || isFuture ? "Ya estás en el periodo actual" : "Periodo siguiente"}
        className={buttonClass}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
      {!isCurrent && (
        <button
          type="button"
          onClick={() => onChange(new Date())}
          aria-label="Volver al periodo actual"
          title="Volver al periodo actual"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border bg-background px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          Actual
        </button>
      )}
    </div>
  );
}

export const PERIOD_LABEL: Record<string, string> = {
  today: "hoy",
  week: "esta semana",
  month: "este mes",
  quarter: "este trimestre",
  year: "este año",
  sprint: "este sprint",
};
