import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Plus, Crown, Search } from "lucide-react";
import { useGym } from "../store";
import { allExercises, isCardio, BODYPARTS, equipmentOf, type Ex } from "../lib/exercises";
import { bestWeightFor } from "../lib/history";
import { best1RM } from "../lib/onerm";
import {
  exerciseDetailSheet,
  addToRoutineSheet,
  customExSheet,
} from "../components/sheets";
import { ExerciseIcon } from "../components/Media";
import { fmtNum } from "../lib/format";
import type { AnyExercise } from "../lib/exercises";

export default function Library() {
  const S = useGym().S;
  const [q, setQ] = useState("");
  const [eq, setEq] = useState<string | null>(null);
  const [bp, setBp] = useState<string | null>(null);

  const all = allExercises(S);
  const equipment = [
    ...new Set([...equipmentOf(all as Ex[]), "body weight", "custom"]),
  ];
  const bodyParts = [ ...new Set([...BODYPARTS, "cardio"]) ];
  const ql = q.trim().toLowerCase();
  const fl = all.filter((ex) => {
    if (eq && ex.eq !== eq) return false;
    if (bp && ex.bp !== bp && !(bp === "cardio" && isCardio(ex))) return false;
    if (ql) {
      if (
        ex.n.toLowerCase().replace(/-/g, " ").indexOf(ql) === -1 &&
        (ex.tg || "").indexOf(ql) === -1 &&
        (ex.eq || "").indexOf(ql) === -1
      )
        return false;
    }
    return true;
  });

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-32">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Ejercicios</h1>
        <div className="text-sm text-muted-foreground">
          Biblioteca de ejercicios
        </div>
      </div>

      <div className="mb-2 relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar ejercicio…"
          className="pl-9"
        />
      </div>

      <div className="mb-1 flex flex-wrap gap-1.5">
        {equipment.map((e) => (
          <button
            key={e}
            type="button"
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
              eq === e
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-accent"
            )}
            onClick={() => setEq(eq === e ? null : e)}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {bodyParts.map((b) => (
          <button
            key={b}
            type="button"
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
              bp === b
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-accent"
            )}
            onClick={() => setBp(bp === b ? null : b)}
          >
            {b}
          </button>
        ))}
      </div>

      <div className="divide-y divide-border rounded-2xl border bg-card">
        {fl.map((ex) => {
          const best = bestWeightFor(S, ex.id!);
          const pr = best > 0 && best1RM(S, ex.id!) != null;
          return (
            <div
              key={ex.id}
              className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent/60"
              onClick={() => exerciseDetailSheet(ex)}
            >
              <ExerciseIcon ex={ex} />
              <div className="min-w-0 grow">
                <div className="truncate text-sm font-semibold capitalize">{ex.n}</div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {ex.tg} · {ex.bp} · {isCardio(ex.id) ? "cardio" : ex.eq || "—"}
                </div>
              </div>
              {pr && (
                <span className="flex items-center gap-0.5 rounded-full bg-yellow-500/15 px-2 py-0.5 text-[11px] font-bold text-yellow-600 dark:text-yellow-500">
                  <Crown className="h-3 w-3" /> PR {fmtNum(best)}
                </span>
              )}
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-primary/10"
                aria-label={"Añadir " + ex.n}
                onClick={(e) => {
                  e.stopPropagation();
                  addToRoutineSheet(ex);
                }}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          );
        })}
        {!fl.length && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Sin resultados para esa búsqueda.
          </div>
        )}
      </div>

      <div className="mt-3 rounded-2xl border border-dashed bg-card px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-2 text-sm font-semibold">
          <Plus className="h-4 w-4" /> Ejercicio personalizado
        </div>
        <p className="mt-1 mb-3 text-xs text-muted-foreground">
          Guarda tus propios ejercicios para usarlos en las rutinas.
        </p>
        <button
          type="button"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          onClick={() => customExSheet(null)}
        >
          Crear ejercicio
        </button>
      </div>
    </div>
  );
}