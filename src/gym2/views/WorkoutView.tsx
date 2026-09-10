import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Play,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Info,
  Shuffle,
  Link2,
  Timer,
  Moon,
  Flag,
} from "lucide-react";
import { useGym, getGym } from "../store";
import { useUI, getUI } from "../components/SheetStack";
import { exOr } from "../lib/exercises";
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
import { ExerciseIcon } from "../components/Media";
import type { Entry, Prescription, SetRec } from "../lib/types";

/* ---------- start chooser (sin entrenamiento activo) ---------- */
function StartChooser({ onGo }: { onGo: (tab: string) => void }) {
  const S = useGym().S;
  const todayR = effectiveRoutine(S, todayISO());
  const todayOvr = S.dayPlan[todayISO()] !== undefined;
  const others = S.routines.filter((r) => r !== todayR);
  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-32">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Empezar entrenamiento</h1>
        <div className="text-sm text-muted-foreground capitalize">
          {DAYN[new Date().getDay()]} —{" "}
          {todayR
            ? "hoy toca " + todayR.name
            : "día de descanso, pero nada te lo impide"}
        </div>
      </div>
      {todayR && (
        <div className="rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-primary/40">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">
            Plan de hoy{todayOvr ? " · reagendado" : ""}
          </h2>
          <div className="mb-3 flex items-center gap-3">
            <div>
              <div className="text-xl font-bold">{todayR.name}</div>
              <div className="text-xs text-muted-foreground">{exCount(todayR.ex.length)}</div>
            </div>
            <span className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Glyph name={todayR.emoji} className="h-5 w-5 text-primary" />
            </span>
          </div>
          <Button className="w-full" onClick={() => startFlow(todayR.id)}>
            <Play className="h-4 w-4" /> Empezar {todayR.name}
          </Button>
        </div>
      )}
      {others.length > 0 && (
        <>
          <h4 className="mb-1 mt-5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Otras rutinas
          </h4>
          <div className="divide-y divide-border rounded-2xl border bg-card">
            {others.map((r) => (
              <div
                key={r.id}
                className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/60"
                onClick={() => startFlow(r.id)}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Glyph name={r.emoji} className="h-5 w-5" />
                </span>
                <div className="min-w-0 grow">
                  <div className="truncate text-sm font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{exCount(r.ex.length)}</div>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  Empezar
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="h-3" />
      <Button variant="outline" className="w-full" onClick={() => startFlow(undefined)}>
        <Shuffle className="h-4 w-4" /> Entrenamiento libre
      </Button>
      {!S.routines.length && (
        <>
          <div className="h-1.5" />
          <Button className="w-full" onClick={() => onGo("plan")}>
            Primero arma un plan
          </Button>
        </>
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
  nullable,
  onCommit,
}: {
  value: number | null | undefined;
  decimal: boolean;
  nullable?: boolean;
  onCommit: (v: number | null) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  if (editing !== null)
    return (
      <input
        autoFocus
        className="h-8 w-14 rounded-md border bg-background text-center text-sm font-semibold tabular-nums outline-none ring-1 ring-ring"
        value={editing}
        onChange={(e) => setEditing(e.target.value)}
        onBlur={(e) => {
          const x = parseFloat(e.target.value);
          onCommit(isFinite(x) ? x : null);
          setEditing(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const x = parseFloat((e.target as HTMLInputElement).value);
            onCommit(isFinite(x) ? x : null);
            setEditing(null);
          }
          if (e.key === "Escape") setEditing(null);
        }}
      />
    );
  if (value == null)
    return (
      <button
        type="button"
        className="h-8 min-w-14 rounded-md border bg-background text-sm font-semibold text-muted-foreground hover:bg-accent"
        onClick={() => onCommit(null)}
      >
        —
      </button>
    );
  const display = decimal ? fmtNum(value) : String(Math.round(value || 0));
  return (
    <button
      type="button"
      className="h-8 min-w-14 rounded-md border bg-background px-2 text-sm font-semibold tabular-nums hover:bg-accent"
      onClick={() => setEditing(display)}
    >
      {display}
    </button>
  );
}

/* ---------- bloque de ejercicio ---------- */
interface Col {
  f: "w" | "r" | "min" | "sec" | "speed" | "rir" | "rpe";
  step: number;
  dec: boolean;
  hd: string;
  eff?: string;
  opt?: boolean;
}

function ExerciseBlock({
  entryIdx,
  compact,
  onToggle,
  onField,
  onAddSet,
  onRemoveSet,
  onStartTimed,
}: {
  entryIdx: number;
  compact?: boolean;
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
  const col1: Col = cardio
    ? { f: "min", step: 1, dec: false, hd: "Duración (min)" }
    : timed
    ? { f: "sec", step: 5, dec: false, hd: "Segundos" }
    : bw && !added
    ? repCol
    : loadCol;
  const col2: Col | null = cardio
    ? { f: "speed", step: 0.5, dec: true, hd: "Velocidad (km/h)" }
    : timed
    ? bw && !added
      ? null
      : loadCol
    : bw && !added
    ? null
    : repCol;
  const kind = effortOf(S);
  const eff = EFFORT[kind];
  const col3: Col | null =
    mode === "reps" && eff
      ? ({ ...eff, eff: kind, dec: true, opt: true, hd: eff.hd } as Col)
      : null;

  const bump = (s: SetRec, i: number, col: Col, dir: number) => {
    if (col.eff) {
      onField(i, col.f, stepEffort(col.eff, s[col.f] as number | null, dir));
      return;
    }
    const raw = ((s[col.f] as number) || 0) + dir * col.step;
    onField(i, col.f, Math.max(0, Math.round(raw * 100) / 100));
  };
  const cell = (s: SetRec, i: number, col: Col, cls: string) => (
    <div className={cn("flex items-center gap-1", cls)}>
      <button
        type="button"
        className="flex h-8 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40"
        onClick={() => bump(s, i, col, -1)}
        aria-label="Disminuir"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <NumVal
        value={s[col.f] as number | null}
        decimal={col.dec}
        nullable={col.opt}
        onCommit={(v) =>
          onField(i, col.f, col.eff ? capEffort(col.eff, v) : v)
        }
      />
      <button
        type="button"
        className="flex h-8 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40"
        onClick={() => bump(s, i, col, 1)}
        aria-label="Aumentar"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <>
      <ExerciseIcon ex={ex} />
      <div className="mb-1.5 flex items-center justify-between">
        <div className="text-lg font-bold capitalize leading-tight tracking-tight">{ex.n}</div>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
          aria-label="Detalles"
          onClick={() => exerciseDetailSheet(ex)}
        >
          <Info className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
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
            {ex.tg || ex.bp}
          </span>
        )}
        {ex.eq && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {ex.eq}
          </span>
        )}
        {best > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Mejor: {fmtNum(best)} {S.unit}
          </span>
        )}
      </div>
      {last && (
        <div className="mb-1 text-[11px] text-muted-foreground">
          Última vez ({fmtDate(last.d)}):{" "}
          {last.sets.map((s) => setLabel(entry.id, s, last.target)).join(", ")}
        </div>
      )}
      {plan && plan.why && plan.kind !== "off" && (
        <div
          className={cn(
            "mb-1.5 flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-xs",
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
      <div className="mt-2 rounded-2xl border bg-card p-2 shadow-sm">
        <div className="grid grid-cols-[2rem_1fr_1fr_auto] items-center gap-x-2 px-2 pb-1 text-[10px] font-semibold uppercase text-muted-foreground">
          <span />
          <span className={cn(compact && "text-[9px]")}>{col1.hd}</span>
          {col2 && <span>{col2.hd}</span>}
          <span className="w-7" />
        </div>
        {entry.sets.map((s, i) => {
          return (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2 rounded-xl px-2 py-1.5",
                s.done && "opacity-50"
              )}
            >
              <div className="w-4 text-center text-xs font-semibold text-muted-foreground">
                {i + 1}
              </div>
              {cell(s, i, col1, "w grow")}
              {col2 && cell(s, i, col2, "r grow")}
              {col3 && cell(s, i, col3, "eff grow")}
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
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  s.done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-transparent hover:bg-accent"
                )}
                onClick={() => onToggle(i)}
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          );
        })}
        <div className="mt-1 flex gap-2">
          <Button size="sm" variant="outline" disabled={entry.sets.length <= 1} onClick={onRemoveSet}>
            <Minus className="h-3.5 w-3.5" /> Quitar
          </Button>
          <Button size="sm" variant="outline" onClick={onAddSet}>
            <Plus className="h-3.5 w-3.5" /> Añadir
          </Button>
        </div>
      </div>
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
  const isSuperset = unit.length > 1;

  const total = A.entries.reduce((n, e) => n + e.sets.length, 0);
  const done = setsDoneActive(A);

  const mutEntry = (idx: number, fn: (e: Entry) => void) =>
    getGym().update((s) => {
      fn(s.active!.entries[idx]);
    });
  const setField = (idx: number, i: number, field: string, v: number | null) =>
    mutEntry(idx, (e) => {
      if (v == null) delete (e.sets[i] as Record<string, unknown>)[field];
      else (e.sets[i] as Record<string, unknown>)[field] = v;
    });
  const modeAt = (idx: number) =>
    modeOf({ ...(A.entries[idx].target || {}), id: A.entries[idx].id });
  const addSet = (idx: number) =>
    mutEntry(idx, (e) => {
      const l = e.sets[e.sets.length - 1];
      const m = modeOf({ ...(e.target || {}), id: e.id });
      if (m === "cardio")
        e.sets.push({ min: l ? l.min : e.target?.min || 20, speed: l ? l.speed : e.target?.speed || 8, done: false });
      else if (m === "time")
        e.sets.push({ sec: l ? l.sec : e.target?.sec || 45, w: l ? l.w || 0 : e.target?.weight || 0, done: false });
      else e.sets.push({ w: l ? l.w : 0, r: l ? l.r : e.target?.reps, done: false });
    });
  const removeSet = (idx: number) =>
    mutEntry(idx, (e) => {
      if (e.sets.length > 1) e.sets.pop();
    });

  const startTimed = (idx: number, i: number) => {
    const e = A.entries[idx];
    getUI().startWork(e.sets[i].sec || 45, exOr(e.id).n, (elapsed) => {
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
    let workoutDone = false;
    mutEntry(idx, (e) => {
      e.sets[i].done = !e.sets[i].done;
      if (e.sets[i].done) {
        beep(S.sound, 1040, 0.12);
        vibrate(30);
        const isLastExInUnit = idx === unit[unit.length - 1];
        const unitDone = unit.every((ui) =>
          (ui === idx ? e : (getGym().S.active!.entries[ui])).sets.every((x) => x.done)
        );
        if (isLastExInUnit && !unitDone) startRest(S.restSec);
        else if (unitDone) stopRest();
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
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-32">
      <div className="mb-1 flex items-center justify-between">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-destructive hover:bg-accent"
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
        <div className="text-center">
          <div className="font-bold">{A.name}</div>
          <div className="text-xs text-muted-foreground">
            <Elapsed start={A.start} /> · {done}/{total} series
          </div>
        </div>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-primary hover:bg-accent"
          aria-label="Terminar"
          onClick={finishWorkout}
        >
          <Check className="h-5 w-5" />
        </button>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: (total ? (done / total) * 100 : 0) + "%" }}
        />
      </div>

      {A.entries.length > 0 ? (
        <>
          <div className="mb-1.5 text-xs text-muted-foreground">
            {isSuperset
              ? "Superset " + (unitIdx + 1) + " / " + units.length
              : "Ejercicio " + (unitIdx + 1) + " / " + units.length}
          </div>
          {isSuperset ? (
            <div className="rounded-2xl border bg-card p-3 shadow-sm">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Link2 className="h-3.5 w-3.5" /> Superset — hazlos seguidos, descansa al terminar ambos
              </div>
              <div className="space-y-4">
                {unit.map((idx, k) => (
                  <div key={idx}>
                    {k > 0 && <div className="mb-1 text-center text-lg font-bold text-muted-foreground">+</div>}
                    <ExerciseBlock
                      entryIdx={idx}
                      compact
                      onToggle={(i) => toggle(idx, i)}
                      onField={(i, f, v) => setField(idx, i, f, v)}
                      onAddSet={() => addSet(idx)}
                      onRemoveSet={() => removeSet(idx)}
                      onStartTimed={(i) => startTimed(idx, i)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <ExerciseBlock
              entryIdx={cur}
              onToggle={(i) => toggle(cur, i)}
              onField={(i, f, v) => setField(cur, i, f, v)}
              onAddSet={() => addSet(cur)}
              onRemoveSet={() => removeSet(cur)}
              onStartTimed={(i) => startTimed(cur, i)}
            />
          )}
        </>
      ) : (
        <div className="rounded-2xl border py-10 text-center">
          <Shuffle className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Entrenamiento libre — añade tu primer ejercicio.
          </p>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          disabled={unitIdx <= 0}
          onClick={() =>
            getGym().update((s) => {
              s.active!.cur = units[unitIdx - 1][0];
            })
          }
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          disabled={unitIdx < 0 || unitIdx >= units.length - 1}
          onClick={() =>
            getGym().update((s) => {
              s.active!.cur = units[unitIdx + 1][0];
            })
          }
        >
          Siguiente <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="h-1.5" />
      <Button
        variant="outline"
        className="w-full"
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
      <div className="h-1.5" />
      {(() => {
        const exDone = A.entries.filter(
          (e) => e.sets.length && e.sets.every((s) => s.done)
        ).length;
        const allDone = A.entries.length > 0 && exDone === A.entries.length;
        return (
          <Button
            className={cn("w-full", !allDone && "text-muted-foreground")}
            variant={allDone ? "default" : "outline"}
            onClick={finishWorkout}
          >
            <Flag className="h-4 w-4" />
            {allDone
              ? "Terminar entrenamiento"
              : "Terminar antes de tiempo · " + exDone + "/" + A.entries.length + " ejercicios"}
          </Button>
        );
      })()}
    </div>
  );
}

export default function WorkoutView({ onGo }: { onGo: (tab: string) => void }) {
  const active = useGym().S.active;
  return active ? <ActiveWorkout onGo={onGo} /> : <StartChooser onGo={onGo} />;
}