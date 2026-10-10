import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Layers, Hammer, Trophy } from "lucide-react";
import { useAreaCovers } from "@/hooks/useAreaCovers";
import { useAreaScores } from "@/hooks/useAreaScores";
import { useSystemStreaks } from "@/hooks/useSystemStreaks";
import { useWeekSystemsData } from "@/hooks/useWeekSystemsData";
import {
  ALL_TRACKABLE_IDS,
  AREA_STATE_COLOR,
  GROUP_CONFIG,
  areaStateColor,
  diagnoseArea,
  getAreaTrackableHabits,
  type AreaStateColor,
  type PointBGroup,
} from "@/lib/areaSystemsMap";
import { useWeekFocusItems } from "@/hooks/useWeekFocusItems";
import { POINT_B_AREAS } from "@/data/pointB2027";
import type { PointBArea } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import WeekAreaSystemCard from "./WeekAreaSystemCard";

const GROUP_ORDER: PointBGroup[] = ["cimientos", "construccion", "recompensas"];

export function WeekSystemsSection({ weekStart, weekEnd }: { weekStart: Date; weekEnd: Date }) {
  const covers = useAreaCovers();
  const { streaks } = useSystemStreaks(ALL_TRACKABLE_IDS);
  const startKey = format(weekStart, "yyyy-MM-dd");
  const endKey = format(weekEnd, "yyyy-MM-dd");
  const { scores } = useAreaScores("sprint", "ambos", { start: startKey, end: endKey });
  const { items: weekFocusItems } = useWeekFocusItems(startKey, endKey);
  const { days, daysDone, daysSkipped, weekMinutes, weekCount, weekStatus, spark } =
    useWeekSystemsData(weekStart, weekEnd, ALL_TRACKABLE_IDS);

  const [activeGroup, setActiveGroup] = useState<PointBGroup | null>(null);

  const scoreById = useMemo(() => Object.fromEntries(scores.map(s => [s.id, s])), [scores]);

  const groups = useMemo(() => {
    const g: Record<PointBGroup, PointBArea[]> = {
      cimientos: [],
      construccion: [],
      recompensas: [],
    };
    for (const area of POINT_B_AREAS) {
      if (area.id === "proposito") continue;
      g[area.group].push(area);
    }
    return g;
  }, []);

  const groupHealth = useMemo(() => {
    const h: Record<PointBGroup, { total: number; atencion: number; ok: number }> = {
      cimientos: { total: 0, atencion: 0, ok: 0 },
      construccion: { total: 0, atencion: 0, ok: 0 },
      recompensas: { total: 0, atencion: 0, ok: 0 },
    };
    for (const s of scores) {
      const area = POINT_B_AREAS.find(a => a.id === s.id);
      if (!area || area.id === "proposito") continue;
      const d = diagnoseArea(s.esfuerzo, s.resultados);
      h[area.group].total++;
      if (d.key === "roto" || d.key === "abandonado") h[area.group].atencion++;
      else if (d.key === "funcionando") h[area.group].ok++;
    }
    return h;
  }, [scores]);

  const areaStates = useMemo(() => {
    const map: Record<string, { color: AreaStateColor; diagnosis: ReturnType<typeof diagnoseArea> }> = {};
    for (const area of POINT_B_AREAS) {
      const s = scoreById[area.id];
      const diagnosis = diagnoseArea(s?.esfuerzo ?? 0, s?.resultados ?? 0);
      map[area.id] = { color: areaStateColor(diagnosis), diagnosis };
    }
    return map;
  }, [scoreById]);

  return (
    <div className="space-y-5">
      {/* ─── Divisiones del Punto B: cada botón muestra los iconos de sus áreas
          internas, coloreados por su estado (verde / rojo / azul / gris) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {GROUP_ORDER.map(g => {
          const cfg = GROUP_CONFIG[g];
          const health = groupHealth[g];
          const Icon = g === "cimientos" ? Layers : g === "construccion" ? Hammer : Trophy;
          const isActive = activeGroup === g;
          return (
            <button
              key={g}
              onClick={() => setActiveGroup(prev => (prev === g ? null : g))}
              aria-pressed={isActive}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition-colors space-y-1.5",
                isActive
                  ? "border-primary bg-primary/10"
                  : "border-border/60 bg-background/60 hover:bg-background"
              )}
            >
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
                <Icon className={cn("h-3.5 w-3.5", cfg.ring)} />
                {cfg.sectionTitle}
              </span>
              <span className="flex flex-wrap items-center gap-1 text-[9px] text-muted-foreground">
                <span>{health.total} áreas</span>
              </span>
              <span className="mt-0.5 flex flex-wrap items-center gap-1 text-[9px]">
                {(["green", "red", "blue", "grey"] as AreaStateColor[]).map(c => {
                  const n = groups[g].filter(a => (areaStates[a.id]?.color ?? "grey") === c).length;
                  if (n === 0) return null;
                  return (
                    <span
                      key={c}
                      title={AREA_STATE_COLOR[c].label}
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded-md border font-bold",
                        AREA_STATE_COLOR[c].chip
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", AREA_STATE_COLOR[c].dot)} />
                      {n}
                    </span>
                  );
                })}
              </span>
            </button>
          );
        })}
      </div>

      {GROUP_ORDER.filter(g => activeGroup === null || activeGroup === g).map(g => {
        const cfg = GROUP_CONFIG[g];
        const areas = groups[g];
        return (
          <section key={g} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
                {cfg.sectionTitle}
              </h2>
              <span className="text-[9px] text-muted-foreground hidden sm:inline">{cfg.sectionNote}</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {areas.map(area => (
                <WeekAreaSystemCard
                  key={area.id}
                  area={area}
                  score={scoreById[area.id]}
                  trackables={getAreaTrackableHabits(area.id)}
                  covers={covers.covers}
                  daysDone={daysDone}
                  daysSkipped={daysSkipped}
                  weekMinutes={weekMinutes}
                  weekCount={weekCount}
                  weekStatus={weekStatus}
                  spark={spark}
                  streaks={streaks}
                  focusItems={weekFocusItems}
                  daysTotal={days.length}
                  hideCover={area.group === "cimientos"}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default WeekSystemsSection;
