import { useEffect, useState, type ReactNode } from "react";
import { toast as notify } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { getGym, useGym } from "../store";
import { getUI } from "./SheetStack";
import { markGymDayInDaily, syncRestDays } from "../lib/dailySync";
import { Stepper } from "./Stepper";
import { ExerciseIcon } from "./Media";
import { MuscleMap } from "./MuscleMap";
import {
  EXIDX,
  allExercises,
  BODYPARTS,
  equipmentOf,
  isCardio,
  isBodyweightEq,
  esName,
  type AnyExercise,
  type Ex,
} from "../lib/exercises";
import {
  fmtNum,
  fmtDate,
  fmtVol,
  todayISO,
  uid,
  exCount,
  durPart,
  DAYN,
} from "../lib/format";
import {
  defaultConfig,
  modeOf,
  isBw,
  isPerSide,
  sideReps,
  setLabel,
  buildSets,
  lastBW,
  bestWeightFor,
  lastEntryFor,
  setsDone,
  setsDoneActive,
  supersetUnits,
  unitOf,
  effectiveRoutineId,
  workoutVolume,
  cleanupSg,
} from "../lib/history";
import { estimate1RM, best1RM, REP_CAP } from "../lib/onerm";
import {
  nextPrescription,
  applyPrescription,
  policyFor,
  defaultIncrement,
  POLICIES_FOR,
  POLICY_NAME,
  POLICY_DESC,
  MAX_BW_SETS,
} from "../lib/progression";
import { loadOfWorkouts } from "../lib/muscles";
import { beep } from "../lib/sound";
import { starterRoutines, danielRoutines } from "../lib/starter";
import { Glyph, glyphOf, GLYPH_GROUPS } from "../lib/glyphs";
import { MONTHS_LONG, fmtDur } from "../lib/format";
import { BODY_METRICS, lastBodyM } from "../lib/history";
import type {
  BodyMEntry,
  CustomEx,
  Entry,
  ExConfig,
  Routine,
  Workout,
} from "../lib/types";

const S = () => getGym().S;
const update = (mut: (s: ReturnType<typeof S>) => void) => getGym().update(mut);
const ui = () => getUI();

/* ============================ Segmented ============================ */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === o.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ============================ SelectRow ============================ */
export function SelectRow({
  icon,
  title,
  value,
  options,
  onChange,
  sheetTitle,
  desc,
}: {
  icon?: ReactNode;
  title: string;
  value: string;
  options: { value: string; label: string; subtitle?: string }[];
  onChange: (v: string) => void;
  sheetTitle?: string;
  desc?: string;
}) {
  const cur = options.find((o) => o.value === value);
  return (
    <div role="button" tabIndex={0} onClick={() => ui().open((close) => (
      <div>
        <h3 className="text-lg font-bold">{sheetTitle || title}</h3>
        <div className="mt-2 space-y-0.5">
          {options.map((o) => (
            <div key={o.value} className={rowCls()} onClick={() => { close(); onChange(o.value); }}>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{o.label}</div>
                {o.subtitle && <div className="text-xs text-muted-foreground">{o.subtitle}</div>}
              </div>
              {o.value === value && <span className="text-primary">✓</span>}
            </div>
          ))}
        </div>
      </div>
    ))}
      className="flex w-full items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-left"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon || "⚙"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
        <div className="truncate text-xs capitalize text-muted-foreground">{cur ? cur.label : value}</div>
      </div>
      <span className="text-muted-foreground">›</span>
    </div>
  );
}

/* ============================ starter plan ============================ */
export function loadStarterPlan() {
  const [push, pull, legs] = starterRoutines();
  update((st) => {
    st.routines.push(push, pull, legs);
    st.week[1] = push.id;
    st.week[3] = pull.id;
    st.week[5] = legs.id;
  });
  notify("Plan inicial cargado — Lu Push · Mi Pull · Vi Legs");
}

/** Carga la rutina DUP de Daniel: Lunes/Martes/Jueves/Viernes con progresión automática. */
export function loadDanielPlan() {
  const [lun, mar, jue, vie] = danielRoutines();
  update((st) => {
    st.routines.push(lun, mar, jue, vie);
    st.week[1] = lun.id; // Lunes — Torso Fuerza
    st.week[2] = mar.id; // Martes — Piernas Hipertrofia
    st.week[4] = jue.id; // Jueves — Torso Hipertrofia
    st.week[5] = vie.id; // Viernes — Piernas Fuerza
  });
  syncRestDays(S());
  notify("Plan DUP cargado — Lu Torso F · Ma Piernas H · Ju Torso H · Vi Piernas F");
}

/* ============================ target weight colour ============================ */
export function bwDeltaColor(delta: number | null | undefined, currentW: number) {
  if (!delta) return "text-muted-foreground";
  const st = S();
  if (!st.targetW) return "text-foreground";
  const up = st.targetW > currentW;
  return (delta > 0) === up ? "text-primary" : "text-destructive";
}

