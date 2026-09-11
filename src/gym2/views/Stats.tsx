import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Target,
  Flame,
  Ruler,
  CalendarDays,
  Dumbbell,
  Trophy,
} from "lucide-react";
import { useGym } from "../store";
import {
  fmtNum,
  fmtDate,
  fmtDur,
  fmtVol,
  todayISO,
  MONTHS,
} from "../lib/format";
import {
  lastBW,
  BODY_METRICS,
  setLabel,
  effectiveRoutineId,
  type BodyMetricKey,
} from "../lib/history";
import { bestSetOf } from "../lib/onerm";
import { loadOfWorkouts, rankOf, MUSCLE_NAME } from "../lib/muscles";
import {
  hasEffort,
  effortSummary,
  effortHistogram,
  BUCKETS,
  scaleName,
  displayScale,
} from "../lib/effort";
import {
  bwSheet,
  goalSheet,
  bodiesSheet,
  bwDeltaColor,
  Segmented,
  workoutDetailSheet,
} from "../components/sheets";
import { Chart, type ChartPoint } from "../components/Chart";
import { Heatmap } from "../components/Heatmap";
import { MuscleMap, MuscleMapLegend } from "../components/MuscleMap";
import { esName } from "../lib/exercises";
import type { GymState, Workout } from "../lib/types";

/** Las estadísticas solo cuentan lo registrado desde esta fecha (antes era demo/ajeno). */
const STATS_FROM = "2026-09-07";

type Period = "today" | "week" | "month";

const PERIOD_LABELS: { value: Period; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
];

const MLS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

