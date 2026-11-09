import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Play,
  Check,
  X,
  Plus,
  Minus,
  Info,
  Shuffle,
  Link2,
  Timer,
  Flag,
  ChevronRight,
  Dumbbell,
  History,
  ListChecks,
} from "lucide-react";
import { useGym, getGym } from "../store";
import { useUI, getUI } from "../components/SheetStack";
import { exOr, esName } from "../lib/exercises";
import { tgEs, eqEs, bpEs } from "../lib/uiEs";
import {
  effectiveRoutine,
  lastEntryFor,
  bestWeightFor,
  buildSets,
  setsDoneActive,
  supersetUnits,
  unitOf,
  setLabel,
  modeOf,
  isBw,
  isPerSide,
  sideReps,
  repStep,
  fmtSec,
  parseMinSec,
  EFFORT,
  effortOf,
  stepEffort,
  capEffort,
} from "../lib/history";
import { fmtNum, fmtDate, todayISO, exCount, DAYN } from "../lib/format";
import { beep, vibrate } from "../lib/sound";
import {
  startFlow,
  exercisePicker,
  exConfigSheet,
  exerciseDetailSheet,
  topWeightSheet,
  finishWorkout,
  workoutCompleteSheet,
  confirmSheet,
} from "../components/sheets";
import { nextPrescription, applyPrescription } from "../lib/progression";
import { Glyph } from "../lib/glyphs";
import { ExerciseImg } from "../components/Media";
import type { Entry, Prescription, SetRec } from "../lib/types";