/* ============================ glyph picker ============================ */
export const glyphPicker = (current: string | undefined, onPick: (g: string) => void) => {
  const cur = glyphOf(current);
  return ui().open((close) => (
    <div>
      <h3 className="text-lg font-bold">Elige un icono</h3>
      {GLYPH_GROUPS.map((g) => (
        <div key={g.key} className="mb-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {g.key}
          </div>
          <div className="flex flex-wrap gap-2">
            {g.items.map((nm) => (
              <button
                key={nm}
                type="button"
                className={
                  "flex h-10 w-10 items-center justify-center rounded-lg border text-foreground transition-colors " +
                  (nm === cur
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-accent")
                }
                onClick={() => { close(); onPick(nm); }}
                aria-label={nm}
              >
                <Glyph name={nm} className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  ));
};

/* ============================ weight input ============================ */
const W_LO = 1;
const wHi = (unit: string) => (unit === "lb" ? 660 : 300);

function WeightInput({
  value,
  setValue,
  unit,
}: {
  value: number;
  setValue: (v: number) => void;
  unit: string;
}) {
  const W_HI = wHi(unit);
  const clamp = (x: number) =>
    Math.max(W_LO, Math.min(W_HI, Math.round((x || 0) * 10) / 10));
  const sv = Math.max(W_LO, Math.min(W_HI, value));
  const onSlide = (v: number) => setValue(clamp(v));
  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onSlide(value - 0.1)}
          aria-label="menos 0.1"
        >
          −
        </Button>
        <div className="w-32 text-center text-3xl font-bold tabular-nums">
          {fmtNum(value)}
          <span className="text-sm font-medium text-muted-foreground"> {unit}</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onSlide(value + 0.1)}
          aria-label="más 0.1"
        >
          +
        </Button>
      </div>
      <div className="flex justify-center gap-1.5">
        {[-1, -0.5, 0.5, 1].map((d) => (
          <Button
            key={d}
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onSlide(value + d)}
          >
            {d > 0 ? "+" : ""}
            {d}
          </Button>
        ))}
      </div>
      <Slider
        value={[sv]}
        min={W_LO}
        max={W_HI}
        step={0.5}
        onValueChange={(v) => onSlide(v[0])}
      />
    </div>
  );
}

/* ============================ confirm ============================ */
interface ConfirmOpts {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm?: () => void;
}
export function confirmSheet(opts: ConfirmOpts) {
  const h = ui().open(
    (close) => (
      <div className="py-2 text-center">
        {opts.title && <h3 className="mb-2 text-lg font-bold">{opts.title}</h3>}
        {opts.message && (
          <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
            {opts.message}
          </p>
        )}
        <Button
          variant={opts.danger ? "destructive" : "default"}
          className="w-full"
          onClick={() => {
            close();
            if (opts.onConfirm) opts.onConfirm();
          }}
        >
          {opts.confirmText || "Confirmar"}
        </Button>
        <div className="h-2" />
        <Button variant="ghost" className="w-full text-muted-foreground" onClick={close}>
          {opts.cancelText || "Cancelar"}
        </Button>
      </div>
    ),
    { kind: "center" }
  );
  return h;
}

/* ============================ body weight ============================ */
function BwContent({
  required,
  onDone,
  close,
}: {
  required?: boolean;
  onDone?: (n: number | null) => void;
  close: () => void;
}) {
  const st = S();
  const unit = st.bwUnit;
  const bw = lastBW(st);
  const [v, setV] = useState(bw ? bw.w : 70);
  const save = () => {
    const n = Math.round((v || 0) * 10) / 10;
    if (!n || n <= 0) {
      notify("Introduce un peso válido");
      return;
    }
    update((s) => {
      const iso = todayISO();
      const ex = s.bodyweight.find((b) => b.d === iso);
      if (ex) {
        ex.w = n;
        ex.t = Date.now();
      } else s.bodyweight.push({ d: iso, w: n, t: Date.now() });
      s.bodyweight.sort((a, b) => (a.d < b.d ? -1 : 1));
    });
    close();
    if (onDone) onDone(n);
    else notify("Peso guardado");
  };
  const recent = [...st.bodyweight].reverse().slice(0, 3);
  const delEntry = (d: string) =>
    update((s) => {
      s.bodyweight = s.bodyweight.filter((b) => b.d !== d);
    });
  return (
    <div>
      <h3 className="text-lg font-bold">
        {required ? "Registro rápido" : "Registrar peso"}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {required
          ? "Ajusta tu peso con la regleta — se guarda antes de cada sesión para que la curva sea fiel."
          : "Hoy, " + fmtDate(todayISO(), true)}
      </p>
      <WeightInput value={v} setValue={setV} unit={unit} />
      <div className="h-3" />
      <Button className="w-full" onClick={save}>
        {required ? "Guardar y empezar" : "Guardar"}
      </Button>
      {required && (
        <>
          <div className="h-1.5" />
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => {
              close();
              if (onDone) onDone(null);
            }}
          >
            Empezar sin pesarme
          </Button>
        </>
      )}
      {!required && recent.length > 0 && (
        <>
          <h4 className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Pesajes recientes
          </h4>
          {recent.map((b) => (
            <div
              key={b.d}
              className="flex items-center justify-between border-b border-border py-2 text-sm"
            >
              <span className="text-muted-foreground">{fmtDate(b.d, true)}</span>
              <span className="flex items-center gap-3">
                <b>{fmtNum(b.w)} {unit}</b>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive"
                  onClick={() => delEntry(b.d)}
                  aria-label="borrar"
                >
                  🗑
                </Button>
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
export const bwSheet = (opts: { required?: boolean; onDone?: (n: number | null) => void } = {}) =>
  ui().open((close) => (
    <BwContent required={opts.required} onDone={opts.onDone} close={close} />
  ), { locked: !!opts.required });

/* ============================ target weight ============================ */
function GoalContent({ close }: { close: () => void }) {
  const st = S();
  const bw = lastBW(st);
  const [v, setV] = useState(st.targetW || (bw ? bw.w : 70));
  return (
    <div>
      <h3 className="text-lg font-bold">Peso objetivo</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Se dibuja como una línea en las gráficas de peso, y las subidas/bajadas se
        colorean según se acerquen a esa meta.
      </p>
      <WeightInput value={v} setValue={setV} unit={st.bwUnit} />
      <div className="h-3" />
      <Button
        className="w-full"
        onClick={() => {
          const n = Math.round((v || 0) * 10) / 10;
          if (!n || n <= 0) {
            notify("Introduce un peso válido");
            return;
          }
          update((s) => {
            s.targetW = n;
          });
          close();
          const b = lastBW(S());
          notify(
            "Objetivo: " + fmtNum(n) + " " + st.bwUnit +
              (b ? " (faltan " + fmtNum(Math.abs(n - b.w)) + ")" : "")
          );
        }}
      >
        Guardar objetivo
      </Button>
      {st.targetW && (
        <>
          <div className="h-1.5" />
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              update((s) => {
                s.targetW = null;
              });
              close();
              notify("Objetivo eliminado");
            }}
          >
            Quitar objetivo
          </Button>
        </>
      )}
    </div>
  );
}
export const goalSheet = () => ui().open((close) => <GoalContent close={close} />);

/* ============================ body measurements (cm) ============================ */
export const bodiesSheet = () => ui().open((close) => <BodiesContent close={close} />);

function BodiesContent({ close }: { close: () => void }) {
  const st = useGym().S;
  const last = lastBodyM(st);
  const [vals, setVals] = useState<Record<string, number>>(() => {
    const o: Record<string, number> = {};
    BODY_METRICS.forEach((m) => {
      o[m.key] = last && last[m.key] ? last[m.key]! : 0;
    });
    return o;
  });
  const save = () => {
    const data: Partial<BodyMEntry> = { d: todayISO(), t: Date.now() };
    BODY_METRICS.forEach((m) => {
      const v = Math.round((vals[m.key] || 0) * 10) / 10;
      if (v > 0) data[m.key] = v;
    });
    update((s) => {
      const iso = todayISO();
      const ex = s.bodyM.find((b) => b.d === iso);
      if (ex) Object.assign(ex, data);
      else s.bodyM.push(data as BodyMEntry);
      s.bodyM.sort((a, b) => (a.d < b.d ? -1 : 1));
    });
    close();
    notify("Medidas guardadas");
  };
  const recent = [...st.bodyM].reverse().slice(0, 3);
  const delEntry = (d: string) =>
    update((s) => {
      s.bodyM = s.bodyM.filter((b) => b.d !== d);
    });
  return (
    <div>
      <h3 className="text-lg font-bold">Medidas corporales</h3>
      <p className="mt-1 mb-3 text-xs text-muted-foreground">
        Cinta métrica en centímetros: apunta las zonas que mides y verás la evolución en Estadísticas.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {BODY_METRICS.map((m) => (
          <Stepper
            key={m.key}
            label={m.label + " (cm)"}
            value={vals[m.key]}
            step={0.5}
            min={0}
            max={300}
            onChange={(v) => setVals((p) => ({ ...p, [m.key]: v }))}
          />
        ))}
      </div>
      <div className="h-3" />
      <Button className="w-full" onClick={save}>
        Guardar medidas
      </Button>
      {recent.length > 0 && (
        <>
          <h4 className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Registros recientes
          </h4>
          {recent.map((b) => (
            <div
              key={b.d}
              className="flex items-center justify-between border-b border-border py-2 text-sm"
            >
              <span className="shrink-0 text-muted-foreground">{fmtDate(b.d, true)}</span>
              <span className="flex min-w-0 items-center gap-3">
                <span className="truncate text-xs">
                  {BODY_METRICS.filter((m) => b[m.key]).map((m) => (
                    <span key={m.key} className="mr-2">
                      {m.label} {fmtNum(b[m.key]!)} cm
                    </span>
                  ))}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 shrink-0 p-0 text-destructive"
                  onClick={() => delEntry(b.d)}
                  aria-label="borrar"
                >
                  🗑
                </Button>
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* ============================ settings ============================ */
export const settingsSheet = () =>
  ui().open((close) => (
    <div>
      <h3 className="text-lg font-bold">Ajustes</h3>
      <div className="mt-1 mb-3 text-xs text-muted-foreground">
        Unidad, descanso, sonido y cómo registrar el esfuerzo.
      </div>
      <SettingsContent close={close} />
    </div>
  ));

const KG_LB = 2.2046226218;
const round1 = (x: number) => Math.round(x * 10) / 10;

/** Convierte solo pesos de ejercicios: mancuernas, barras, rutinas, series y volumen. */
function convertExerciseWeights(s: ReturnType<typeof S>, to: "kg" | "lb") {
  const k = to === "lb" ? KG_LB : 1 / KG_LB;
  Object.values(s.exWeights || {}).forEach((e) => (e.w = round1(e.w * k)));
  (s.routines || []).forEach((r) =>
    (r.ex || []).forEach((e) => {
      if (e.weight && e.weight > 0) e.weight = round1(e.weight * k);
    })
  );
  const convEntries = (es: Entry[]) =>
    es.forEach((e) => {
      if (e.topW != null && e.topW > 0) e.topW = round1(e.topW * k);
      if (e.target && e.target.weight && e.target.weight > 0)
        e.target.weight = round1(e.target.weight * k);
      e.sets.forEach((s2) => {
        if (s2.w != null && s2.w > 0) s2.w = round1(s2.w * k);
      });
    });
  (s.workouts || []).forEach((w) => convEntries(w.entries));
  if (s.active) convEntries(s.active.entries);
}

/** Convierte solo peso corporal: pesajes, objetivo y el peso anotado en los entrenos. */
function convertBwWeights(s: ReturnType<typeof S>, to: "kg" | "lb") {
  const k = to === "lb" ? KG_LB : 1 / KG_LB;
  (s.bodyweight || []).forEach((b) => (b.w = round1(b.w * k)));
  if (s.targetW != null) s.targetW = round1(s.targetW * k);
  (s.workouts || []).forEach((w) => {
    if (w.bw != null && w.bw > 0) w.bw = round1(w.bw * k);
  });
  if (s.active && s.active.bw != null && s.active.bw > 0)
    s.active.bw = round1(s.active.bw * k);
}

function SettingsContent({ close }: { close: () => void }) {
  const st = useGym().S;
  const eff = st.showRir ? "rir" : st.effort || "none";
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 text-sm font-medium">Unidad de los ejercicios</div>
        <Segmented
          value={st.unit}
          onChange={(v) => {
            if (st.unit === v) return;
            update((s) => {
              convertExerciseWeights(s, v as "kg" | "lb");
              s.unit = v as "kg" | "lb";
            });
          }}
          options={[{ value: "kg", label: "kg" }, { value: "lb", label: "lb" }]}
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          Pesos de mancuernas, barras, máquinas y tu objetivo de peso corporal se mantienen aparte.
        </p>
      </div>
      <div className="flex items-center justify-between rounded-xl border px-3 py-2.5">
        <div>
          <div className="text-sm font-medium">Peso corporal (switch)</div>
          <div className="text-xs text-muted-foreground">
            Unidad para tu peso y el objetivo:{" "}
            <span className="font-semibold capitalize">{st.bwUnit}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-semibold",
              st.bwUnit === "kg" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            kg
          </span>
          <Switch
            checked={st.bwUnit === "lb"}
            onCheckedChange={(v) => {
              const to = v ? "lb" : "kg";
              if (st.bwUnit === to) return;
              update((s) => {
                convertBwWeights(s, to);
                s.bwUnit = to;
              });
            }}
          />
          <span
            className={cn(
              "text-xs font-semibold",
              st.bwUnit === "lb" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            lb
          </span>
        </div>
      </div>
      <div>
        <div className="mb-1 text-sm font-medium">
          Descanso entre series · {fmtNum(st.restSec)} s
        </div>
        <Segmented
          value={String(st.restSec)}
          onChange={(v) => update((s) => { s.restSec = Number(v); })}
          options={["60", "90", "120", "180"].map((x) => ({ value: x, label: x + "s" }))}
        />
      </div>
      <div className="flex items-center justify-between rounded-xl border px-3 py-2.5">
        <div>
          <div className="text-sm font-medium">Sonido</div>
          <div className="text-xs text-muted-foreground">Bips y vibración</div>
        </div>
        <Switch
          checked={st.sound}
          onCheckedChange={(v) => update((s) => { s.sound = v; })}
        />
      </div>
      <div>
        <div className="mb-1 text-sm font-medium">Esfuerzo por serie</div>
        <Segmented
          value={eff}
          onChange={(v) => update((s) => {
            s.effort = v === "none" ? "none" : v as "rir" | "rpe";
            s.showRir = v === "rir";
          })}
          options={[
            { value: "none", label: "Apagado" },
            { value: "rir", label: "RIR" },
            { value: "rpe", label: "RPE" },
          ]}
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          RIR = reps en reserva · RPE = escala 1–10. Se anota en cada serie de repeticiones.
        </p>
      </div>
      <Button
        variant="destructive"
        className="w-full"
        disabled={st.bodyweight.length === 0 && st.targetW == null}
        onClick={() =>
          confirmSheet({
            title: "¿Borrar todos los pesajes?",
            message:
              "Se eliminarán todos los registros de peso corporal y el objetivo. Esta acción no se puede deshacer.",
            confirmText: "Sí, borrar todo",
            cancelText: "Cancelar",
            danger: true,
            onConfirm: () => {
              update((s) => {
                s.bodyweight = [];
                s.targetW = null;
              });
              notify("Historial de peso borrado");
            },
          })
        }
      >
        Borrar datos de peso
      </Button>
      <Button className="w-full" onClick={close}>
        Hecho
      </Button>
    </div>
  );
}

/* ============================ exercise picker ============================ */
function usageMap(st: ReturnType<typeof S>) {
  const u: Record<string, number> = {};
  st.routines.forEach((r) =>
    r.ex.forEach((e) => {
      u[e.id!] = (u[e.id!] || 0) + 1;
    })
  );
  st.workouts.forEach((w) =>
    w.entries.forEach((e) => {
      u[e.id] = (u[e.id] || 0) + 1;
    })
  );
  return u;
}

export function exercisePicker(onPick: (ex: AnyExercise) => void) {
  ui().open((close) => (
    <PickerContent onPick={(ex) => { close(); onPick(ex); }} />
  ));
}

function rowCls() {
  return "flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-accent/60";
}

function PickerContent({ onPick }: { onPick: (ex: AnyExercise) => void }) {
  const st = useGym().S;
  const usage = usageMap(st);
  const [q, setQ] = useState("");
  const [bp, setBp] = useState("");
  const [eq, setEq] = useState("");
  const [shown, setShown] = useState(50);
  const ql = q.toLowerCase().trim();
  const all = allExercises(st);
  let base = all.filter(
    (e) =>
      (bp === "★" ? usage[e.id] : !bp || e.bp === bp) &&
      (!ql ||
        e.n.toLowerCase().includes(ql) ||
        (e.tg || "").includes(ql) ||
        (e.eq || "").includes(ql) ||
        ((e as { desc?: string }).desc || "").toLowerCase().includes(ql))
  );
  if (bp === "★") base = [...base].sort((a, b) => usage[b.id] - usage[a.id] || (a.n < b.n ? -1 : 1));
  const eqOpts = equipmentOf(base as unknown as Ex[]);
  const eqOn = eqOpts.includes(eq) ? eq : "";
  const f = (eqOn ? base.filter((e) => e.eq === eqOn) : base) as AnyExercise[];
  const chosenCount = Object.keys(usage).length;
  const chips = (items: { label: string; value: string; active: boolean }[]) => (
    <div className="flex flex-wrap gap-1.5">
      {items.map((c) => (
        <button
          key={c.value}
          type="button"
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
            c.active
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:bg-accent"
          )}
          onClick={() => {
            setBp(c.value);
            setEq("");
            setShown(50);
          }}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
  return (
    <div>
      <h3 className="text-lg font-bold">Añadir ejercicio</h3>
      <div className="relative mt-3">
        <Input
          autoFocus
          placeholder={"Buscar " + all.length + " ejercicios…"}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setShown(50);
          }}
        />
      </div>
      <div className="mt-3 space-y-2">
        {chips([
          ...(chosenCount > 0 ? [{ label: "★ Chosen (" + chosenCount + ")", value: "★", active: bp === "★" }] : []),
          { label: "Todo", value: "", active: !bp },
          ...BODYPARTS.map((b) => ({ label: b, value: b, active: bp === b })),
        ])}
        {eqOpts.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium",
                !eqOn
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              )}
              onClick={() => {
                setEq("");
                setShown(50);
              }}
            >
              Cualquier equipo
            </button>
            {eqOpts.map((x) => (
              <button
                key={x}
                type="button"
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium",
                  eqOn === x
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                )}
                onClick={() => {
                  if (eqOn === x) setEq("");
                  else setEq(x);
                  setShown(50);
                }}
              >
                {x}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 space-y-0.5">
        {bp !== "★" && (
          <div
            className={rowCls()}
            onClick={() => customExSheet(null, (ex) => onPick(ex), q.trim())}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
              ✨
            </span>
            <div className="grow">
              <div className="text-sm font-semibold">Crear tu propio ejercicio</div>
              <div className="text-xs text-muted-foreground">nombre + parte del cuerpo, sin animación</div>
            </div>
          </div>
        )}
        {f.slice(0, shown).map((e) => (
          <div key={e.id} className={rowCls()} onClick={() => onPick(e)}>
            <ExerciseIcon ex={e} />
            <div className="grow">
              <div className="text-sm font-semibold capitalize">{esName(e)}</div>
              <div className="text-xs capitalize text-muted-foreground">
                {(e.tg || e.bp)} · {e.eq}
              </div>
            </div>
            {usage[e.id] && <span className="text-xs text-primary">★</span>}
          </div>
        ))}
        {f.length === 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Sin resultados
          </div>
        )}
      </div>
      {f.length > shown && (
        <Button variant="outline" className="mt-3 w-full" onClick={() => setShown((s) => s + 50)}>
          Mostrar más
        </Button>
      )}
    </div>
  );
}

/* ============================ custom exercises ============================ */
export function customExSheet(
  existing: CustomEx | null,
  onDone?: (ex: AnyExercise) => void,
  prefill?: string
) {
  ui().open((close) => (
    <CustomExForm existing={existing} prefill={prefill} onDone={onDone} close={close} />
  ));
}

function CustomExForm({
  existing,
  prefill,
  onDone,
  close,
}: {
  existing: CustomEx | null;
  prefill?: string;
  onDone?: (ex: AnyExercise) => void;
  close: () => void;
}) {
  const [n, setN] = useState(existing ? existing.n : prefill || "");
  const [bp, setBp] = useState(existing ? existing.bp : "");
  const [desc, setDesc] = useState(existing ? existing.desc || "" : "");
  const save = () => {
    const name = n.trim();
    if (!name) {
      notify("Dale un nombre");
      return;
    }
    if (!bp) {
      notify("Elige una parte del cuerpo");
      return;
    }
    const dup = allExercises(S()).find(
      (e) => e.n.toLowerCase() === name.toLowerCase() && e.id !== (existing || {}).id
    );
    if (dup) {
      notify("«" + dup.n + "» ya existe");
      return;
    }
    const d = desc.trim().slice(0, 1000);
    let id = existing && existing.id;
    if (existing)
      update((s) => {
        const c = (s.customEx || []).find((x) => x.id === id);
        if (c) {
          c.n = name;
          c.bp = bp;
          c.desc = d;
        }
      });
    else {
      id = "c" + uid();
      update((s) => {
        (s.customEx = s.customEx || []).push({
          id,
          n: name,
          bp,
          desc: d,
          tg: "",
          eq: "custom",
          custom: true,
        });
      });
    }
    close();
    notify(existing ? "Guardado" : "«" + name + "» creado");
    if (onDone) onDone(EXIDX[id]);
  };
  return (
    <div>
      <h3 className="text-lg font-bold">
        {existing ? "Editar ejercicio" : "Crear tu propio ejercicio"}
      </h3>
      <p className="mt-1 mb-3 text-xs text-muted-foreground">
        Ponle nombre y elige la parte del cuerpo: se comporta como cualquier otro, solo
        que sin animación.
      </p>
      <Input
        placeholder="Nombre del ejercicio"
        value={n}
        onChange={(e) => setN(e.target.value)}
      />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {BODYPARTS.map((b) => (
          <button
            key={b}
            type="button"
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
              bp === b
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
            )}
            onClick={() => setBp(b)}
          >
            {b}
          </button>
        ))}
      </div>
      <Textarea
        className="mt-3"
        rows={3}
        maxLength={1000}
        placeholder="Descripción (opcional) — colocación, claves, lo que quieras recordar"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      <div className="h-3" />
      <Button className="w-full" onClick={save}>
        {existing ? "Guardar" : "Crear ejercicio"}
      </Button>
    </div>
  );
}

export function deleteCustomEx(ex: CustomEx, afterDelete?: () => void) {
  if (S().active?.entries.some((e) => e.id === ex.id)) {
    notify("Termina antes tu entrenamiento actual");
    return;
  }
  confirmSheet({
    title: "¿Eliminar «" + ex.n + "»?",
    message: "Se quitará de tus rutinas. Los entrenamientos ya registrados conservan sus series.",
    confirmText: "Eliminar",
    danger: true,
    onConfirm: () => {
      update((s) => {
        s.customEx = (s.customEx || []).filter((x) => x.id !== ex.id);
        s.routines.forEach((r) => {
          r.ex = r.ex.filter((e) => e.id !== ex.id);
          cleanupSg(r.ex);
        });
        s.workouts.forEach((w) =>
          w.entries.forEach((e) => {
            if (e.id === ex.id) e.n = ex.n;
          })
        );
        delete s.exWeights[ex.id];
      });
      notify("Ejercicio eliminado");
      if (afterDelete) afterDelete();
    },
  });
}

/* ============================ exercise config ============================ */
function ProgressionFields({
  ex,
  mode,
  c,
  setC,
  routine,
  unit,
}: {
  ex: AnyExercise;
  mode: string;
  c: ExConfig;
  setC: (fn: (x: ExConfig) => ExConfig) => void;
  routine: Routine | null;
  unit: string;
}) {
  const options = POLICIES_FOR[mode] || ["off"];
  if (options.length < 2) return null;
  const inherited = policyFor({ id: ex.id }, routine, mode);
  const active = policyFor({ ...c, id: ex.id }, routine, mode);
  const inc = c.inc && c.inc > 0 ? c.inc : mode === "time" ? 5 : defaultIncrement(ex.id, unit);
  return (
    <div className="border-t border-border pt-3">
      <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Progresión
      </h4>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs font-medium",
            !c.prog
              ? "border-dashed text-muted-foreground"
              : "border-primary bg-primary/10 text-primary"
          )}
          onClick={() => setC((x) => ({ ...x, prog: undefined }))}
          title="Sigue lo que diga la rutina"
        >
          Como la rutina ({POLICY_NAME[inherited]})
        </button>
        {options.map((p) => (
          <button
            key={p}
            type="button"
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium",
              c.prog === p
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
            )}
            onClick={() => setC((x) => ({ ...x, prog: p }))}
          >
            {POLICY_NAME[p]}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{POLICY_DESC[active]}</p>
      {active !== "off" && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Stepper
            label={mode === "time" ? "Paso (segundos)" : "Paso (" + unit + ")"}
            value={inc}
            step={mode === "time" ? 5 : 1.25}
            decimal={mode !== "time"}
            onChange={(v) => setC((x) => ({ ...x, inc: v }))}
          />
          {active === "double" && (
            <Stepper
              label="Reps desde"
              value={c.repsMin || Math.max(1, (c.reps || 10) - 2)}
              step={1}
              decimal={false}
              onChange={(v) => setC((x) => ({ ...x, repsMin: v }))}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function exConfigSheet(
  ex: AnyExercise,
  existing: ExConfig | null,
  onSave: (cfg: ExConfig) => void,
  onDelete?: () => void,
  routine?: Routine | null
) {
  ui().open((close) => (
    <ExConfigContent
      ex={ex}
      existing={existing}
      onSave={(c) => {
        close();
        onSave(c);
      }}
      onDelete={onDelete}
      routine={routine || null}
      close={close}
    />
  ));
}

function ExConfigContent({
  ex,
  existing,
  onSave,
  onDelete,
  close,
  routine,
}: {
  ex: AnyExercise;
  existing: ExConfig | null;
  onSave: (cfg: ExConfig) => void;
  onDelete?: () => void;
  close: () => void;
  routine: Routine | null;
}) {
  const st = S();
  const cardio = isCardio(ex.id);
  const [c, setC] = useState<ExConfig>(existing || defaultConfig(ex.id));
  const mode = cardio ? "cardio" : modeOf({ ...c, id: ex.id });
  const bw = !cardio && isBw({ ...c, id: ex.id });
  const perSide = isPerSide(c);
  const setMode = (m: string) =>
    setC((x) => ({
      ...defaultConfig(ex.id, m),
      ...x,
      mode: m === "time" || m === "reps" || m === "cardio" ? m : (x.mode as "reps" | "time" | "cardio") || "reps",
    }));
  const set1 = (fn: (x: ExConfig) => ExConfig) => setC(fn);
  const save = () => {
    const sets = Math.max(1, Math.round(c.sets || 0) || (cardio ? 1 : 3));
    const prog: Partial<ExConfig> = {};
    if (c.prog) prog.prog = c.prog;
    if (c.inc && c.inc > 0) prog.inc = c.inc;
    const flags: Partial<ExConfig> = {};
    if (bw !== isBodyweightEq(ex.id)) flags.bodyweight = bw;
    if (cardio)
      onSave({ sets, min: Math.max(1, Math.round(c.min || 0) || 20), speed: Math.max(0, c.speed || 8) });
    else if (mode === "time")
      onSave({
        sets,
        mode: "time",
        sec: Math.max(1, Math.round(c.sec || 0) || 45),
        weight: Math.max(0, c.weight || 0),
        ...flags,
        ...prog,
      });
    else {
      const typed = Math.max(1, Math.round(c.reps || 0) || 10);
      const reps = perSide ? Math.ceil(typed / 2) * 2 : typed;
      const out: ExConfig = {
        sets,
        mode: "reps",
        reps,
        weight: Math.max(0, c.weight || 0),
        ...flags,
        ...(perSide ? { side: true } : {}),
        ...prog,
      };
      if (policyFor({ ...c, id: ex.id }, routine, "reps") === "double")
        out.repsMin = Math.min(reps, Math.max(1, Math.round(c.repsMin || 0) || Math.max(1, reps - 2)));
      if (bw && !(out.weight && out.weight > 0) && c.repsMax && c.repsMax > 0)
        out.repsMax = Math.max(reps, Math.round(c.repsMax));
      onSave(out);
    }
  };
  const cfgrow = "grid grid-cols-1 gap-3 sm:grid-cols-3";
  return (
    <div>
      <h3 className="text-lg font-bold capitalize">{esName(ex)}</h3>
      <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
        {cardio && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-500">Cardio</span>}
        <span className="rounded-full bg-muted px-2 py-0.5">{ex.tg || ex.bp}</span>
        <span className="rounded-full bg-muted px-2 py-0.5">{ex.eq}</span>
      </div>
      {!cardio && (
        <div className="mt-3">
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "reps", label: "Reps" },
              { value: "time", label: "Tiempo" },
            ]}
          />
        </div>
      )}
      <div className={cn(cfgrow, mode === "time" ? "mt-4" : "mt-4 mb-4")}>
        {cardio ? (
          <>
            <Stepper label="Intervalos" value={c.sets || 1} step={1} decimal={false} onChange={(v) => set1((x) => ({ ...x, sets: v }))} />
            <Stepper label="Minutos" value={c.min || 20} step={1} decimal={false} onChange={(v) => set1((x) => ({ ...x, min: v }))} />
            <Stepper label="Velocidad (km/h)" value={c.speed || 8} step={0.5} onChange={(v) => set1((x) => ({ ...x, speed: v }))} />
          </>
        ) : mode === "time" ? (
          <>
            <Stepper label="Series" value={c.sets || 3} step={1} decimal={false} onChange={(v) => set1((x) => ({ ...x, sets: v }))} />
            <Stepper label="Segundos" value={c.sec || 45} step={5} decimal={false} onChange={(v) => set1((x) => ({ ...x, sec: v }))} />
            <Stepper label={"Peso (" + st.unit + ")"} value={c.weight || 0} step={2.5} onChange={(v) => set1((x) => ({ ...x, weight: v }))} />
          </>
        ) : (
          <>
            <Stepper label="Series" value={c.sets || 3} step={1} decimal={false} onChange={(v) => set1((x) => ({ ...x, sets: v }))} />
            <Stepper label="Reps" value={c.reps || 10} step={perSide ? 2 : 1} decimal={false} onChange={(v) => set1((x) => ({ ...x, reps: v }))} />
            {!bw && (
              <Stepper label={"Peso (" + st.unit + ")"} value={c.weight || 0} step={2.5} onChange={(v) => set1((x) => ({ ...x, weight: v }))} />
            )}
          </>
        )}
      </div>
      {mode === "time" && !bw && (
        <p className="mb-4 text-xs text-muted-foreground">
          Un temporizador corre mientras aguantas la serie. Deja el peso en 0 para
          sostener el peso corporal.
        </p>
      )}
      {!cardio && (
        <div className="space-y-1 rounded-xl border border-border px-3 py-1">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium">Solo peso corporal</div>
              <div className="text-xs text-muted-foreground">
                {bw ? "Sin peso que introducir — solo cuentas las reps." : "Preguntar por un peso en cada serie."}
              </div>
            </div>
            <Switch
              checked={bw}
              onCheckedChange={(v) => set1((x) => ({ ...x, bodyweight: v, weight: v ? 0 : x.weight }))}
            />
          </div>
          {mode === "reps" && (
            <div className="flex items-center justify-between border-t border-border py-2">
              <div>
                <div className="text-sm font-medium">Reps por lado</div>
                <div className="text-xs text-muted-foreground">
                  {perSide
                    ? "Sigues registrando el total: " + (c.reps || 0) + " son " + fmtNum(sideReps(c.reps)) + " por lado."
                    : "Para zancadas, remos a un brazo y similares."}
                </div>
              </div>
              <Switch
                checked={perSide}
                onCheckedChange={(v) =>
                  set1((x) => ({
                    ...x,
                    side: v || undefined,
                    reps: v ? Math.ceil((x.reps || 0) / 2) * 2 : x.reps,
                  }))
                }
              />
            </div>
          )}
        </div>
      )}
      {bw && (
        <>
          <div className="mt-4">
            <Stepper
              label={"Añadido (" + st.unit + ")"}
              value={c.weight || 0}
              step={2.5}
              onChange={(v) => set1((x) => ({ ...x, weight: v }))}
            />
          </div>
          <p className="mt-1 mb-2 text-xs text-muted-foreground">
            Para dominadas o fondos con cinturón. La progresión entonces sigue el peso.
          </p>
        </>
      )}
      {mode === "reps" && bw && !(c.weight && c.weight > 0) && (
        <>
          <Stepper
            label="Tope del rango"
            value={c.repsMax || 0}
            step={1}
            decimal={false}
            onChange={(v) => set1((x) => ({ ...x, repsMax: v }))}
          />
          <p className="mt-2 mb-3 text-xs text-muted-foreground">
            {c.repsMax && c.repsMax > 0
              ? "Las reps suben hasta " + c.repsMax + ", luego se añade una serie y se reinicia. En " + MAX_BW_SETS + " series te pedirá añadir peso."
              : "Las reps suben de una en una cuando todas las series estén limpias. Pon un tope para añadir series en vez de reps para siempre."}
          </p>
        </>
      )}
      <ProgressionFields ex={ex} mode={mode} c={c} setC={set1} routine={routine} unit={st.unit} />
      <div className="h-3" />
      <Button className="w-full" onClick={save}>
        {existing ? "Guardar" : "Añadir a la rutina"}
      </Button>
      {("custom" in ex ? ex.custom : false) && (
        <>
          <div className="h-1.5" />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              close();
              customExSheet(ex as CustomEx);
            }}
          >
            Editar o eliminar este ejercicio
          </Button>
        </>
      )}
      {onDelete && (
        <>
          <div className="h-1.5" />
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              close();
              onDelete();
            }}
          >
            Quitar de la rutina
          </Button>
        </>
      )}
    </div>
  );
}

/* ============================ add to routine ============================ */
export function addToRoutineSheet(ex: AnyExercise) {
  const st = S();
  const ui0 = getUI();
  const closeAll = () => ui0.closeAll();
  ui0.open((close) => {
    const pick = (rid: string) => {
      const isNew = rid === "_new";
      exConfigSheet(
        ex,
        null,
        (cfg) => {
          update((s) => {
            const r = isNew
              ? { id: uid(), name: "Nueva rutina", emoji: "barbell", ex: [] as ExConfig[] }
              : s.routines.find((x) => x.id === rid);
            if (isNew) s.routines.push(r as Routine);
            if (r) r.ex.push({ id: ex.id, ...cfg });
          });
          const r = isNew
            ? S().routines[S().routines.length - 1]
            : st.routines.find((x) => x.id === rid);
          notify("«" + esName(ex) + "» añadido a " + (r ? r.name : "la rutina"));
        },
        null,
        isNew ? null : st.routines.find((x) => x.id === rid)
      );
    };
    return (
      <div>
        <h3 className="text-lg font-bold capitalize">Añadir «{esName(ex)}»</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Elige la rutina: series, reps y peso vienen después.
        </p>
        <div className="space-y-0.5">
          {st.routines.map((r) => (
            <div
              key={r.id}
              className={rowCls()}
              onClick={() => {
                close();
                pick(r.id);
              }}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
                <Glyph name={r.emoji} className="h-5 w-5" />
              </span>
              <div className="grow">
                <div className="text-sm font-semibold">{r.name}</div>
                <div className="text-xs text-muted-foreground">{exCount(r.ex.length)}</div>
              </div>
              {r.ex.some((e) => e.id === ex.id) && (
                <span className="text-xs text-muted-foreground">ya está</span>
              )}
            </div>
          ))}
          <div
            className={rowCls()}
            onClick={() => {
              close();
              pick("_new");
            }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
              ✨
            </span>
            <div className="grow">
              <div className="text-sm font-semibold">Nueva rutina</div>
              <div className="text-xs text-muted-foreground">Créala y empieza con este ejercicio</div>
            </div>
          </div>
        </div>
      </div>
    );
  });
}

/* ============================ exercise detail ============================ */
function OneRMBlock({ ex }: { ex: AnyExercise }) {
  const st = S();
  const best = best1RM(st, ex.id);
  const [w, setW] = useState(best ? best.w : (st.exWeights[ex.id] || {}).w || 20);
  const [r, setR] = useState(best ? best.r : 5);
  const est = estimate1RM(w, r);
  return (
    <div className="border-t border-border pt-3">
      <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        1RM estimado
      </h4>
      {best && (
        <p className="mb-2 text-xs text-muted-foreground">
          De tu historial: <b className="font-semibold text-foreground">{fmtNum(best.est)} {st.unit}</b>
          <span className="dim"> · {fmtNum(best.w)} {st.unit} × {best.r} el {fmtDate(best.d, true)}</span>
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Stepper label={"Peso (" + st.unit + ")"} value={w} step={2.5} onChange={setW} />
        <Stepper label="Reps" value={r} step={1} decimal={false} onChange={setR} />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Estimación</span>
        <b className="text-xl font-bold text-primary">
          {est === null ? "—" : fmtNum(est) + " " + st.unit}
        </b>
      </div>
      <p className="text-xs text-muted-foreground">
        {est === null
          ? "Introduce un peso y 1–" + REP_CAP + " reps — más allá una estimación sería adivinar."
          : "Fórmula de Epley — cálculo a partir de una serie, no un máximo probado."}
      </p>
    </div>
  );
}

export function exerciseDetailSheet(ex: AnyExercise) {
  const ui0 = getUI();
  ui0.open((close) => {
    const last = lastEntryFor(S(), ex.id);
    const best = bestWeightFor(S(), ex.id);
    const x = ex as AnyExercise & {
      sm?: string[];
      st?: string[];
      desc?: string;
      custom?: boolean;
    };
    return (
      <div>
        <h3 className="text-lg font-bold capitalize">{esName(ex)}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary capitalize">
            {ex.bp}
          </span>
          {ex.tg && <span className="rounded-full bg-muted px-2 py-0.5">{ex.tg}</span>}
          <span className="rounded-full bg-muted px-2 py-0.5">{ex.eq}</span>
          {(x.sm || []).slice(0, 3).map((s, i) => (
            <span key={i} className="rounded-full bg-muted px-2 py-0.5">
              {s}
            </span>
          ))}
        </div>
        {x.desc && (
          <p className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">{x.desc}</p>
        )}
        {best > 0 && (
          <p className="mt-3 text-sm">
            🏆 Mejor: <b className="text-primary">{fmtNum(best)} {S().unit}</b>
            {last
              ? " · última vez " +
                fmtDate(last.d) +
                ": " +
                last.sets.map((s) => setLabel(ex.id, s, last.target)).join(", ")
              : ""}
          </p>
        )}
        {!isCardio(ex) && (
          <>
            <div className="h-3" />
            <OneRMBlock ex={ex} />
          </>
        )}
        {(x.st || []).length > 0 && (
          <>
            <h4 className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Cómo hacerlo
            </h4>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              {(x.st || []).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </>
        )}
        <Button
          className="mt-4 w-full"
          onClick={() => {
            close();
            addToRoutineSheet(ex);
          }}
        >
          + Añadir a mi plan
        </Button>
        {("custom" in ex ? ex.custom : false) && (
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            <Button
              variant="outline"
              onClick={() => {
                close();
                customExSheet(ex as CustomEx);
              }}
            >
              Editar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteCustomEx(ex as CustomEx, close)}
            >
              Eliminar
            </Button>
          </div>
        )}
      </div>
    );
  });
}

/* ============================ day assign / override ============================ */
export const dayAssignSheet = (day: number) => {
  const st = S();
  ui().open((close) => {
    const set = (v: string) => {
      update((s) => {
        if (v) s.week[day] = v;
        else delete s.week[day];
      });
      close();
    };
    return (
      <div>
        <h3 className="text-lg font-bold">{DAYN[day]}</h3>
        <div className="mt-2 space-y-0.5">
          <div
            className={rowCls()}
            onClick={() => set("")}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
              🌙
            </span>
            <div className="grow text-sm font-medium">Día de descanso</div>
            {!st.week[day] && <span className="text-primary">✓</span>}
          </div>
          {st.routines.map((r) => (
            <div key={r.id} className={rowCls()} onClick={() => set(r.id)}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
                <Glyph name={r.emoji} className="h-5 w-5" />
              </span>
              <div className="grow">
                <div className="text-sm font-semibold">{r.name}</div>
                <div className="text-xs text-muted-foreground">{exCount(r.ex.length)}</div>
              </div>
              {st.week[day] === r.id && <span className="text-primary">✓</span>}
            </div>
          ))}
        </div>
      </div>
    );
  });
};

export function dayOverrideSheet(iso: string) {
  const st = S();
  ui().open((close) => {
    const wd = new Date(iso + "T12:00:00").getDay();
    const weeklyR = st.routines.find((r) => r.id === st.week[wd]);
    const hasOvr = st.dayPlan[iso] !== undefined;
    const effId = effectiveRoutineId(st, iso);
    const set = (v: string) => {
      update((s) => {
        if (!v) delete s.dayPlan[iso];
        else s.dayPlan[iso] = v;
      });
      close();
      notify(
        v === ""
          ? "De vuelta al plan semanal"
          : v === "rest"
          ? fmtDate(iso) + " marcado como descanso"
          : ((st.routines.find((r) => r.id === v) || {}).name || "") + " el " + fmtDate(iso)
      );
    };
    return (
      <div>
        <h3 className="text-lg font-bold capitalize">{fmtDate(iso, true)}</h3>
        <p className="mb-2 mt-1 text-xs text-muted-foreground">
          Plan semanal: {weeklyR ? weeklyR.name : "Descanso"}
          {hasOvr && <span className="text-orange-500"> · cambiado para hoy</span>}
        </p>
        <div className="space-y-0.5">
          {st.routines.map((r) => (
            <div key={r.id} className={rowCls()} onClick={() => set(r.id)}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
                <Glyph name={r.emoji} className="h-5 w-5" />
              </span>
              <div className="grow">
                <div className="text-sm font-semibold">{r.name}</div>
                <div className="text-xs text-muted-foreground">{exCount(r.ex.length)}</div>
              </div>
              {effId === r.id && <span className="text-primary">✓</span>}
            </div>
          ))}
          <div className={rowCls()} onClick={() => set("rest")}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
              🌙
            </span>
            <div className="grow text-sm font-medium">Descansar / saltar este día</div>
            {effId === null && <span className="text-primary">✓</span>}
          </div>
          {hasOvr && (
            <div className={rowCls()} onClick={() => set("")}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
                ↺
              </span>
              <div className="grow text-sm font-medium">Volver al plan semanal</div>
            </div>
          )}
        </div>
      </div>
    );
  });
}

/* ============================ workout detail ============================ */
export function workoutDetailSheet(w: Workout) {
  ui().open((close) => (
    <div>
      <h3 className="text-lg font-bold">{w.name}</h3>
      <p className="mb-3 mt-1 text-xs text-muted-foreground">
        {[fmtDate(w.d, true), ...durPart(w.end - w.start), fmtVol(w.vol, S().unit), ...(w.bw ? [fmtNum(w.bw) + " " + S().bwUnit] : [])].join(" · ")}
      </p>
      {w.entries.map((e, i) => {
        const ex = EXIDX[e.id];
        return (
          <div key={i} className="mb-3 flex items-start gap-3">
            {ex && <ExerciseIcon ex={ex} />}
            <div className="grow">
              <div className="text-sm font-semibold capitalize">
                {ex ? esName(ex) : (e.n || e.id)}
                {w.prs && w.prs.includes(e.id) && (
                  <span className="ml-1 rounded-full bg-yellow-500/15 px-1.5 text-[10px] font-bold text-yellow-500">
                    PR
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {e.sets.filter((s) => s.done).map((s) => setLabel(e.id, s, e.target)).join("  ·  ") || "sin series"}
              </div>
            </div>
          </div>
        );
      })}
      <Button
        variant="destructive"
        className="w-full"
        onClick={() =>
          confirmSheet({
            title: "¿Eliminar entrenamiento?",
            message: "Se quitará de tu historial para siempre.",
            confirmText: "Eliminar",
            danger: true,
            onConfirm: () => {
              update((s) => {
                s.workouts = s.workouts.filter((x) => x.id !== w.id);
              });
              close();
              notify("Entrenamiento eliminado");
            },
          })
        }
      >
        Eliminar entrenamiento
      </Button>
    </div>
  ));
}

/* ============================ workout row (shared lists) ============================ */
export function WorkoutRow({ w, onClick }: { w: Workout; onClick: () => void }) {
  const st = S();
  const routine = st.routines.find((r) => r.id === w.routineId);
  return (
    <div className={rowCls()} onClick={onClick}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Glyph name={routine?.emoji} className="h-4 w-4" />
      </span>
      <div className="min-w-0 grow">
        <div className="truncate text-sm font-semibold">{w.name}</div>
        <div className="text-xs text-muted-foreground">
          {[fmtDate(w.d, true), ...durPart(w.end - w.start), setsDone(w) + " series", fmtVol(w.vol, st.unit)].join(" · ")}
        </div>
      </div>
      {w.prs && w.prs.length > 0 && (
        <span className="rounded-full bg-yellow-500/15 px-1.5 py-0.5 text-[10px] font-bold text-yellow-500">
          🏆 {w.prs.length} PR
        </span>
      )}
      <span className="text-muted-foreground">›</span>
    </div>
  );
}

/* ============================ calendar ============================ */
export const calendarSheet = (start?: string) =>
  ui().open((close) => <Calendar start={start} close={close} />);

function Calendar({ start, close }: { start?: string; close: () => void }) {
  const st = useGym().S;
  const [cur, setCur] = useState(() => {
    const d = start ? new Date(start) : new Date();
    d.setDate(1);
    return d;
  });
  const y = cur.getFullYear();
  const mo = cur.getMonth();
  const byDay: Record<string, Workout[]> = {};
  st.workouts.forEach((w) => (byDay[w.d] = byDay[w.d] || []).push(w));
  const startOffset = (new Date(y, mo, 1).getDay() + 6) % 7;
  const daysIn = new Date(y, mo + 1, 0).getDate();
  const monthWs = st.workouts.filter((w) =>
    w.d.startsWith(y + "-" + String(mo + 1).padStart(2, "0"))
  );
  const monthVol = monthWs.reduce((a, w) => a + (w.vol || 0), 0);
  const monthMs = monthWs.reduce(
    (a, w) => a + Math.max(0, (w.end || w.start) - w.start),
    0
  );
  const cells: ReactNode[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(<div key={"e" + i} />);
  for (let d = 1; d <= daysIn; d++) {
    const iso = y + "-" + String(mo + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    const ws = byDay[iso];
    const effId = effectiveRoutineId(st, iso);
    const ovr = st.dayPlan[iso] !== undefined;
    const dotCls = ws ? "done" : ovr && effId ? "ovr" : effId ? "plan" : "";
    cells.push(
      <button
        key={d}
        type="button"
        className={
          "relative flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors " +
          (ws
            ? "bg-primary/15 text-foreground"
            : "text-muted-foreground hover:bg-accent") +
          (iso === todayISO() ? " ring-2 ring-ring" : "")
        }
        onClick={() => {
          if (!ws) {
            close();
            dayOverrideSheet(iso);
            return;
          }
          if (ws.length === 1) {
            close();
            workoutDetailSheet(ws[0]);
            return;
          }
          close();
          ui().open((c2) => (
            <div>
              <h3 className="text-lg font-bold">{fmtDate(iso, true)}</h3>
              <div className="mt-2 space-y-0.5">
                {ws.map((w) => (
                  <WorkoutRow
                    key={w.id}
                    w={w}
                    onClick={() => {
                      c2();
                      workoutDetailSheet(w);
                    }}
                  />
                ))}
              </div>
            </div>
          ));
        }}
      >
        <span>{d}</span>
        {dotCls && <i className={"absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full " + (dotCls === "done" ? "bg-primary" : dotCls === "ovr" ? "bg-orange-400" : "bg-muted-foreground/60")} />}
      </button>
    );
  }
  const days = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent" onClick={() => setCur(new Date(y, mo - 1, 1))} aria-label="Mes anterior">
          ‹
        </button>
        <h3 className="text-lg font-bold">
          {MONTHS_LONG[mo]} {y}
        </h3>
        <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent" onClick={() => setCur(new Date(y, mo + 1, 1))} aria-label="Mes siguiente">
          ›
        </button>
      </div>
      <p className="mb-2 text-center text-xs text-muted-foreground">
        {monthWs.length
          ? monthWs.length + " entrenamiento" + (monthWs.length === 1 ? "" : "s") + " · " + fmtDur(monthMs) + " · " + fmtVol(monthVol, st.unit)
          : "Sin entrenamientos este mes"}
      </p>
      <div className="grid grid-cols-7 gap-1">
        {days.map((l) => (
          <div key={l} className="pb-1 text-center text-[10px] font-semibold uppercase text-muted-foreground">
            {l}
          </div>
        ))}
        {cells}
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-primary" /> Entrenado</span>
        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-muted-foreground/60" /> Planificado</span>
        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-orange-400" /> Reagendado</span>
      </div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Toca un día entrenado para ver detalles · cualquier otro día para planear
      </p>
    </div>
  );
}

/* ============================ workout lifecycle ============================ */
export function startFlow(routineId?: string) {
  bwSheet({ required: true, onDone: (bw) => beginWorkout(routineId, bw) });
}

export function beginWorkout(routineId: string | undefined, bw: number | null) {
  const st = S();
  const r = routineId ? st.routines.find((x) => x.id === routineId) : null;
  const entries = (r ? r.ex : []).map((cfg) => {
    const plan = nextPrescription(st, cfg, r as Routine | null);
    return {
      id: cfg.id!,
      sg: cfg.sg,
      target: { ...cfg },
      plan,
      sets: applyPrescription(buildSets(st, cfg), plan),
    };
  });
update((s) => {
    s.active = {
      id: uid(),
      d: todayISO(),
      start: Date.now(),
      routineId,
      name: r ? r.name : "Libre",
      bw: bw || null,
      cur: 0,
      entries,
    };
  });
  ui().stopRest();
  notify("¡A entrenar! 💪");
}

/* Top weight confirmation after completing an exercise — ported 1:1 flow */
export function topWeightSheet(entryIdx: number) {
  ui().open((close) => (
    <TopWeightContent entryIdx={entryIdx} close={close} />
  ));
}

function TopWeightContent({
  entryIdx,
  close,
}: {
  entryIdx: number;
  close: () => void;
}) {
  const st = S();
  const A = st.active;
  const entry = A ? A.entries[entryIdx] : null;
  const ex = entry && EXIDX[entry.id];
  const maxSet = entry ? Math.max(0, ...entry.sets.filter((s) => s.done).map((s) => s.w || 0)) : 0;
  const prevBest = entry
    ? Math.max((st.exWeights[entry.id] || {}).w || 0, bestWeightFor(st, entry.id))
    : 0;
  const [v, setV] = useState(
    entry ? Math.max(maxSet, prevBest) || entry.target?.weight || 0 : 0
  );
  useEffect(() => {
    if (!entry) close();
  }, [entry, close]);

  const units = supersetUnits(A ? A.entries : []);
  const unit = entry ? unitOf(units, entryIdx) : [];
  const unitDone = !!entry && unit.every((i) => A!.entries[i].sets.every((s) => s.done));
  const unitIdx = units.findIndex((u) => u === unit);
  const isLastUnit = unitIdx === units.length - 1;
  if (!entry || !ex) return null;

  const commit = (advance: boolean) => {
    const n = Math.round((v || 0) * 10) / 10;
    if (!isFinite(n) || n < 0) {
      notify("Introduce un peso válido");
      return;
    }
    update((s) => {
      s.active!.entries[entryIdx].topW = n;
      const cur = s.exWeights[entry.id];
      s.exWeights[entry.id] = { w: Math.max(n, cur ? cur.w : 0), d: todayISO() };
    });
    close();
    if (advance && unitDone) {
      if (isLastUnit) workoutCompleteSheet();
      else
        update((s) => {
          s.active!.cur = units[unitIdx + 1][0];
        });
    } else
      notify(
        "Registrado — la próxima empieza en " +
          fmtNum(getGym().S.exWeights[entry.id].w) +
          " " +
          getGym().S.unit
      );
  };
  return (
    <div>
      <h3 className="text-lg font-bold">{esName(ex)} hecho</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Confirma el peso con el que trabajaste — el mayor se vuelve la referencia la
        próxima vez.
      </p>
      <WeightInput value={v} setValue={setV} unit={st.unit} />
      {prevBest > 0 ? (
        <p className="mb-3 mt-1 text-center text-xs text-muted-foreground">
          Mejor anterior: {fmtNum(prevBest)} {st.unit}
          {maxSet > prevBest && <span className="text-yellow-500"> — ¡nuevo récord!</span>}
        </p>
      ) : (
        <div className="h-2" />
      )}
      {unitDone ? (
        <>
          <Button
            className="w-full"
            onClick={() => commit(true)}
          >
            {isLastUnit ? "Guardar" : "Guardar y siguiente ejercicio"}
          </Button>
          <div className="h-1.5" />
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => commit(false)}
          >
            Solo cerrar
          </Button>
        </>
      ) : (
        <Button className="w-full" onClick={() => commit(false)}>
          Guardar peso
        </Button>
      )}
    </div>
  );
}

/* Workout complete — all exercises done */
export const workoutCompleteSheet = () =>
  ui().open(
    (close) => (
      <div className="py-2 text-center">
        <div className="text-5xl text-primary">✓</div>
        <h3 className="mt-2 text-lg font-bold">¡Ese fue todo el entrenamiento!</h3>
        <p className="mt-1 mb-4 text-xs text-muted-foreground">
          Todos los ejercicios hechos — gran trabajo. Termina, o continúa y añade otro.
        </p>
        <Button
          className="w-full"
          onClick={() => {
            close();
            finishWorkout();
          }}
        >
          Terminar entrenamiento
        </Button>
        <div className="h-1.5" />
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => {
            close();
            notify('Sigue — toca “+ Añadir ejercicio” abajo');
          }}
        >
          Continuar
        </Button>
      </div>
    ),
    { kind: "center" }
  );

function FinishSummary({ w }: { w: Workout }) {
  return (
    <div className="py-2 text-center">
      <div className="text-5xl">🏆</div>
      <h3 className="mt-2 text-lg font-bold">¡Entrenamiento completo!</h3>
      <div className="mt-3 grid grid-cols-4 gap-2 text-left">
        <div className="rounded-xl bg-muted/50 p-2">
          <div className="text-[10px] uppercase text-muted-foreground">Duración</div>
          <div className="text-sm font-semibold">{fmtDur(w.end - w.start)}</div>
        </div>
        <div className="rounded-xl bg-muted/50 p-2">
          <div className="text-[10px] uppercase text-muted-foreground">Volumen</div>
          <div className="text-sm font-semibold">{fmtVol(w.vol, S().unit)}</div>
        </div>
        <div className="rounded-xl bg-muted/50 p-2">
          <div className="text-[10px] uppercase text-muted-foreground">Series</div>
          <div className="text-sm font-semibold">{setsDone(w)}</div>
        </div>
        <div className="rounded-xl bg-muted/50 p-2">
          <div className="text-[10px] uppercase text-muted-foreground">PRs</div>
          <div className="text-sm font-semibold">{w.prs?.length || "—"}</div>
        </div>
      </div>
      {(w.prs || []).length > 0 && (
        <div className="mt-3 space-y-1 text-left">
          {w.prs!.map((id) => (
            <div key={id} className="text-sm font-medium capitalize text-primary">
              🏆 Nuevo PR: {esName(id) || id}
            </div>
          ))}
        </div>
      )}
      <h4 className="mb-2 mt-4 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Lo que acabas de entrenar
      </h4>
      <MuscleMap load={loadOfWorkouts([w])} />
      <div className="h-3" />
      <Button
        className="w-full"
        onClick={() => {
          ui().closeAll();
        }}
      >
        ¡Bien!
      </Button>
    </div>
  );
}

export function finishWorkout() {
  const A = S().active;
  if (!A) return;
  const done = setsDoneActive(A);
  const total = A.entries.reduce((n, e) => n + e.sets.length, 0);
  if (!done) {
    confirmSheet({
      title: "Nada registrado aún",
      message: "No has marcado ninguna serie. ¿Terminar el entrenamiento igualmente?",
      confirmText: "Terminar igualmente",
      onConfirm: doFinishWorkout,
    });
    return;
  }
  if (done < total) {
    confirmSheet({
      title: "¿Terminar antes?",
      message:
        (total - done === 1
          ? total - done + " serie sin marcar. "
          : total - done + " series sin marcar. ") +
        "¿Terminar el entrenamiento ahora?",
      confirmText: "Terminar entrenamiento",
      onConfirm: doFinishWorkout,
    });
    return;
  }
  doFinishWorkout();
}

function doFinishWorkout() {
  const st = S();
  const A = st.active;
  if (!A) return;
  const prs: string[] = [];
  A.entries.forEach((e) => {
    const mx = Math.max(0, ...e.sets.filter((s) => s.done).map((s) => s.w || 0));
    if (mx > 0 && mx > bestWeightFor(st, e.id)) prs.push(e.id);
  });
  const w: Workout = {
    id: A.id,
    d: A.d,
    start: A.start,
    end: Date.now(),
    routineId: A.routineId,
    name: A.name,
    bw: A.bw,
    entries: A.entries.map((e) => ({
      id: e.id,
      sets: e.sets,
      topW: e.topW || null,
      target: e.target || null,
    })).filter((e) => e.sets.some((s) => s.done)),
    prs,
  };
  w.vol = workoutVolume(w);
  update((s) => {
    w.entries.forEach((e) => {
      const mx = Math.max(
        0,
        ...e.sets.filter((x) => x.done).map((x) => x.w || 0),
        e.topW || 0
      );
      if (mx > 0) {
        const cur = s.exWeights[e.id];
        if (!cur || mx > cur.w) s.exWeights[e.id] = { w: mx, d: w.d };
      }
    });
    s.workouts.push(w);
    s.active = null;
  });
  ui().stopRest();
  beep(st.sound, 880, 0.15);
  beep(st.sound, 1100, 0.15, 0.18);
  beep(st.sound, 1320, 0.3, 0.36);
  const mins = Math.max(1, Math.round((w.end - w.start) / 60000));
  markGymDayInDaily(mins);
  ui().open((close) => <FinishSummary w={w} />, { kind: "center", locked: true });
}