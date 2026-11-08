import { format, parseISO, startOfWeek } from "date-fns";
import type { PlanDayStatus, PlanSystemMetrics } from "@/lib/planSystems";

/** Un día cuenta como cumplido si se completa al menos el 80% del grupo. */
const GROUP_DONE_THRESHOLD = 0.8;

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function weekKeyOf(day: string): string {
  return format(startOfWeek(parseISO(day), { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export interface AggregateSystemOptions {
  /** Id de la tarjeta agrupada. */
  id: string;
  systemIds: string[];
  systems: Record<string, PlanSystemMetrics>;
  /** Día de hoy en formato yyyy-MM-dd (hora de Cuba). */
  todayKey: string;
  /** Meta manual de la tarjeta; si falta se promedian las metas de sus sistemas. */
  targetPct?: number;
}

/**
 * Convierte varios sistemas en una sola tarjeta. El día se considera cumplido
 * cuando al menos el 80% de los hábitos disponibles del grupo están hechos; si
 * hay avance pero menos del 80%, el día queda como parcial.
 */
export function aggregateSystemMetrics({
  id,
  systemIds,
  systems,
  todayKey,
  targetPct,
}: AggregateSystemOptions): PlanSystemMetrics | null {
  const members = systemIds
    .map(systemId => systems[systemId])
    .filter((system): system is PlanSystemMetrics => !!system);

  if (members.length === 0) return null;
  if (members.length === 1) {
    const only = members[0];
    const singleTargetPct = targetPct ?? only.targetPct;
    const singleTargetDays = only.daysTotal > 0
      ? Math.max(1, Math.round((only.daysTotal * singleTargetPct) / 100))
      : 0;
    return {
      ...only,
      id,
      targetPct: singleTargetPct,
      targetDays: singleTargetDays,
      targetMet: only.daysTotal > 0 ? only.daysDone >= singleTargetDays : null,
    };
  }

  const first = members[0];
  const days = first.days ?? [];
  const status: PlanDayStatus[] = [];
  const spark: number[] = [];
  const availableFlags: boolean[] = [];

  days.forEach((day, index) => {
    const dayStatuses = members.map(member => member.status[index]);
    spark.push(members.reduce((sum, member) => sum + (Number(member.spark[index]) || 0), 0));

    if (day > todayKey) {
      status.push("none");
      availableFlags.push(false);
      return;
    }

    const eligible = dayStatuses.filter(dayStatus => dayStatus !== "rest" && dayStatus != null);

    if (eligible.length === 0) {
      status.push(dayStatuses.every(dayStatus => dayStatus === "rest") ? "rest" : "none");
      availableFlags.push(false);
      return;
    }

    availableFlags.push(true);
    const done = eligible.filter(dayStatus => dayStatus === "done").length;
    const ratio = done / eligible.length;

    if (ratio >= GROUP_DONE_THRESHOLD) {
      status.push("done");
    } else if (done > 0 || eligible.some(dayStatus => dayStatus === "partial")) {
      status.push("partial");
    } else if (eligible.some(dayStatus => dayStatus === "skip")) {
      status.push("skip");
    } else {
      status.push("none");
    }
  });

  const evaluated = status.filter((_, index) => availableFlags[index]);
  const daysDone = evaluated.filter(dayStatus => dayStatus === "done").length;
  const daysTotal = evaluated.length;
  const partialDays = evaluated.filter(dayStatus => dayStatus === "partial").length;
  const daysSkipped = evaluated.filter(dayStatus => dayStatus === "skip").length;
  const restDays = status.filter(dayStatus => dayStatus === "rest").length;
  const compliance = daysTotal > 0 ? Math.round((daysDone / daysTotal) * 100) : null;

  // La racha de hoy todavía está "abierta": si hoy aún no se marca nada, se
  // conserva la racha de ayer (igual que system_habit_streaks en la BD).
  let streak = 0;
  const todayIndex = days.indexOf(todayKey);
  let streakStart = status.length - 1;
  if (todayIndex >= 0 && status[todayIndex] === "none") streakStart = todayIndex - 1;
  for (let index = streakStart; index >= 0; index--) {
    if (!availableFlags[index]) continue;
    if (status[index] === "done") streak += 1;
    else break;
  }

  let bestStreak = 0;
  let run = 0;
  let gapActive = false;
  let maxGap = 0;
  let currentGap = 0;
  let recoveries = 0;

  status.forEach((dayStatus, index) => {
    if (!availableFlags[index]) return;
    if (dayStatus === "done") {
      run += 1;
      bestStreak = Math.max(bestStreak, run);
      currentGap = 0;
      if (gapActive) {
        recoveries += 1;
        gapActive = false;
      }
    } else {
      run = 0;
      currentGap += 1;
      maxGap = Math.max(maxGap, currentGap);
      gapActive = true;
    }
  });

  const weeks = new Map<string, { done: number; available: number }>();
  days.forEach((day, index) => {
    if (!availableFlags[index]) return;
    const key = weekKeyOf(day);
    const entry = weeks.get(key) ?? { done: 0, available: 0 };
    entry.available += 1;
    if (status[index] === "done") entry.done += 1;
    weeks.set(key, entry);
  });
  const totalWeeks = weeks.size;
  const greenWeeks = [...weeks.values()]
    .filter(entry => entry.available > 0 && entry.done / entry.available >= GROUP_DONE_THRESHOLD)
    .length;

  const previousValues = members
    .map(member => member.previousCompliance)
    .filter((value): value is number => value != null);
  const previousCompliance = average(previousValues);
  const trend = compliance != null && previousCompliance != null
    ? Math.round(compliance - previousCompliance)
    : null;

  const groupTargetPct = targetPct ?? Math.round(
    average(members.map(member => member.targetPct)) ?? 80,
  );
  const targetDays = daysTotal > 0
    ? Math.max(1, Math.round((daysTotal * groupTargetPct) / 100))
    : 0;

  const lastDoneIndex = status.reduce(
    (last, dayStatus, index) => (dayStatus === "done" && availableFlags[index] ? index : last),
    -1,
  );

  return {
    id,
    kind: "estructural",
    areaId: first.areaId,
    role: members.some(member => member.role === "ancla") ? "ancla" : "mantenimiento",
    compliance,
    daysDone,
    daysTotal,
    daysSkipped,
    restDays,
    partialDays,
    targetPct: groupTargetPct,
    targetDays,
    targetMet: daysTotal > 0 ? daysDone >= targetDays : null,
    actualMinutes: Math.round(members.reduce((sum, member) => sum + (member.actualMinutes || 0), 0)),
    minimumDose: 1,
    timed: false,
    streak,
    bestStreak,
    maxGap,
    recoveries,
    trend,
    previousCompliance,
    greenWeeks,
    totalWeeks,
    lastDone: lastDoneIndex >= 0 ? days[lastDoneIndex] : null,
    status,
    spark,
    days,
  };
}