/* ---------- start chooser (sin entrenamiento activo) ---------- */
function StartChooser({ onGo }: { onGo: (tab: string) => void }) {
  const S = useGym().S;
  const todayR = effectiveRoutine(S, todayISO());
  const todayOvr = S.dayPlan[todayISO()] !== undefined;
  const others = S.routines.filter((r) => r !== todayR);
  const todaySets = todayR
    ? todayR.ex.reduce((n, e) => n + Math.max(1, e.sets || 1), 0)
    : 0;
  const lastSession = todayR
    ? S.workouts
        .slice()
        .reverse()
        .find((w) => w.routineId === todayR.id)
    : null;

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-32 lg:max-w-2xl lg:px-6">
      <div className="mb-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/70">
          Sesión de hoy
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Entrenar</h1>
        <div className="mt-1 text-sm capitalize text-muted-foreground">
          {DAYN[new Date().getDay()]} —{" "}
          {todayR
            ? "hoy toca " + todayR.name
            : "día de descanso, pero nada te lo impide"}
        </div>
      </div>

      {todayR && (
        <div className="relative overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-primary/[0.12] via-primary/[0.04] to-transparent" />
          <div className="relative p-5">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-inner">
                <Glyph name={todayR.emoji} className="h-7 w-7" />
              </span>
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  {todayOvr ? "Reagendado" : "Plan de hoy"}
                </span>
                <h2 className="mt-1 truncate text-2xl font-bold tracking-tight">
                  {todayR.name}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Dumbbell className="h-3.5 w-3.5" /> {exCount(todayR.ex.length)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ListChecks className="h-3.5 w-3.5" /> {todaySets} series
                  </span>
                  {lastSession && (
                    <span className="inline-flex items-center gap-1">
                      <History className="h-3.5 w-3.5" /> Última: {fmtDate(lastSession.d)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              size="lg"
              className="mt-5 w-full rounded-xl shadow-sm"
              onClick={() => startFlow(todayR.id)}
            >
              <Play className="h-4 w-4 fill-current" /> Empezar entrenamiento
            </Button>
          </div>
        </div>
      )}

      {others.length > 0 && (
        <>
          <h4 className="mb-2 mt-6 px-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Otras rutinas
          </h4>
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            {others.map((r) => (
              <button
                key={r.id}
                type="button"
                className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent/60"
                onClick={() => startFlow(r.id)}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <Glyph name={r.emoji} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{r.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {exCount(r.ex.length)} ·{" "}
                    {r.ex.reduce((n, e) => n + Math.max(1, e.sets || 1), 0)} series
                  </span>
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ChevronRight className="h-4 w-4" />
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <h4 className="mb-2 mt-6 px-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        Sin plan
      </h4>
      <button
        type="button"
        className="flex w-full items-center gap-3 rounded-2xl border border-dashed bg-card/60 px-4 py-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
        onClick={() => startFlow(undefined)}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Shuffle className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Entrenamiento libre</span>
          <span className="block text-xs text-muted-foreground">
            Elige los ejercicios sobre la marcha
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {!S.routines.length && (
        <div className="mt-4">
          <Button className="w-full" onClick={() => onGo("plan")}>
            Primero arma un plan
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---------- reloj transcurrido ---------- */
function Elapsed({ start }: { start: number }) {
  const [t, setT] = useState("0:00");
  useEffect(() => {
    const tick = () => {
      const s = Math.floor((Date.now() - start) / 1000);
      setT(Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"));
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [start]);
  return <span>{t}</span>;
}

/* ---------- campo numérico en línea ---------- */
function NumVal({
  value,
  decimal,
  onCommit,
  fmt,
  parse,
  cls,
}: {
  value: number | null | undefined;
  decimal: boolean;
  onCommit: (v: number | null) => void;
  fmt?: (n: number) => string;
  parse?: (raw: string) => number | null;
  cls?: string;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const read = (raw: string) => {
    if (parse) return parse(raw);
    const x = parseFloat(raw);
    return isFinite(x) ? x : null;
  };
  const commit = (raw: string) => {
    onCommit(read(raw));
    setEditing(null);
  };
  if (editing !== null)
    return (
      <input
        autoFocus
        inputMode="decimal"
        className={cn(
          "h-8 w-full min-w-0 rounded-md border bg-background px-1 text-center text-sm font-semibold tabular-nums outline-none ring-1 ring-ring",
          cls
        )}
        value={editing}
        onChange={(e) => setEditing(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
          if (e.key === "Escape") setEditing(null);
        }}
      />
    );
  if (value == null)
    return (
      <button
        type="button"
        className={cn(
          "h-8 w-full min-w-0 rounded-md border bg-background text-sm font-semibold text-muted-foreground hover:bg-accent",
          cls
        )}
        onClick={() => onCommit(null)}
      >
        —
      </button>
    );
  const display = fmt ? fmt(value) : decimal ? fmtNum(value) : String(Math.round(value || 0));
  return (
    <button
      type="button"
      className={cn(
        "h-8 w-full min-w-0 rounded-md border bg-background px-1 text-sm font-semibold tabular-nums hover:bg-accent",
        cls
        )}
      onClick={() => setEditing(display)}
      title="Toca para escribir"
    >
      {display}
    </button>
  );
}

/* ---------- bloque de ejercicio ---------- */
interface Col {
  f: "w" | "r" | "min" | "sec" | "speed" | "rir" | "rpe" | "rest";
  step: number;
  dec: boolean;
  hd: string;
  eff?: string;
  opt?: boolean;
  fmt?: (n: number) => string;
  parse?: (raw: string) => number | null;
  wide?: boolean;
  /** Ayuda al pasar el ratón por la cabecera. */
  tip?: string;
  /** Valor mostrado cuando la serie no tiene nada guardado (p. ej. el descanso global). */
  fallback?: number;
}

/** Ancho mínimo de la tabla para que las celdas no se aplasten. */
const ROW_MIN = "min-w-[336px]";

function ExerciseBlock({
  entryIdx,
  ordinal,
  total,
  compact,
  current,
  onToggle,
  onField,
  onAddSet,
  onRemoveSet,
  onStartTimed,
}: {
  entryIdx: number;
  ordinal: number;
  total: number;
  compact?: boolean;
  current?: boolean;
  onToggle: (i: number) => void;
  onField: (i: number, f: string, v: number | null) => void;
  onAddSet: () => void;
  onRemoveSet: () => void;
  onStartTimed: (i: number) => void;
}) {
  const S = useGym().S;
  const { work } = useUI();
  const entry = S.active!.entries[entryIdx];
  const ex = exOr(entry.id);
  const doneSets = entry.sets.filter((s) => s.done).length;
  const nextSet = entry.sets.findIndex((s) => !s.done);
  const complete = entry.sets.length > 0 && doneSets === entry.sets.length;
  const donePct = entry.sets.length
    ? Math.round((doneSets / entry.sets.length) * 100)
    : 0;
  const mode = modeOf({ ...(entry.target || {}), id: entry.id });
  const cardio = mode === "cardio";
  const timed = mode === "time";
  const last = lastEntryFor(S, entry.id);
  const best = cardio
    ? 0
    : Math.max(bestWeightFor(S, entry.id), (S.exWeights[entry.id] || {}).w || 0);
  const plan: Prescription | null = entry.plan || null;
  const cfg = { ...(entry.target || {}), id: entry.id };
  const bw = !cardio && isBw(cfg);
  const added = bw && entry.sets.some((s) => s.w > 0);
  const loadCol: Col = {
    f: "w",
    step: 2.5,
    dec: true,
    hd: bw ? "Añadido (" + S.unit + ")" : "Peso (" + S.unit + ")",
  };
  const repCol: Col = { f: "r", step: repStep(cfg), dec: false, hd: "Reps" };
  const restCol: Col = {
    f: "rest",
    step: 15,
    dec: false,
    hd: "Descanso",
    fmt: fmtSec,
    parse: parseMinSec,
    wide: true,
    tip: "Minutos. Escribe 3 para 3 min o 2.30 para 2 min 30 s",
    fallback: S.restSec,
  };
  const cols: Col[] = [];
  // La primera columna siempre es Repeticiones. Los segundos de los ejercicios
  // a tiempo no son columna: van en el temporizador de arriba.
  if (cardio) {
    cols.push({ f: "min", step: 1, dec: false, hd: "Duración (min)" });
    cols.push({ f: "speed", step: 0.5, dec: true, hd: "Veloc. (km/h)" });
  } else if (bw && !added) {
    cols.push(repCol);
  } else {
    cols.push(repCol, loadCol);
  }
  const kind = effortOf(S);
  const eff = EFFORT[kind];
  if (mode === "reps" && eff)
    cols.push({ ...eff, eff: kind, dec: true, opt: true, hd: eff.hd } as Col);
  cols.push(restCol);

  const gridTpl = [
    "1.25rem",
    ...cols.map((c) => (c.wide ? "minmax(0,1.3fr)" : "minmax(0,1fr)")),
    ...(timed ? ["1.75rem"] : []),
    "1.75rem",
  ].join(" ");

  // Objetivo de segundos para los ejercicios a tiempo (no es una columna).
  const secTarget = entry.sets[0]?.sec ?? entry.target?.sec ?? 45;
  const bumpSec = (dir: number) =>
    onField(0, "sec", Math.max(1, Math.round(secTarget + dir * 5)));

  const bump = (s: SetRec, i: number, col: Col, dir: number) => {
    if (col.eff) {
      onField(i, col.f, stepEffort(col.eff, s[col.f] as number | null, dir));
      return;
    }
    const raw = ((s[col.f] as number) || 0) + dir * col.step;
    onField(i, col.f, Math.max(0, Math.round(raw * 100) / 100));
  };
  const cell = (s: SetRec, i: number, col: Col) => {
    if (col.eff)
      return (
        <button
          type="button"
          className="h-8 w-full min-w-0 rounded-md border bg-background px-1 text-sm font-semibold tabular-nums hover:bg-accent"
          onClick={() => bump(s, i, col, 1)}
          title="Toca para cambiar"
          aria-label={col.hd}
        >
          {s[col.f] == null ? "–" : fmtNum(s[col.f] as number)}
        </button>
      );
    return (
      <div className="flex items-center justify-center gap-0.5">
        <button
          type="button"
          className="flex h-8 w-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent"
          onClick={() => bump(s, i, col, -1)}
          aria-label={"Quitar " + col.step + " a " + col.hd}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <NumVal
          value={(s[col.f] as number | null) ?? col.fallback ?? null}
          decimal={col.dec}
          fmt={col.fmt}
          parse={col.parse}
          onCommit={(v) =>
            onField(i, col.f, col.eff ? capEffort(col.eff, v) : v)
          }
        />
        <button
          type="button"
          className="flex h-8 w-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent"
          onClick={() => bump(s, i, col, 1)}
          aria-label={"Añadir " + col.step + " a " + col.hd}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="flex items-start gap-3">
        <ExerciseImg ex={ex} className="h-14 w-14 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Ejercicio {ordinal} / {total}
            </span>
            {current && !complete && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Ahora
              </span>
            )}
            {complete && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                <Check className="h-3 w-3" /> Hecho
              </span>
            )}
          </div>
          <h3 className="mt-0.5 text-lg font-bold capitalize leading-tight tracking-tight">
            {esName(ex)}
          </h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {cardio && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                Cardio
              </span>
            )}
            {!cardio && !timed && isPerSide(cfg) && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {fmtNum(sideReps(entry.sets.find((s2) => !s2.done)?.r ?? entry.sets[0]?.r))} por lado
              </span>
            )}
            {(ex.tg || ex.bp) && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {tgEs(ex.tg) || bpEs(ex.bp)}
              </span>
            )}
            {ex.eq && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {eqEs(ex.eq)}
              </span>
            )}
            {best > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Mejor: {fmtNum(best)} {S.unit}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-background/60 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Detalles"
          onClick={() => exerciseDetailSheet(ex)}
        >
          <Info className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              complete ? "bg-emerald-500" : "bg-primary"
            )}
            style={{ width: donePct + "%" }}
          />
        </div>
        <span className="w-8 text-right text-[10px] font-bold tabular-nums text-muted-foreground">
          {doneSets}/{entry.sets.length}
        </span>
      </div>
      {last && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground">
          <History className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <span className="font-semibold text-foreground/80">Última vez</span> ({fmtDate(last.d)}):{" "}
            {last.sets.map((s) => setLabel(entry.id, s, last.target)).join(", ")}
          </span>
        </div>
      )}
      {plan && plan.why && plan.kind !== "off" && (
        <div
          className={cn(
            "mt-2 flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-xs",
            plan.kind === "deload"
              ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500"
              : plan.kind === "up"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {plan.kind === "up" ? <Plus className="mt-0.5 h-3 w-3 shrink-0" /> : plan.kind === "deload" ? <Minus className="mt-0.5 h-3 w-3 shrink-0" /> : null}
          <span>{plan.why.join(" ")}</span>
        </div>
      )}
      {timed && (
        <div className="mt-2 flex items-center gap-2 rounded-xl border bg-background/60 px-2.5 py-1.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Timer className="h-4 w-4" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Objetivo
          </span>
          <div className="ml-auto flex items-center gap-0.5">
            <button
              type="button"
              className="flex h-8 w-5 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
              onClick={() => bumpSec(-5)}
              aria-label="Quitar 5 segundos"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <NumVal
              value={secTarget}
              decimal={false}
              onCommit={(v) => onField(0, "sec", v == null || v <= 0 ? 45 : v)}
            />
            <button
              type="button"
              className="flex h-8 w-5 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
              onClick={() => bumpSec(5)}
              aria-label="Añadir 5 segundos"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="ml-1 text-xs text-muted-foreground">s</span>
          </div>
        </div>
      )}
      <div className="mt-3 overflow-hidden rounded-xl border bg-background/60">
        <div className="overflow-x-auto p-1.5">
          <div
            className={cn(
              ROW_MIN,
              "mb-1 grid items-center gap-x-1 border-b border-border/60 px-1.5 pb-1.5 text-[9px] font-semibold uppercase leading-tight text-muted-foreground sm:text-[10px]"
            )}
            style={{ gridTemplateColumns: gridTpl }}
          >
            <span className="text-center">#</span>
            {cols.map((c, k) => (
              <span key={k} className="truncate text-center" title={c.tip}>
                {c.hd}
              </span>
            ))}
            {timed && <span className="text-center">Timer</span>}
            <span />
          </div>
          {entry.sets.map((s, i) => (
            <div
              key={i}
              className={cn(
                ROW_MIN,
                "grid items-center gap-x-1 rounded-lg px-1.5 py-1.5 transition-colors",
                s.done && "bg-emerald-500/[0.07]",
                !s.done && i === nextSet && "bg-primary/[0.06] ring-1 ring-inset ring-primary/15",
                !s.done && i !== nextSet && i % 2 === 1 && "bg-muted/20"
              )}
              style={{ gridTemplateColumns: gridTpl }}
            >
              <span
                className={cn(
                  "mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                  s.done
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : i === nextSet
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {s.done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {cols.map((c, k) => (
                <div key={k}>{cell(s, i, c)}</div>
              ))}
              {timed && (
                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary disabled:opacity-40"
                  aria-label="Empezar serie"
                  disabled={!!s.done || !!work}
                  onClick={() => onStartTimed(i)}
                >
                  <Play className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                role="checkbox"
                aria-checked={!!s.done}
                aria-label="Marcar serie"
                className={cn(
                  "mx-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  s.done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-transparent hover:bg-accent"
                )}
                onClick={() => onToggle(i)}
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-t border-border/60 bg-muted/20 p-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={entry.sets.length <= 1}
            onClick={onRemoveSet}
          >
            <Minus className="h-3.5 w-3.5" /> Quitar serie
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={onAddSet}>
            <Plus className="h-3.5 w-3.5" /> Añadir serie
          </Button>
        </div>
      </div>
      {compact && <div className="h-1" />}
    </>
  );
}

/* ---------- entrenamiento activo ---------- */
function ActiveWorkout({ onGo }: { onGo: (tab: string) => void }) {
  const S = useGym().S;
  const { startRest, stopRest } = useUI();
  const A = S.active!;
  const units = supersetUnits(A.entries);
  const cur = Math.min(A.cur, Math.max(0, A.entries.length - 1));
  const unit = A.entries.length ? unitOf(units, cur) : [];
  const unitIdx = units.findIndex((u) => u === unit);

  const total = A.entries.reduce((n, e) => n + e.sets.length, 0);
  const done = setsDoneActive(A);

  // Scroll hasta el ejercicio en curso (al terminar uno se avanza solo).
  const refs = useRef<Record<number, HTMLDivElement | null>>({});
  const blockRef = useCallback(
    (idx: number) => (el: HTMLDivElement | null) => {
      refs.current[idx] = el;
    },
    []
  );
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    refs.current[cur]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [cur]);

  const mutEntry = (idx: number, fn: (e: Entry) => void) =>
    getGym().update((s) => {
      fn(s.active!.entries[idx]);
    });
  const setField = (idx: number, i: number, field: string, v: number | null) =>
    mutEntry(idx, (e) => {
      if (v == null) delete (e.sets[i] as Record<string, unknown>)[field];
      else (e.sets[i] as Record<string, unknown>)[field] = v;
      // El peso (y el objetivo de segundos) que pones en una serie se copia a
      // las siguientes: pones 60 en la primera y el resto ya van a 60.
      if (v != null && (field === "w" || field === "sec"))
        for (let j = i + 1; j < e.sets.length; j++)
          (e.sets[j] as Record<string, unknown>)[field] = v;
    });
  const modeAt = (idx: number) =>
    modeOf({ ...(A.entries[idx].target || {}), id: A.entries[idx].id });
  const addSet = (idx: number) =>
    mutEntry(idx, (e) => {
      const l = e.sets[e.sets.length - 1];
      const m = modeOf({ ...(e.target || {}), id: e.id });
      const rest = l ? l.rest : e.target?.rest;
      if (m === "cardio")
        e.sets.push({ min: l ? l.min : e.target?.min || 20, speed: l ? l.speed : e.target?.speed || 8, rest, done: false });
      else if (m === "time")
        e.sets.push({ sec: l ? l.sec : e.target?.sec || 45, w: l ? l.w || 0 : e.target?.weight || 0, rest, done: false });
      else e.sets.push({ w: l ? l.w : 0, r: l ? l.r : e.target?.reps, rest, done: false });
    });
  const removeSet = (idx: number) =>
    mutEntry(idx, (e) => {
      if (e.sets.length > 1) e.sets.pop();
    });

  const startTimed = (idx: number, i: number) => {
    const e = A.entries[idx];
    getUI().startWork(e.sets[i].sec || 45, esName(e.id), (elapsed) => {
      mutEntry(idx, (en) => {
        en.sets[i].sec = elapsed;
      });
      const fresh = getGym().S.active;
      if (fresh && !fresh.entries[idx].sets[i].done) toggle(idx, i);
    });
  };

  const toggle = (idx: number, i: number) => {
    const m = modeAt(idx);
    const cardioEntry = m === "cardio";
    const isLastUnit = unitIdx >= units.length - 1;
    let askTop = false;
    let exJustDone = false;
    let lastExInUnit = false;
    let workoutDone = false;
    mutEntry(idx, (e) => {
      e.sets[i].done = !e.sets[i].done;
      if (e.sets[i].done) {
        beep(S.sound, 1040, 0.12);
        vibrate(30);
        const isLastEx = idx === unit[unit.length - 1];
        lastExInUnit = isLastEx;
        const unitDone = unit.every((ui) =>
          (ui === idx ? e : (getGym().S.active!.entries[ui])).sets.every((x) => x.done)
        );
        // Descanso de la serie marcada; si no tiene uno, el global de ajustes.
        const rs = e.sets[i].rest ?? S.restSec;
        if (isLastEx && !unitDone) {
          if (rs > 0) startRest(rs);
          else stopRest();
        } else if (unitDone) stopRest();
        if (unitDone && isLastUnit) workoutDone = true;
        const loaded =
          m === "reps" &&
          !(isBw({ ...(e.target || {}), id: e.id }) && !e.sets.some((x) => x.w > 0));
        if (e.sets.every((x) => x.done)) {
          exJustDone = true;
          if (loaded && !e.asked) {
            e.asked = true;
            askTop = true;
          }
        }
      }
    });
    if (askTop) topWeightSheet(idx);
    else if (workoutDone) workoutCompleteSheet();
    else if (exJustDone && cardioEntry) toast("Cardio registrado");
    else if (exJustDone && m === "time") toast("Tiempo registrado");
    // La lista entera se ve: al cerrar un ejercicio saltamos al siguiente.
    if (!askTop && !workoutDone && exJustDone && lastExInUnit) {
      const next = units[unitIdx + 1];
      if (next && next[0] !== A.cur)
        getGym().update((s) => {
          s.active!.cur = next[0];
        });
    }
  };

  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-32 lg:max-w-2xl lg:px-6">
      <div className="sticky top-12 z-20 -mx-4 mb-4 border-b bg-background/85 px-4 pb-2.5 pt-1.5 backdrop-blur-md lg:top-0 lg:-mx-6 lg:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 text-destructive transition-colors hover:bg-destructive/10"
            aria-label="Descartar"
            onClick={() =>
              confirmSheet({
                title: "¿Descartar entrenamiento?",
                message: "Las series que llevas registradas se perderán.",
                confirmText: "Descartar",
                danger: true,
                onConfirm: () => {
                  getGym().update((s) => {
                    s.active = null;
                  });
                  stopRest();
                  onGo("home");
                },
              })
            }
          >
            <X className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <div className="truncate text-base font-bold leading-tight">{A.name}</div>
            <div className="mt-0.5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Timer className="h-3 w-3" />
                <Elapsed start={A.start} />
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="tabular-nums">
                {done}/{total} series
              </span>
            </div>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-colors hover:bg-primary/15"
            aria-label="Terminar"
            onClick={finishWorkout}
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                total > 0 && done === total ? "bg-emerald-500" : "bg-primary"
              )}
              style={{ width: pct + "%" }}
            />
          </div>
          <span className="w-8 text-right text-[10px] font-bold tabular-nums text-muted-foreground">
            {pct}%
          </span>
        </div>
      </div>

      {A.entries.length > 0 ? (
        <div className="space-y-3">
          {units.map((u, ui) => {
            const sg = u.length > 1;
            const activeUnit = u.includes(cur);
            return (
              <div
                key={ui}
                className={cn(
                  sg && "rounded-3xl border bg-muted/20 p-2.5 sm:p-3",
                  sg && activeUnit && "border-primary/30 bg-primary/[0.03]"
                )}
              >
                {sg && (
                  <div className="mb-2.5 flex flex-wrap items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                    <Link2 className="h-3.5 w-3.5" /> Superset {ui + 1} / {units.length}
                    <span className="font-normal normal-case tracking-normal text-muted-foreground">
                      — hazlos seguidos, descansa al terminar ambos
                    </span>
                  </div>
                )}
                <div className={cn(sg && "space-y-2.5")}>
                  {u.map((idx, k) => (
                    <div key={idx} ref={blockRef(idx)} className="scroll-mt-28">
                      {sg && k > 0 && (
                        <div className="flex items-center gap-2 py-1.5 text-muted-foreground">
                          <span className="h-px flex-1 bg-border" />
                          <Plus className="h-3 w-3" />
                          <span className="h-px flex-1 bg-border" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl border bg-card p-3 shadow-sm transition-all sm:p-4",
                          idx === cur
                            ? "border-primary/40 shadow-md ring-2 ring-primary/15"
                            : "hover:border-border"
                        )}
                      >
                        <ExerciseBlock
                          entryIdx={idx}
                          ordinal={idx + 1}
                          total={A.entries.length}
                          compact={sg}
                          current={idx === cur}
                          onToggle={(i) => toggle(idx, i)}
                          onField={(i, f, v) => setField(idx, i, f, v)}
                          onAddSet={() => addSet(idx)}
                          onRemoveSet={() => removeSet(idx)}
                          onStartTimed={(i) => startTimed(idx, i)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed bg-card/60 py-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Shuffle className="h-7 w-7" />
          </span>
          <p className="mt-3 text-sm font-semibold">Entrenamiento libre</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Añade tu primer ejercicio para empezar.
          </p>
        </div>
      )}

      <div className="h-3" />
      <Button
        variant="outline"
        className="h-12 w-full rounded-xl border-dashed"
        onClick={() =>
          exercisePicker((ex) =>
            exConfigSheet(
              ex,
              null,
              (cfg) =>
                getGym().update((s) => {
                  const full = { ...cfg, id: ex.id };
                  const r = s.routines.find((r2) => r2.id === s.active!.routineId) || null;
                  const plan = nextPrescription(s, full, r);
                  s.active!.entries.push({
                    id: ex.id!,
                    target: { ...cfg },
                    plan,
                    sets: applyPrescription(buildSets(s, full), plan),
                  });
                  s.active!.cur = s.active!.entries.length - 1;
                }),
              undefined,
              S.routines.find((r) => r.id === S.active!.routineId) || null
            )
          )
        }
      >
        <Plus className="h-4 w-4" /> Añadir ejercicio
      </Button>
      <div className="h-2" />
      {(() => {
        const exDone = A.entries.filter(
          (e) => e.sets.length && e.sets.every((s) => s.done)
        ).length;
        const allDone = A.entries.length > 0 && exDone === A.entries.length;
        return (
          <div className="rounded-2xl border bg-card p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                {exDone}/{A.entries.length} ejercicios completados
              </span>
              <span className="tabular-nums">
                {done}/{total} series
              </span>
            </div>
            <Button
              className={cn("w-full rounded-xl", !allDone && "text-muted-foreground")}
              variant={allDone ? "default" : "outline"}
              onClick={finishWorkout}
            >
              <Flag className="h-4 w-4" />
              {allDone
                ? "Terminar entrenamiento"
                : "Terminar antes · " + exDone + "/" + A.entries.length + " ejercicios"}
            </Button>
          </div>
        );
      })()}
    </div>
  );
}

export default function WorkoutView({ onGo }: { onGo: (tab: string) => void }) {
  const active = useGym().S.active;
  return active ? <ActiveWorkout onGo={onGo} /> : <StartChooser onGo={onGo} />;
}