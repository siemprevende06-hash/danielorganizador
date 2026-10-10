import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Maximize2 } from "lucide-react";
import { Link } from "react-router-dom";
import { coverKey } from "@/hooks/useAreaCovers";
import {
  AREA_SYSTEMS,
  DIAGNOSIS_TONE,
  diagnoseArea,
  GROUP_CONFIG,
  type HabitMeta,
} from "@/lib/areaSystemsMap";
import type { PointBArea } from "@/lib/definitions";
import type { AreaScore } from "@/hooks/useAreaScores";
import type { WeekDayStatus } from "@/hooks/useWeekSystemsData";
import type { TodayStripItem } from "@/hooks/useTodayFocusItems";
import { cn } from "@/lib/utils";
import WeekHabitCard from "./WeekHabitCard";

export interface WeekAreaSystemCardProps {
  area: PointBArea;
  score?: AreaScore;
  trackables: HabitMeta[];
  covers: Record<string, string>;
  daysDone: Record<string, number>;
  daysSkipped: Record<string, number>;
  weekMinutes: Record<string, number>;
  weekCount: Record<string, number>;
  weekStatus: Record<string, WeekDayStatus[]>;
  spark: Record<string, number[]>;
  streaks: Record<string, { current: number; best: number }>;
  focusItems?: Record<string, TodayStripItem>;
  daysTotal: number;
  hideCover?: boolean;
}

function DiagnosisBadge({ diagnosis }: { diagnosis: ReturnType<typeof diagnoseArea> }) {
  const tone = DIAGNOSIS_TONE[diagnosis.tone];
  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold", tone.bg, tone.border, tone.text)}>
      <span className="text-xs">{diagnosis.icon}</span>
      {diagnosis.short}
    </div>
  );
}

export default function WeekAreaSystemCard({
  area,
  score,
  trackables,
  covers,
  daysDone,
  daysSkipped,
  weekMinutes,
  weekCount,
  weekStatus,
  spark,
  streaks,
  focusItems,
  daysTotal,
  hideCover,
}: WeekAreaSystemCardProps) {
  const config = AREA_SYSTEMS[area.id];
  const group = GROUP_CONFIG[area.group as keyof typeof GROUP_CONFIG] ?? GROUP_CONFIG.construccion;
  const coverUrl = covers[coverKey("area", area.id)] ?? null;
  const diagnosis = score ? diagnoseArea(score.esfuerzo, score.resultados) : diagnoseArea(0, 0);
  const doneCount = trackables.filter(t => (daysDone[t.id] ?? 0) >= daysTotal && daysTotal > 0).length;

  const renderHabit = (meta: HabitMeta) => {
    const cover = hideCover
      ? undefined
      : covers[coverKey(meta.cover?.type ?? "area", meta.cover?.id ?? meta.id)] ?? coverUrl;
    return (
      <WeekHabitCard
        key={meta.id}
        meta={meta}
        status={weekStatus[meta.id] ?? []}
        spark={spark[meta.id] ?? []}
        daysDone={daysDone[meta.id] ?? 0}
        daysTotal={daysTotal}
        daysSkipped={daysSkipped[meta.id] ?? 0}
        weekMinutes={weekMinutes[meta.id] ?? 0}
        weekCount={weekCount[meta.id]}
        streak={streaks[meta.id]}
        focus={focusItems?.[meta.id]}
        coverUrl={cover}
      />
    );
  };

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="p-3 border-b border-border/40 space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 relative bg-gradient-to-br border border-border/40">
            {hideCover ? (
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-lg">{area.icon}</span>
              </div>
            ) : coverUrl ? (
              <img src={coverUrl} alt={area.label} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-lg">{area.icon}</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold truncate">{area.label}</h3>
            <p className="text-[9px] text-muted-foreground truncate">{config?.vision}</p>
          </div>
          <DiagnosisBadge diagnosis={diagnosis} />
          <Link
            to={`/sistemas/${area.id}`}
            className="size-8 shrink-0 grid place-items-center rounded-lg bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors"
            title="Ver página completa · esfuerzo, resultados y objetivos"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[9px]">
          <div className="rounded-lg bg-foreground/5 px-2 py-1.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Esfuerzo (semana)</span>
              <span className="font-bold">{score?.esfuerzo ?? 0}%</span>
            </div>
            <Progress value={Math.min(100, score?.esfuerzo ?? 0)} className="h-1" indicatorClassName="bg-blue-500" />
          </div>
          <div className="rounded-lg bg-foreground/5 px-2 py-1.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Resultado (semana)</span>
              <span className="font-bold">{score?.resultados ?? 0}%</span>
            </div>
            <Progress value={Math.min(100, score?.resultados ?? 0)} className="h-1" indicatorClassName={group.bar} />
          </div>
        </div>
      </div>

      <div className="p-3 space-y-4">
        {trackables.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <h4 className="text-[13px] font-extrabold uppercase tracking-wide text-foreground">
                Sistema semanal
              </h4>
              <span className={cn("text-[9px] font-medium", doneCount === trackables.length ? "text-emerald-500" : "text-muted-foreground")}>
                {doneCount}/{trackables.length} días completos
              </span>
            </div>
            {config?.habitSections ? (
              <div className="space-y-3">
                {config.habitSections.map(sec => {
                  const secHabits = trackables.filter(t => sec.habitIds.includes(t.id));
                  if (secHabits.length === 0) return null;
                  return (
                    <div key={sec.id} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold uppercase tracking-wide text-foreground flex items-center gap-1.5">
                          {sec.emoji && <span className="text-base leading-none">{sec.emoji}</span>}
                          {sec.title}
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {secHabits.map(renderHabit)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {trackables.map(renderHabit)}
              </div>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "rounded-xl border p-3 text-[10px] leading-relaxed",
              DIAGNOSIS_TONE[diagnosis.tone].border,
              DIAGNOSIS_TONE[diagnosis.tone].bg,
              DIAGNOSIS_TONE[diagnosis.tone].text
            )}
          >
            <span className="font-bold">{diagnosis.icon} Sistema conectado: </span>
            {config?.systemNote ?? "Esta área se nutre de sistemas conectados. Cumple su sistema para que dé resultado."}
          </div>
        )}
      </div>
    </Card>
  );
}
