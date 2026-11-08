import { CalendarDays, CalendarRange, CalendarClock, Sun } from "lucide-react";
import type { Timeframe } from "@/contexts/TimeframeContext";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Timeframe; label: string; icon: typeof Sun }[] = [
  { value: "today", label: "Día", icon: Sun },
  { value: "week", label: "Semana", icon: CalendarDays },
  { value: "quarter", label: "Trimestre", icon: CalendarRange },
  { value: "year", label: "Año", icon: CalendarClock },
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
              "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all sm:flex-none",
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

export const PERIOD_LABEL: Record<string, string> = {
  today: "hoy",
  week: "esta semana",
  month: "este mes",
  quarter: "este trimestre",
  year: "este año",
  sprint: "este sprint",
};
