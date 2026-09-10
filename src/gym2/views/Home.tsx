import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Settings2,
  ChevronLeft,
  ChevronRight,
  Moon,
  Plus,
  Target,
  ArrowDown,
  ArrowUp,
  Flame,
  CalendarDays,
  Sparkles,
  Dumbbell,
  Timer,
  Play,
} from "lucide-react";
import { useGym } from "../store";
import {
  effectiveRoutine,
  effectiveRoutineId,
  streakWeeks,
  lastBW,
} from "../lib/history";
import { fmtNum, fmtDate, todayISO, isoOf, weekKey, DAYS } from "../lib/format";
import {
  bwSheet,
  goalSheet,
  dayOverrideSheet,
  calendarSheet,
  startFlow,
  loadStarterPlan,
  loadDanielPlan,
  bwDeltaColor,
  bodiesSheet,
  settingsSheet,
} from "../components/sheets";
import { Chart } from "../components/Chart";
import { BODY_METRICS, lastBodyM } from "../lib/history";
import { Glyph } from "../lib/glyphs";
import { cn } from "@/lib/utils";
import { syncRestDays } from "../lib/dailySync";

export default function Home({ onGo }: { onGo: (tab: string) => void }) {
  const S = useGym().S;
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (S.routines.length > 0) syncRestDays(S);
  }, []);

  const today = new Date();
  const routine = effectiveRoutine(S, todayISO());
  const todayOvr = S.dayPlan[todayISO()] !== undefined;
  const bw = lastBW(S);
  const prevBW = S.bodyweight.length > 1 ? S.bodyweight[S.bodyweight.length - 2] : null;
  const delta = bw && prevBW ? bw.w - prevBW.w : null;
  const bodyM = lastBodyM(S);

  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7);
  const doneDays = new Set(S.workouts.map((w) => w.d));
  const strip = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = isoOf(d);
    const eff = effectiveRoutineId(S, iso);
    const ovr = S.dayPlan[iso] !== undefined;
    const done = doneDays.has(iso);
    const dot = done ? "done" : ovr && eff ? "ovr" : eff ? "plan" : "";
    strip.push(
      <div
        key={i}
        className={cn(
          "flex flex-1 cursor-pointer flex-col items-center gap-0.5 rounded-xl py-1.5",
          iso === todayISO() && "bg-muted"
        )}
        onClick={() => dayOverrideSheet(iso)}
      >
        <div className="text-[10px] uppercase text-muted-foreground">{DAYS[d.getDay()]}</div>
        <div className="text-sm font-semibold">{d.getDate()}</div>
        <div
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            dot === "done" && "bg-primary",
            dot === "ovr" && "bg-orange-400",
            dot === "plan" && "bg-muted-foreground/50",
            dot === "" && "bg-transparent"
          )}
        />
      </div>
    );
  }
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const wkLabel =
    weekOffset === 0
      ? "Esta semana"
      : `${monday.getDate()} ${monday.toLocaleDateString("es-ES", { month: "short" })} – ${sunday.getDate()} ${sunday.toLocaleDateString("es-ES", { month: "short" })}`;

  const wThisWeek = S.workouts.filter((w) => weekKey(w.d) === weekKey(todayISO())).length;
  const plannedPerWeek = Object.keys(S.week).filter((k) => S.week[Number(k)]).length;
  const bwPoints = S.bodyweight
    .slice(-30)
    .map((b) => ({ t: b.t || new Date(b.d).getTime(), y: b.w, d: b.d }));

  const onToday = () => {
    if (S.active) onGo("workout");
    else if (routine) startFlow(routine.id);
    else dayOverrideSheet(todayISO());
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-32 lg:max-w-4xl lg:px-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">GYM 2.0</h1>
          <div className="text-sm text-muted-foreground capitalize">
            {today.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={settingsSheet} aria-label="Ajustes">
          <Settings2 className="h-5 w-5" />
        </Button>
      </div>

      <div className="rounded-2xl border bg-card p-3 shadow-sm">
        <div className="mb-1.5 flex items-center justify-between">
          <button
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent"
            onClick={() => setWeekOffset((w) => w - 1)}
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-xs font-medium text-muted-foreground">{wkLabel}</div>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent"
            onClick={() => setWeekOffset((w) => w + 1)}
            aria-label="Semana siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-1">{strip}</div>
        <div
          className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5"
          onClick={onToday}
        >
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-primary",
              S.active || routine ? "bg-primary/15" : "bg-muted"
            )}
          >
            {S.active ? (
              <Timer className="h-5 w-5 text-orange-500" />
            ) : routine ? (
              <Glyph name={routine.emoji} className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5 text-muted-foreground" />
            )}
          </span>
          <div className="min-w-0">
            <div className="text-[10px] uppercase text-muted-foreground">Hoy</div>
            <div className="truncate text-sm font-semibold">
              {S.active ? S.active.name + " — en curso" : routine ? routine.name : "Día de descanso"}
              {todayOvr && routine ? " · reagendado" : ""}
            </div>
          </div>
          <span className="ml-auto">
            {S.active ? (
              <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-semibold text-orange-500">
                Reanudar
              </span>
            ) : routine ? (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                Empezar
              </span>
            ) : (
              <Plus className="h-4 w-4 text-muted-foreground" />
            )}
          </span>
        </div>
      </div>

      {!S.routines.length && !S.active && (
        <div className="mt-3 rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="h-5 w-5 text-primary" /> ¡Bienvenido!
          </div>
          <p className="mt-1 mb-3 text-sm text-muted-foreground">
            Organiza tu semana para empezar — o carga un plan listo para usar.
          </p>
          <Button className="w-full" onClick={loadDanielPlan}>
            <Sparkles className="h-4 w-4" /> Cargar plan DUP Daniel (Torso & Piernas)
          </Button>
          <div className="h-1.5" />
          <Button variant="outline" className="w-full" onClick={loadStarterPlan}>
            <Sparkles className="h-4 w-4" /> Plan inicial (Push / Pull / Legs)
          </Button>
          <div className="h-1.5" />
          <Button variant="outline" className="w-full" onClick={() => onGo("plan")}>
            Crear mi propio plan
          </Button>
        </div>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">Peso corporal</h2>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                className={S.targetW ? "text-yellow-500" : ""}
                onClick={goalSheet}
              >
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
                <span className="ml-auto text-xs text-muted-foreground">{fmtDate(bw.d, true)}</span>
              </div>
              {S.targetW && (
                <div className="mt-1 flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-500">
                  <Target className="h-3.5 w-3.5" />
                  <span>
                    Objetivo {fmtNum(S.targetW)} {S.unit} ·{" "}
                    {Math.abs(S.targetW - bw.w) < 0.05
                      ? "¡alcanzado!"
                      : (S.targetW > bw.w ? "subir " : "bajar ") +
                        fmtNum(Math.abs(S.targetW - bw.w)) +
                        " " +
                        S.unit}
                  </span>
                </div>
              )}
              <div className="mt-2">
                <Chart points={bwPoints} h={130} unit={S.unit} goal={S.targetW} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin registros aún — registra tu peso para empezar la curva. También se pide antes de cada
              entrenamiento.
            </p>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">Medidas corporales</h2>
            <Button size="sm" variant="outline" onClick={() => bodiesSheet()}>
              <Plus className="h-3.5 w-3.5" /> Registrar
            </Button>
          </div>
          {bodyM && BODY_METRICS.some((m) => bodyM[m.key] && bodyM[m.key]! > 0) ? (
            <div className="flex flex-wrap gap-1.5">
              {BODY_METRICS.map((m) => {
                const v = bodyM[m.key];
                return v != null && v > 0 ? (
                  <span key={m.key} className="rounded-md bg-muted px-2 py-0.5 text-xs">
                    <span className="text-muted-foreground">{m.label} </span>
                    <b className="font-semibold">{fmtNum(v)} cm</b>
                  </span>
                ) : null;
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Registra pecho, cintura, brazo… en cm para seguir tu evolución.
            </p>
          )}
        </div>

        <div
          className="flex cursor-pointer items-center justify-between rounded-2xl border bg-card p-4 shadow-sm"
          onClick={() => calendarSheet()}
        >
          <div>
            <div className="flex items-center gap-2 text-lg font-bold">
              <Flame className="h-5 w-5 text-orange-500" />
              <span>
                Racha de {streakWeeks(S)} {streakWeeks(S) === 1 ? "semana" : "semanas"}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {wThisWeek}
              {plannedPerWeek ? " / " + plannedPerWeek : ""} esta semana · {S.workouts.length}{" "}
              {S.workouts.length === 1 ? "entrenamiento" : "entrenamientos"} en total
            </div>
          </div>
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
