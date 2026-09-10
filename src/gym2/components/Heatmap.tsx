import { useEffect, useRef, type ReactNode } from "react";
import { fmtVol, isoOf, todayISO, MONTHS } from "../lib/format";
import { cn } from "@/lib/utils";
import type { GymState } from "../lib/types";

const CELL = ["bg-transparent", "bg-emerald-400/25", "bg-emerald-400/45", "bg-emerald-400/65", "bg-emerald-400/90"];

export function Heatmap({
  S,
  onDay,
}: {
  S: GymState;
  onDay?: (iso: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (wrapRef.current) wrapRef.current.scrollLeft = wrapRef.current.scrollWidth;
  }, []);

  const agg: Record<string, { n: number; vol: number; min: number }> = {};
  S.workouts.forEach((w) => {
    const a = (agg[w.d] = agg[w.d] || { n: 0, vol: 0, min: 0 });
    a.n++;
    a.vol += w.vol || 0;
    a.min += Math.max(0, Math.round(((w.end || w.start) - w.start) / 60000));
  });
  const mins = Object.values(agg)
    .map((a) => a.min)
    .filter((v) => v > 0)
    .sort((a, b) => a - b);
  const q = (p: number) =>
    mins.length ? mins[Math.min(mins.length - 1, Math.floor(p * mins.length))] : 0;
  const t1 = q(0.25);
  const t2 = q(0.5);
  const t3 = q(0.75);
  const level = (a: { min: number } | undefined) =>
    !a ? 0 : !a.min ? 1 : a.min >= t3 ? 4 : a.min >= t2 ? 3 : a.min >= t1 ? 2 : 1;

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const end = new Date(today);
  end.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const start = new Date(end);
  start.setDate(end.getDate() - 52 * 7);

  const months: ReactNode[] = [];
  const cols: ReactNode[] = [];
  let lastMonth = -1;
  const todayIso = todayISO();
  for (let wk = 0; wk <= 52; wk++) {
    const colStart = new Date(start);
    colStart.setDate(start.getDate() + wk * 7);
    const mo = colStart.getMonth();
    const showM = mo !== lastMonth && colStart.getDate() <= 7 && wk < 51;
    months.push(
      <span key={wk} className="text-[10px] text-muted-foreground">
        {showM ? MONTHS[mo] : ""}
      </span>
    );
    if (colStart.getDate() <= 7) lastMonth = mo;
    const cells: React.ReactNode[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(colStart);
      day.setDate(colStart.getDate() + d);
      const key = isoOf(day);
      const a = agg[key];
      const future = day > today;
      cells.push(
        <div
          key={d}
          className={cn(
            "h-3 w-3 rounded-[3px]",
            CELL[level(a)],
            key === todayIso && "ring-2 ring-ring",
            future && "opacity-30"
          )}
          title={
            key +
            (a
              ? ` · ${a.n} entrenamiento${a.n === 1 ? "" : "s"} · ${a.min} min · ${fmtVol(a.vol, S.unit)}`
              : "")
          }
          onClick={a ? () => onDay && onDay(key) : undefined}
        />
      );
    }
    cols.push(
      <div key={wk} className="flex flex-col gap-[3px]">
        {cells}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div ref={wrapRef} className="overflow-x-auto">
        <div className="flex w-max flex-col gap-1 pl-8 pr-2">
          <div className="flex gap-[3px]">{months}</div>
          <div className="flex gap-1">
            <div className="flex w-7 shrink-0 flex-col items-end gap-[3px] text-[10px] leading-[12px] text-muted-foreground">
              <span>Lu</span>
              <span />
              <span>Mi</span>
              <span />
              <span>Vi</span>
              <span />
              <span />
            </div>
            <div className="flex gap-[3px]">{cols}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Menos tiempo
        {CELL.map((c) => (
          <span key={c} className={cn("h-3 w-3 rounded-[3px]", c)} />
        ))}
        Más tiempo
      </div>
    </div>
  );
}