function StatsCalendar({ workouts }: { workouts: Workout[] }) {
  const S = useGym().S;
  const [sel, setSel] = useState<string | null>(null);
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const mm = y + "-" + String(m + 1).padStart(2, "0");
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;
  const lastD = new Date(y, m + 1, 0).getDate();
  const todayIso = todayISO();
  const byDay = useMemo(() => {
    const map: Record<string, Workout[]> = {};
    workouts.forEach((w) => {
      (map[w.d] = map[w.d] || []).push(w);
    });
    return map;
  }, [workouts]);
  const hasPlan =
    Object.keys(S.week).some((k) => S.week[Number(k)]) ||
    Object.keys(S.dayPlan).length > 0;
  const selWs = sel ? byDay[sel] || [] : [];
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: lastD }, (_, i) => i + 1),
  ];

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-bold">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          Calendario
          <span className="text-xs font-normal capitalize text-muted-foreground">
            {MONTHS[m]} {y}
          </span>
        </h2>
        <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded bg-primary" /> Entreno
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded bg-muted" /> Descanso
          </span>
        </div>
      </div>
      <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold uppercase text-muted-foreground">
        {MLS.map((d) => (
          <div key={d} className="py-0.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const iso = mm + "-" + String(day).padStart(2, "0");
          const ws = byDay[iso];
          const trained = !!ws && ws.length > 0;
          const rest = hasPlan && effectiveRoutineId(S, iso) === null;
          const isToday = iso === todayIso;
          const future = iso > todayIso;
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (trained) setSel((p) => (p === iso ? null : iso));
              }}
              title={
                trained
                  ? ws.length + (ws.length === 1 ? " entrenamiento" : " entrenamientos")
                  : rest
                  ? "Día de descanso"
                  : ""
              }
              className={cn(
                "relative flex h-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                trained
                  ? sel === iso
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "bg-primary/15 text-primary hover:bg-primary/25"
                  : rest
                  ? "bg-muted/60 text-muted-foreground hover:bg-accent"
                  : "text-muted-foreground/50 hover:bg-accent",
                isToday && "ring-1 ring-primary",
                future && "opacity-30"
              )}
            >
              {day}
              {trained ? (
                <span
                  className={cn(
                    "absolute bottom-1 h-1 w-1 rounded-full",
                    sel === iso ? "bg-current" : "bg-primary"
                  )}
                />
              ) : rest ? (
                <span className="absolute bottom-1 text-[9px] leading-none text-muted-foreground/60">
                  –
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {selWs.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <div className="text-xs font-semibold text-muted-foreground">
            {fmtDate(sel!, true)}
          </div>
          {selWs.map((w) => (
            <div
              key={w.id}
              className="cursor-pointer rounded-xl bg-muted/40 p-3"
              onClick={() => workoutDetailSheet(w)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <Dumbbell className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate text-sm font-bold">{w.name}</span>
                </div>
                <div className="shrink-0 text-[11px] text-muted-foreground">
                  {fmtDur(w.end - w.start)} · {fmtVol(w.vol, S.unit)}
                </div>
              </div>
              {w.prs && w.prs.length > 0 && (
                <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <Trophy className="h-3 w-3" />
                  {w.prs.length} PR{w.prs.length > 1 ? "s" : ""}
                </div>
              )}
              <div className="mt-1.5 space-y-1">
                {w.entries.map((e, ei) => {
                  const done = e.sets.filter((s) => s.done);
                  if (!done.length) return null;
                  const name = e.n || esName(e.id);
                  return (
                    <div
                      key={ei}
                      className="flex items-baseline justify-between gap-2 text-xs"
                    >
                      <span className="truncate font-medium capitalize">{name}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {done.map((s) => setLabel(e.id, s, e.target)).join(" · ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <p className="pt-0.5 text-center text-[10px] text-muted-foreground">
            Toca una tarjeta para ver el detalle completo del entrenamiento.
          </p>
        </div>
      )}
    </div>
  );
}

export default function Stats() {
  const S = useGym().S;
  const [period, setPeriod] = useState<Period>("month");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - ((todayStart.getDay() + 6) % 7));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodStart =
    period === "today"
      ? todayStart.getTime()
      : period === "week"
      ? weekStart.getTime()
      : monthStart.getTime();
  const statsFromT = new Date(STATS_FROM + "T00:00:00").getTime();
  const cutoff = Math.max(periodStart, statsFromT);

  // Solo datos reales (desde STATS_FROM): el resto era demo/ajeno.
  const workouts = useMemo(
    () => S.workouts.filter((w) => w.d >= STATS_FROM),
    [S.workouts]
  );
  const S7 = useMemo<GymState>(
    () => ({ ...S, workouts }),
    [S, workouts]
  );
  const win = workouts.filter(
    (w) => (w.start || new Date(w.d + "T12:00:00").getTime()) > cutoff
  );

  const bw = lastBW(S7);
  const prevBW = S7.bodyweight.length > 1 ? S7.bodyweight[S7.bodyweight.length - 2] : null;
  const delta = bw && prevBW ? bw.w - prevBW.w : null;
  const bwPoints = S7.bodyweight
    .filter((b) => (b.t || new Date(b.d + "T12:00:00").getTime()) > cutoff)
    .map((b) => ({ t: b.t || new Date(b.d).getTime(), y: b.w, d: b.d }));

  const volPoints: ChartPoint[] = win
    .map((w) => ({
      t: w.start || new Date(w.d + "T12:00:00").getTime(),
      y: w.vol || 0,
      d: w.d,
    }))
    .sort((a, b) => a.t - b.t);
  const totalVol = win.reduce((v, w) => v + (w.vol || 0), 0);

  const load = loadOfWorkouts(win);
  const rank = rankOf(load);

  const exIds = Object.keys(
    win.reduce<Record<string, number>>((acc, w) => {
      w.entries.forEach((e) => {
        acc[e.id] = (acc[e.id] || 0) + 1;
      });
      return acc;
    }, {})
  );
  const strong = exIds
    .map((id) => ({ id, series: bestSets1RM(win, id) }))
    .filter((x) => x.series.length)
    .map((x) => ({
      id: x.id,
      best: x.series.reduce(
        (a, b) => (b.y > a.y ? b : a),
        x.series[0]
      ),
    }))
    .sort((a, b) => b.best.y - a.best.y);

  const [sel, setSel] = useState<string | null>(null);
  const selEx =
    (sel && strong.some((x) => x.id === sel) ? sel : strong[0]?.id) || null;
  const selPoints: ChartPoint[] = selEx
    ? bestSets1RM(win, selEx).map((p) => ({ t: p.t, y: p.y, d: p.d, note: p.w + "×" + p.r }))
    : [];
  const bestPoint = selPoints[selPoints.length - 1];

  const days =
    period === "today"
      ? 1
      : period === "week"
      ? 7
      : Math.max(1, Math.ceil((Date.now() - monthStart.getTime()) / 86400000));
  const effort = effortSummary(S7, days);
  const hist = effortHistogram(S7, days);
  const scale = displayScale(S7);

  const mPoints: Record<string, ChartPoint[]> = {};
  BODY_METRICS.forEach((m) => {
    mPoints[m.key] = S7.bodyM
      .filter((b) => b[m.key] != null && b[m.key]! > 0)
      .map((b) => ({ t: b.t || new Date(b.d).getTime(), y: b[m.key]!, d: b.d }));
  });
  const [mSel, setMSel] = useState<BodyMetricKey | null>(null);
  const tracked = BODY_METRICS.filter((m) => mPoints[m.key].length > 0);
  const curM: BodyMetricKey =
    (tracked.some((m) => m.key === mSel) && mSel) ||
    (tracked[0] && tracked[0].key) ||
    "chest";
  const curColor = BODY_METRICS.find((m) => m.key === curM)!.color;

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-32 lg:max-w-5xl lg:px-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Estadísticas</h1>
        <div className="text-sm text-muted-foreground">Cómo va tu progreso</div>
      </div>
      <div className="mb-4">
        <Segmented
          value={period}
          onChange={(v) => setPeriod(v)}
          options={PERIOD_LABELS}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* calendario */}
        <div className="lg:col-span-2">
          <StatsCalendar workouts={workouts} />
        </div>

        {/* peso corporal */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-1.5 gap-y-1">
            <h2 className="text-sm font-bold">Peso corporal</h2>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                className={S7.targetW ? "text-yellow-500" : ""}
                onClick={goalSheet}
              >
                <Target className="h-3.5 w-3.5" />{" "}
                {S7.targetW ? fmtNum(S7.targetW) : "Objetivo"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => bwSheet()}>
                <Plus className="h-3.5 w-3.5" /> Registrar
              </Button>
            </div>
          </div>
          {bw ? (
            <>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold tracking-tight">
                  {fmtNum(bw.w)}{" "}
                  <span className="text-base font-normal text-muted-foreground">
                    {S7.bwUnit}
                  </span>
                </div>
                {!!delta && (
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-sm font-medium",
                      bwDeltaColor(delta, bw.w)
                    )}
                  >
                    {delta > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {fmtNum(Math.abs(delta))}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <Chart
                  points={bwPoints}
                  h={130}
                  unit={S7.bwUnit}
                  goal={S7.targetW}
                  color="#0a84ff"
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sin registros aún.</p>
          )}
        </div>

        {/* medidas corporales */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-bold">
              <Ruler className="h-3.5 w-3.5 text-muted-foreground" /> Medidas corporales
            </h2>
            <Button size="sm" variant="outline" onClick={() => bodiesSheet()}>
              <Plus className="h-3.5 w-3.5" /> Registrar
            </Button>
          </div>
          {tracked.length > 0 ? (
            <>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {tracked.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize transition-colors",
                      curM === m.key
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground"
                    )}
                    onClick={() => setMSel(m.key)}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: curM === m.key ? "currentColor" : m.color }}
                    />
                    {m.label}
                  </button>
                ))}
              </div>
              <Chart points={mPoints[curM]} h={150} unit="cm" color={curColor} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Registra pecho, cintura, brazos, bíceps o muslo (cm) y verás la evolución aquí.
            </p>
          )}
        </div>

        {/* volumen */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">Volumen</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {win.length} {win.length === 1 ? "entreno" : "entrenos"}
            </span>
          </div>
          {volPoints.length ? (
            <>
              <Chart points={volPoints} h={130} unit={S.unit} color="#0ea5e9" />
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  <b className="font-semibold text-foreground">
                    {fmtNum(totalVol)} {S.unit}
                  </b>{" "}
                  en total en el periodo
                </span>
                <span>por entrenamiento</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin entrenamientos en este periodo.
            </p>
          )}
        </div>

        {/* consistencia */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="flex items-center gap-1 text-sm font-bold">
              <Flame className="h-3.5 w-3.5 text-orange-500" /> Consistencia
            </h2>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">
            Los minutos que entrenaste por día en los últimos 12 meses. Cuanto más
            oscuro, más tiempo estuviste en el gym. Toca un día para verlo.
          </p>
          <Heatmap
            S={S7}
            workouts={workouts}
            onDay={(iso) => {
              const w = workouts.find((x) => x.d === iso);
              if (w) workoutDetailSheet(w);
            }}
          />
        </div>

        {/* músculos */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-bold">Músculos trabajados</h2>
          <p className="mb-2 text-xs text-muted-foreground">
            Carga de este periodo según-series
          </p>
          {rank.worked.length ? (
            <>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {rank.worked.map((m) => (
                  <span
                    key={m}
                    className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium"
                  >
                    {MUSCLE_NAME[m]}
                  </span>
                ))}
              </div>
              <MuscleMap load={load} className="mx-auto" />
              <MuscleMapLegend />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin entrenamientos en este periodo.
            </p>
          )}
        </div>

        {/* 1RM */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-bold">Máximo estimado (1RM)</h2>
          {selEx ? (
            <>
              <div className="mb-2 flex items-center justify-between">
                <div className="capitalize">{esName(selEx)}</div>
                {bestPoint && (
                  <div className="text-xs text-muted-foreground">
                    {fmtNum(bestPoint.y)} {S.unit}
                  </div>
                )}
              </div>
              <Chart points={selPoints} h={130} unit={S.unit} color="#8b5cf6" />
              {strong.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {strong.slice(0, 8).map((x) => (
                    <button
                      key={x.id}
                      type="button"
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize transition-colors",
                        selEx === x.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground"
                      )}
                      onClick={() => setSel(x.id)}
                    >
                      {esName(x.id)} {fmtNum(x.best.y)}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Registra series con peso en este periodo para estimar tu 1RM.
            </p>
          )}
        </div>

        {/* esfuerzo */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-bold">Esfuerzo</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase text-muted-foreground">
              {scaleName(scale)}
            </span>
          </div>
          {hasEffort(S7) ? (
            <>
              <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                <StatBox label="Series" value={String(effort.done)} />
                <StatBox label="Registradas" value={String(effort.rated)} />
                <StatBox label="Media RIR" value={effort.avg == null ? "–" : fmtNum(effort.avg)} />
              </div>
              <div className="mb-1 flex items-end gap-1" style={{ height: 48 }}>
                {hist.map((b, i) => (
                  <div
                    key={b.rir}
                    className={cn("flex-1 rounded-t", b.tail ? "bg-primary/25" : "bg-primary/60")}
                    style={{ height: (b.pct || 0) * 48 + 3 }}
                    title={b.rir + " RIR · " + b.n + " series"}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0 RIR (duro)</span>
                <span>10+ RIR (fácil)</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-3 w-3 bg-primary/60" /> suave
                <span className="ml-1 h-3 w-3 bg-primary/25" /> más de {BUCKETS} RIR
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Registra el esfuerzo (RIR/RPE) en las series para ver la dificultad de tu entrenamiento.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 py-2">
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function bestSets1RM(ws: Workout[], exId: string) {
  return ws
    .map((w) => {
      const entry = w.entries.find((e) => e.id === exId);
      const best = entry && bestSetOf(entry);
      return best ? { t: w.start, d: w.d, y: best.est, w: best.w, r: best.r } : null;
    })
    .filter((x) => x)
    .map((x) => x!);
}