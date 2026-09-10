import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  Link2,
  Plus,
  Trash2,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGym } from "../store";
import { uid } from "../lib/format";
import { exOr, esName } from "../lib/exercises";
import { supersetUnits, cleanupSg, exLine } from "../lib/history";
import { POLICIES_FOR, POLICY_NAME, POLICY_DESC } from "../lib/progression";
import { loadOfRoutine, rankOf, MUSCLE_NAME } from "../lib/muscles";
import {
  glyphPicker,
  exercisePicker,
  exConfigSheet,
  confirmSheet,
  SelectRow,
} from "../components/sheets";
import { Glyph } from "../lib/glyphs";
import { ExerciseIcon } from "../components/Media";
import { MuscleMap, MuscleMapLegend } from "../components/MuscleMap";
import { type Routine } from "../lib/types";

export default function RoutineEditView({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  const { S, update: storeUpdate } = useGym();
  const [name, setName] = useState(
    S.routines.find((r) => r.id === id)?.name || ""
  );
  const rut = S.routines.find((r) => r.id === id);
  if (!rut) return null;

  const units = supersetUnits(rut.ex);
  const load = loadOfRoutine(rut);
  const rank = rankOf(load);
  const policy = (rut.ex[0] && POLICIES_FOR[(rut.ex[0].mode || "reps") as keyof typeof POLICIES_FOR]) || POLICIES_FOR.reps;

  const update = (fn: (r: Routine) => void) =>
    storeUpdate((s) => {
      const r = s.routines.find((x) => x.id === id);
      if (r) fn(r);
    });

  const toggleLink = (i: number) =>
    update((r) => {
      const src = r.ex[i];
      const dst = r.ex[i + 1];
      if (!src || !dst) return false;
      if (src.sg && src.sg === dst.sg) {
        delete src.sg;
        delete dst.sg;
      } else {
        const g = uid().slice(0, 8);
        src.sg = g;
        dst.sg = g;
      }
    });
  const up = (i: number) =>
    update((r) => {
      if (i <= 0) return;
      [r.ex[i], r.ex[i - 1]] = [r.ex[i - 1], r.ex[i]];
      if (r.ex[i].sg && r.ex[i].sg !== r.ex[i - 1]?.sg) delete r.ex[i].sg;
      if (r.ex[i - 1].sg && r.ex[i - 1].sg !== r.ex[i].sg) delete r.ex[i - 1].sg;
      cleanupSg(r.ex);
    });
  const down = (i: number) =>
    update((r) => {
      if (i >= r.ex.length - 1) return;
      [r.ex[i], r.ex[i + 1]] = [r.ex[i + 1], r.ex[i]];
      if (r.ex[i].sg && r.ex[i].sg !== r.ex[i + 1]?.sg) delete r.ex[i].sg;
      if (r.ex[i + 1].sg && r.ex[i + 1].sg !== r.ex[i].sg) delete r.ex[i + 1].sg;
      cleanupSg(r.ex);
    });

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-32 lg:max-w-4xl lg:px-6">
      <div className="mb-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Volver"
          onClick={onBack}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="min-w-0 truncate text-xl font-bold tracking-tight">{name}</h1>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto shrink-0 text-destructive"
          aria-label="Borrar rutina"
          onClick={() =>
            confirmSheet({
              title: "¿Borrar rutina?",
              message: "Se quitará de tu plan y ya no aparecerá.",
              confirmText: "Borrar",
              danger: true,
              onConfirm: () => {
                storeUpdate((s) => {
                  s.routines = s.routines.filter((x) => x.id !== id);
                  for (let d = 0; d < 7; d++) {
                    if (s.week[d] === id) s.week[d] = "";
                  }
                });
                onBack();
              },
            })
          }
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-3 rounded-2xl border bg-card p-3 shadow-sm">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Nombre
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={(e) =>
            update((r) => {
              r.name = e.target.value.trim() || "Rutina";
            })
          }
        />
        <button
          type="button"
          className="mt-2 flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors hover:bg-accent"
          onClick={() => glyphPicker(rut.emoji, (g) => update((r) => void (r.emoji = g)))}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Glyph name={rut.emoji} className="h-5 w-5" />
          </span>
          <span className="text-sm">Cambiar icono</span>
        </button>
      </div>

      {rut.ex[0] && (
        <div className="mb-3">
          <SelectRow
            icon="settings"
            title="Progresión de las series"
            value={rut.ex[0].prog || "off"}
            options={policy.map((p) => ({ value: p, label: POLICY_NAME[p] }))}
            onChange={(v) =>
              update((r) => {
                r.ex.forEach((e) => {
                  e.prog = v;
                  if ((e.mode || "reps") === "time") {
                    if (v === "linear" || v === "greyskull" || v === "double") e.prog = "time";
                  }
                  if ((e.mode || "reps") === "cardio") e.prog = "off";
                });
              })
            }
            desc={POLICY_DESC[rut.ex[0].prog || "off"]}
            sheetTitle="Progresión"
          />
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Ejercicios ({rut.ex.length})
        </h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            exercisePicker((ex) =>
              exConfigSheet(
                ex,
                null,
                (cfg) =>
                  update((r) => {
                    const config = { ...cfg, id: ex.id };
                    r.ex.push(config);
                    cleanupSg(r.ex);
                  }),
                undefined,
                rut
              )
            )
          }
        >
          <Plus className="h-3.5 w-3.5" /> Añadir ejercicio
        </Button>
      </div>
      {rut.ex.length ? (
        <div className="divide-y divide-border rounded-2xl border bg-card">
          {rut.ex.map((c, i) => {
            const ex = exOr(c.id!);
            const sg = (() => {
              const u = units.find((uu) => uu.includes(i));
              if (!u || u.length < 2) return null;
              const idx = units.indexOf(u);
              return "Superset " + (idx + 1);
            })();
            return (
              <div key={i} className="flex items-center gap-2 px-3 py-2.5">
                <ExerciseIcon ex={ex} />
                <button
                  type="button"
                  className="min-w-0 grow text-left"
                  onClick={() =>
                    exConfigSheet(
                      ex,
                      c,
                      (cfg) =>
                        update((r) => {
                          r.ex[i] = cfg;
                          cleanupSg(r.ex);
                        }),
                      () =>
                        update((r) => {
                          r.ex.splice(i, 1);
                          cleanupSg(r.ex);
                        }),
                      rut
                    )
                  }
                >
                  <div className="truncate text-sm font-semibold">{esName(ex)}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {sg && <span className="mr-1 font-semibold text-primary">{sg} ·</span>}
                    {exLine({ ...c, id: ex.id }, S.unit)}
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent"
                    aria-label={sg ? "Desvincular" : "Vincular con el siguiente"}
                    onClick={() => toggleLink(i)}
                  >
                    <Link2
                      className={cn("h-4 w-4", sg && "text-primary")}
                      strokeWidth={sg ? 2.4 : 2}
                    />
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent disabled:opacity-30"
                    aria-label="Subir"
                    disabled={i === 0}
                    onClick={() => up(i)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent disabled:opacity-30"
                    aria-label="Bajar"
                    disabled={i === rut.ex.length - 1}
                    onClick={() => down(i)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border py-10 text-center">
          <Settings2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Esta rutina no tiene ejercicios. Añade el primero.
          </p>
        </div>
      )}

      {rut.ex.length > 0 && (
        <div className="mt-4 rounded-2xl border bg-card p-4 shadow-sm">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Músculos trabajados esta sesión
          </h4>
          <div className="grid grid-cols-5 gap-1 text-center text-[11px] font-medium">
            {rank.worked.map((m) => (
              <span key={m} title={MUSCLE_NAME[m]} className="rounded-md bg-primary/10 px-1 py-0.5">
                {MUSCLE_NAME[m]}
              </span>
            ))}
          </div>
          <MuscleMap load={load} className="mt-3" />
          <MuscleMapLegend />
        </div>
      )}
    </div>
  );
}