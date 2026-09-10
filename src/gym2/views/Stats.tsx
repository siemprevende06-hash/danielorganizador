import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Plus, Target, Flame, Ruler } from "lucide-react";
import { useGym } from "../store";
import { fmtNum } from "../lib/format";
import { lastBW, BODY_METRICS, type BodyMetricKey } from "../lib/history";
import { best1RM, bestSetOf } from "../lib/onerm";
import { loadOfWorkouts, rankOf, MUSCLE_NAME } from "../lib/muscles";
import { hasEffort, effortSummary, effortHistogram, BUCKETS, scaleName, displayScale } from "../lib/effort";
import { bwSheet, goalSheet, bodiesSheet, bwDeltaColor, Segmented } from "../components/sheets";
import { Chart, type ChartPoint } from "../components/Chart";
import { Heatmap } from "../components/Heatmap";
import { MuscleMap, MuscleMapLegend } from "../components/MuscleMap";
import { exOr, esName } from "../lib/exercises";
import type { GymState } from "../lib/types";

export default function Stats() {
  const S = useGym().S;
  const [weeks, setWeeks] = useState<"4" | "12" | "24">("12");
  const days = Number(weeks) * 7;
  const cutoff = Date.now() - days * 86400000;
  const win = S.workouts.filter((w) => (w.start || new Date(w.d + "T12:00:00").getTime()) > cutoff);

  const bw = lastBW(S);
  const prevBW = S.bodyweight.length > 1 ? S.bodyweight[S.bodyweight.length - 2] : null;
  const delta = bw && prevBW ? bw.w - prevBW.w : null;
  const bwPoints = S.bodyweight
    .filter((b) => (b.t || new Date(b.d).getTime()) > cutoff)
    .map((b) => ({ t: b.t || new Date(b.d).getTime(), y: b.w, d: b.d }));

  const volByWeek = new Map<number, number>();
  win.forEach((w) => {
    const d = new Date(w.start || new Date(w.d + "T12:00:00").getTime());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    d.setHours(12, 0, 0, 0);
    const k = +d;
    volByWeek.set(k, (volByWeek.get(k) || 0) + (w.vol || 0));
  });
  const volPoints: ChartPoint[] = [...volByWeek.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, y]) => ({ t, y }));

  const wkCount = win.length;

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
    .map((id) => ({ id, b1: best1RM(S, id) }))
    .filter((x) => x.b1)
    .sort((a, b) => (b.b1!.est || 0) - (a.b1!.est || 0));
  const [sel, setSel] = useState<string | null>(null);
  const selEx = (sel && exIds.includes(sel) ? sel : strong[0]?.id) || null;
  const selPoints: ChartPoint[] = selEx
    ? bestSets1RM(S, selEx).map((p) => ({ t: p.t, y: p.y, d: p.d, note: p.w + "×" + p.r }))
    : [];
  const bestPoint = selPoints[selPoints.length - 1];

  const effort = effortSummary(S, days);
  const hist = effortHistogram(S, days);
  const scale = displayScale(S);

  const mPoints: Record<string, ChartPoint[]> = {};
  BODY_METRICS.forEach((m) => {
    mPoints[m.key] = S.bodyM
      .filter((b) => b[m.key] != null && b[m.key]! > 0)
      .map((b) => ({ t: b.t || new Date(b.d).getTime(), y: b[m.key]!, d: b.d }));
  });
  const [mSel, setMSel] = useState<BodyMetricKey | null>(null);
  const tracked = BODY_METRICS.filter((m) => mPoints[m.key].length > 0);
  const curM: BodyMetricKey =
    (tracked.some((m) => m.key === mSel) && mSel) || (tracked[0] && tracked[0].key) || "chest";
  const curColor = BODY_METRICS.find((m) => m.key === curM)!.color;

  const periodOpts: { value: "4" | "12" | "24"; label: string }[] = [
    { value: "4", label: "4 sem" },
    { value: "12", label: "3 meses" },
    { value: "24", label: "6 meses" },
  ];

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-32 lg:max-w-5xl lg:px-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Estadísticas</h1>
        <div className="text-sm text-muted-foreground">Cómo va tu progreso</div>
      </div>
      <div className="mb-4">
        <Segmented
          value={weeks}
          onChange={(v) => setWeeks(v)}
          options={periodOpts}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* peso corporal */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">Peso corporal</h2>
            <div className="flex gap-1.5">
              <Button size="sm" variant="ghost" className={S.targetW ? "text-yellow-500" : ""} onClick={goalSheet}>
                <Target className="h-3.5 w-3.5" /> {S.targetW ? fmtNum(S.targetW) : "Objetivo"}
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
                  {fmtNum(bw.w)} <span className="text-base font-normal text-muted-foreground">{S.unit}</span>
                </div>
                {!!delta && (
                  <span className={cn("flex items-center gap-0.5 text-sm font-medium", bwDeltaColor(delta, bw.w))}>
                    {delta > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {fmtNum(Math.abs(delta))}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <Chart points={bwPoints} h={130} unit={S.unit} goal={S.targetW} />
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
              <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {BODY_METRICS.filter((m) => mPoints[m.key].length > 0).map((m) => {
                  const last = mPoints[m.key][mPoints[m.key].length - 1];
                  const prev = mPoints[m.key][mPoints[m.key].length - 2];
                  const d = prev ? last.y - prev.y : null;
                  return (
                    <span key={m.key} className="text-xs text-muted-foreground">
                      {m.label} <b className="font-semibold text-foreground">{fmtNum(last.y)} cm</b>
                      {d != null && d !== 0 && (
                        <span
                          className={cn(
                            "ml-0.5 font-medium",
                            d > 0 ? "text-primary" : "text-destructive"
                          )}
                        >
                          {d > 0 ? "↑" : "↓"}
                          {fmtNum(Math.abs(d))}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
              <Chart points={mPoints[curM]} h={140} unit="cm" color={curColor} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Registra pecho, cintura, cadera, brazo o muslo (cm) y verás la evolución aquí.
            </p>
          )}
        </div>

        {/* volumen */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">Volumen semanal</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {wkCount} {wkCount === 1 ? "entreno" : "entrenos"}
            </span>
          </div>
          <Chart points={volPoints} h={140} unit={S.unit} color="#0ea5e9" />
        </div>

        {/* heatmap */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">Consistencia</h2>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-orange-500" /> últimos 12 meses
            </span>
          </div>
          <Heatmap S={S} />
        </div>

        {/* músculos */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-bold">Músculos trabajados</h2>
          <p className="mb-2 text-xs text-muted-foreground">Carga de este periodo según-series</p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {rank.worked.map((m) => (
              <span key={m} className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium">
                {MUSCLE_NAME[m]}
              </span>
            ))}
          </div>
          <MuscleMap load={load} className="mx-auto" />
          <MuscleMapLegend />
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
                        selEx === x.id ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
                      )}
                      onClick={() => setSel(x.id)}
                    >
                      {esName(x.id)} {fmtNum(x.b1!.est)}
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
          {hasEffort(S) ? (
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

function bestSets1RM(S: GymState, exId: string) {
  return (S.workouts || [])
    .map((w) => {
      const entry = w.entries.find((e) => e.id === exId);
      const best = entry && bestSetOf(entry);
      return best ? { t: w.start, d: w.d, y: best.est, w: best.w, r: best.r } : null;
    })
    .filter((x) => x)
    .map((x) => x!);
}
